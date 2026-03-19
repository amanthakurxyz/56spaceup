import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * InsForge Edge Function: generate-image
 * Secure relay to Nano Banana (Gemini Imagen API)
 */
export default async function (req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Auth: Use the user's token passed from the client
  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader?.replace('Bearer ', '') ?? null;

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
    edgeFunctionToken: userToken ?? undefined,
  });

  // Verify user is authenticated
  const { data: userData, error: authError } = await client.auth.getCurrentUser();
  if (authError || !userData?.user?.id) {
    return json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  // Parse payload
  let body: {
    prompt: string;
    baseImageUrl: string;
    targetNodeId: string;
    intent: 'tweak' | 'structural';
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { prompt, baseImageUrl, targetNodeId, intent } = body;

  if (!prompt || !baseImageUrl || !targetNodeId) {
    return json({ error: 'Missing required fields: prompt, baseImageUrl, targetNodeId' }, 400);
  }

  // Construct context-aware prompt for Nano Banana (Gemini Imagen)
  const systemContext = `You are Spaceup Agent, an expert interior design visualizer. 
You are performing a ${intent === 'tweak' ? 'LIGHT REFINEMENT' : 'STRUCTURAL REDESIGN'} on an interior space.
Base Image for context: ${baseImageUrl}
Instructions: ${prompt}

Generate a photorealistic, high-quality interior design image that strictly follows these instructions while maintaining spatial consistency and realistic proportions from the base image.`;

  try {
    // 1. Call Gemini Imagen API (Nano Banana)
    // Note: In InsForge, images.generate handles image-to-image context if provided in prompt/params
    // Mapping modelId to Gemini Imagen
    const aiResponse = await client.ai.images.generate({
      model: 'google/gemini-3-pro-image-preview',
      prompt: systemContext,
    });

    const b64 = aiResponse?.data?.[0]?.b64_json;
    if (!b64) {
      return json({ error: 'AI model failed to generate an image' }, 502);
    }

    // 2. Upload to spaceup-canvas storage bucket
    // Convert base64 to binary
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    // Generate unique storage path
    const timestamp = Date.now();
    const objectKey = `generations/${targetNodeId}/${timestamp}.png`;
    
    const { data: uploadData, error: uploadError } = await client.storage
      .from('spaceup-canvas')
      .upload(objectKey, blob);

    if (uploadError || !uploadData?.url) {
      console.error('Upload Error:', uploadError);
      return json({ error: 'Failed to upload image to InsForge Storage' }, 500);
    }

    // 3. Return the new URL
    return json({ url: uploadData.url });

  } catch (err: unknown) {
    console.error('Pipeline Error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return json({ error: `AI Pipeline Error: ${errorMessage}` }, 500);
  }
}
