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

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Auth
  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader?.replace('Bearer ', '') ?? null;

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
    edgeFunctionToken: userToken ?? undefined,
  });

  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user?.id) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const userId = userData.user.id;

  // Parse input
  let body: {
    base_image_url: string;
    context_image_urls?: string[];
    prompt: string;
    project_id: string;
    parent_node_id?: string;
    position_x?: number;
    position_y?: number;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const {
    base_image_url,
    context_image_urls = [],
    prompt,
    project_id,
    parent_node_id = null,
    position_x = 0,
    position_y = 0,
  } = body;

  if (!base_image_url || !prompt || !project_id) {
    return json({ error: 'Missing required fields: base_image_url, prompt, project_id' }, 400);
  }

  // Build multimodal message for Gemini image editing
  const contextPart = context_image_urls.length > 0
    ? `\n\nContext images for reference: ${context_image_urls.join(', ')}`
    : '';

  const fullPrompt = `You are an expert interior design AI. Edit the provided interior design image based on this instruction:\n\n${prompt}${contextPart}\n\nBase image to edit: ${base_image_url}\n\nGenerate the edited interior design image maintaining spatial consistency and realistic proportions.`;

  // Call Gemini image generation (Nano Banana)
  let generatedImageB64: string;
  try {
    const imageResponse = await client.ai.images.generate({
      model: 'google/gemini-3-pro-image-preview',
      prompt: fullPrompt,
    });

    const b64 = imageResponse?.data?.[0]?.b64_json;
    if (!b64) {
      return json({ error: 'No image returned from AI model' }, 502);
    }
    generatedImageB64 = b64;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `AI generation failed: ${message}` }, 502);
  }

  // Upload to spaceup-canvas storage
  const binary = atob(generatedImageB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/png' });

  const objectKey = `${project_id}/${crypto.randomUUID()}.png`;
  const { data: uploadData, error: uploadError } = await client.storage
    .from('spaceup-canvas')
    .upload(objectKey, blob);

  if (uploadError || !uploadData?.url) {
    return json({ error: 'Failed to upload generated image to storage' }, 500);
  }

  const imageUrl = uploadData.url;

  // Insert new canvas_node (Design Tree leaf)
  const { data: nodeData, error: nodeError } = await client.database
    .from('canvas_nodes')
    .insert([{
      project_id,
      parent_node_id,
      node_type: 'iteration',
      image_url: imageUrl,
      position_x,
      position_y,
      width: 512,
      height: 512,
      edge_prompt: prompt,
      created_by: userId,
    }])
    .select()
    .single();

  if (nodeError || !nodeData) {
    return json({ error: 'Failed to save canvas node' }, 500);
  }

  return json({ node: nodeData });
}
