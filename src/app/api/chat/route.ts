import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { findRelevantContent } from "@/lib/vector/pinecone";
import { z } from "zod";
import beautyProducts from '@/data/beauty_products.json';

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request", { status: 400 });
    }

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content:
        m.parts
          ?.filter((p: { type: string; text: string; }) => p.type === "text")
          ?.map((p: { text: string; }) => p.text)
          ?.join(" ") || m.content || "",
    }));

    const lastUserMessage =
      formattedMessages[formattedMessages.length - 1]?.content;

    if (!lastUserMessage) {
      return new Response("Missing message text", { status: 400 });
    }

    const hits = await findRelevantContent(lastUserMessage, 4);

    const contextText =
      hits.length > 0
        ? hits
          .map((h) => h.metadata?.content ?? "")
          .filter(Boolean)
          .join("\n\n")
        : "";

    const systemPrompt = `You are a helpful gift shop assistant.
    
    If the user asks for product recommendations, use the 'suggest_products' tool to find and display them.
    Answer using the knowledge base below when possible.
    
    Knowledge base:
    ${contextText}`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: formattedMessages,
      tools: {
        suggest_products: tool({
          description: 'Suggest products based on user needs',
          parameters: z.object({
            keywords: z.string().describe('Keywords to search for products (e.g., "moisturizer", "lipstick")'),
          }),
          // @ts-ignore
          execute: async ({ keywords }: { keywords: string }) => {
            const searchTerms = keywords.toLowerCase().split(' ');
            const relevantProducts = beautyProducts.filter(product => {
              const text = (product.Product_Name + ' ' + product.Category + ' ' + product.Brand).toLowerCase();
              return searchTerms.some((term: string) => text.includes(term));
            }).slice(0, 3); // Limit to top 3

            return relevantProducts;
          },
        }) as any,
      },
    });

    return (result as any).toDataStreamResponse();
  } catch (error) {
    console.error("💥 Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
