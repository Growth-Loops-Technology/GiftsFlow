import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/vector/upstashVector";


export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log("🔥 API HIT");

    const { messages } = await req.json();
    console.log("🔥 Messages:", messages);

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request", { status: 400 });
    }

    // ✅ Convert UIMessage -> ModelMessage
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content:
        m.parts
          ?.filter((p: { type: string; text: string; }) => p.type === "text")
          ?.map((p: { text: string; }) => p.text)
          ?.join(" ") || "",
    }));

    const lastUserMessage =
      formattedMessages[formattedMessages.length - 1]?.content;

    if (!lastUserMessage) {
      return new Response("Missing message text", { status: 400 });
    }

    // 🔎 RAG
    const hits = await findRelevantContent(lastUserMessage, 4);

    const contextText =
      hits.length > 0
        ? hits
            .map((h) => h.metadata?.content ?? "")
            .filter(Boolean)
            .join("\n\n")
        : "";

    const systemPrompt = contextText
      ? `You are a helpful gift shop assistant. Answer ONLY using the knowledge base below.

Knowledge base:
${contextText}`
      : `You are a helpful gift shop assistant. No product data uploaded yet. Politely suggest uploading via portal.`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: formattedMessages, // ✅ Correct format now
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
