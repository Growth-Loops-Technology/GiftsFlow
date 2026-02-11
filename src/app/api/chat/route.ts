import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { findRelevantContent } from "@/lib/vector/upstashVector";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body as { message?: string };

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Missing or invalid message." },
        { status: 400 }
      );
    }

    const hits = await findRelevantContent(message.trim(), 4);
    const contextText =
      hits.length > 0
        ? hits
            .map((h) => h.metadata?.content ?? "")
            .filter(Boolean)
            .join("\n\n")
        : "";

    const systemPrompt = contextText
      ? `You are a helpful gift shop assistant. Answer using only the following product/knowledge base. If the answer is not in the context, say you don't have that information.\n\nKnowledge base:\n${contextText}`
      : "You are a helpful gift shop assistant. You have no product data in the knowledge base yet. Ask the user to upload an Excel file via the portal, or answer general gift ideas politely.";

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: message.trim(),
    });

    return Response.json({ message: result.text });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const status = (err as { status?: number })?.status === 429 ? 429 : 500;
    return Response.json(
      {
        error:
          status === 429
            ? "OpenAI quota exceeded."
            : "Internal server error. Check server logs.",
      },
      { status }
    );
  }
}
