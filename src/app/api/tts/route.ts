import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;
const VOICE = "nova";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
      });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: VOICE,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText); // 👈 LOG the exact OpenAI response
      return new Response(JSON.stringify({ error: "TTS failed", details: errText }), {
        status: 500,
      });
    }

    const buffer = await response.arrayBuffer();
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error); // 👈 See runtime errors
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
