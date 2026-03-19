import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@insforge/sdk";

function createServerClient() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Missing InsForge server config");
  return createClient({ baseUrl, anonKey: apiKey });
}

export async function POST(req: NextRequest) {
  let body: {
    prompt: string;
    baseImageUrl: string;
    targetNodeId: string;
    intent: "tweak" | "structural";
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, baseImageUrl, targetNodeId, intent } = body;
  if (!prompt || !baseImageUrl || !targetNodeId || !intent) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let insforge: ReturnType<typeof createServerClient>;
  try {
    insforge = createServerClient();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  // 1. Generate image via Nano Banana
  try {
    const aiRes = await insforge.ai.images.generate({
      model: "google/gemini-3-pro-image-preview",
      prompt,
      images: [{ url: baseImageUrl }],
    });
    const b64 = aiRes?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned");
    return NextResponse.json({ url: `data:image/png;base64,${b64}` });
  } catch (err) {
    return NextResponse.json(
      { error: `AI generation failed: ${err instanceof Error ? err.message : err}` },
      { status: 502 }
    );
  }
}
