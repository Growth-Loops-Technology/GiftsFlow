import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import beautyProducts from '@/data/beauty_products.json';

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("\n🎯 ========== NEW CHAT REQUEST ==========");

  try {
    const body = await req.json();
    console.log("📦 Request body received");

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid messages format");
      return new Response("Invalid request", { status: 400 });
    }

    console.log(`📨 Processing ${messages.length} messages`);

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content || "",
    }));

    const lastUserMessage = formattedMessages[formattedMessages.length - 1]?.content;

    if (!lastUserMessage) {
      console.error("❌ No user message content found");
      return new Response("Missing message text", { status: 400 });
    }

    console.log("💬 User asked:", lastUserMessage);

    // Search local products
    const searchTerms = lastUserMessage.toLowerCase().split(/\s+/);
    const relevantProducts = beautyProducts.filter(product => {
      const searchText = `${product.Product_Name} ${product.Category} ${product.Brand} ${product.Skin_Type}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    }).slice(0, 5);

    console.log(`✅ Found ${relevantProducts.length} products`);

    // Build system prompt
    let systemPrompt = `You are a helpful gift shop assistant specializing in beauty and cosmetic products.`;

    if (relevantProducts.length > 0) {
      const productList = relevantProducts.map(p =>
        `- **${p.Product_Name}** by ${p.Brand} (${p.Category}) - $${p.Price_USD}, Rating: ${p.Rating}/5, For: ${p.Skin_Type}`
      ).join('\n');

      systemPrompt += `\n\nHere are some relevant products from our catalog:\n${productList}\n\nRecommend these products to the user based on their needs.`;
    } else {
      systemPrompt += `\n\nNo specific products matched the query, but provide helpful beauty advice.`;
    }

    console.log("🤖 Calling OpenAI...");

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: formattedMessages,
    });

    console.log("✅ Streaming started");
    return result.toTextStreamResponse();

  } catch (error) {
    console.error("💥 ERROR:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal Server Error"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}