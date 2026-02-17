import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import beautyProductsJson from '@/data/beauty_products.json';

interface BeautyProduct {
  id: string;
  Product_Name: string;
  Brand: string;
  Category: string;
  Price_USD: number;
  Rating: number;
  Skin_Type: string;
}

const beautyProducts = beautyProductsJson as unknown as BeautyProduct[];

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

    // Detect if user is asking for product recommendations
    const productKeywords = [
      'product', 'moisturizer', 'cream', 'serum', 'cleanser', 'mask', 'toner', 'oil', 'lotion', 'gel', 'balm',
      'face wash', 'lipstick', 'foundation', 'sunscreen', 'shampoo', 'conditioner'
    ];

    const needsClarificationKeywords = [
      'gift', 'daughter', 'mother', 'friend', 'someone', 'present', 'recommend', 'suggestion', 'best', 'good', 'help', 'looking for'
    ];

    const lowerQuery = lastUserMessage.toLowerCase();

    // It's a product query if it mentions specific products or is a vague request that needs narrowing down
    const isDirectProductQuery = productKeywords.some(keyword => lowerQuery.includes(keyword));
    const isVagueGiftQuery = needsClarificationKeywords.some(keyword => lowerQuery.includes(keyword));

    const isProductContext = isDirectProductQuery || isVagueGiftQuery;

    console.log(`🔍 Context: Direct=${isDirectProductQuery}, Vague=${isVagueGiftQuery}`);

    let relevantProducts: any[] = [];

    // Higher threshold for specificity if it's a gift query
    const mentionsSpecificProduct = productKeywords.some(keyword => lowerQuery.includes(keyword));
    const isActuallySpecific = mentionsSpecificProduct || (lowerQuery.length > 50);

    if (isProductContext && isActuallySpecific) {
      const searchTerms = lastUserMessage.toLowerCase().split(/\s+/);
      relevantProducts = beautyProducts.filter((product: BeautyProduct) => {
        const searchText = `${product.Product_Name} ${product.Category} ${product.Brand} ${product.Skin_Type}`.toLowerCase();
        return searchTerms.some((term: string) => searchText.includes(term));
      }).slice(0, 5);

      console.log(`✅ Found ${relevantProducts.length} products`);
    }

    // Build system prompt
    let systemPrompt = `You are a consultative gift shop assistant specializing in beauty and cosmetic products.
    
    GUIDELINES:
    1. If a user asks a broad question like "I want a gift for my daughter", DO NOT suggest products immediately.
    2. Instead, ask 1-2 clarifying questions to narrow down the choice (e.g., her age range, skin type, or if she prefers skincare or makeup).
    3. Only recommend products once the user's needs are specific enough.
    4. When recommending, use modern, friendly language and explain WHY you chose those products.
    5. If no products match, politely explain and offer to help with general advice.`;

    if (relevantProducts.length > 0) {
      const productList = relevantProducts.map(p =>
        `- **${p.Product_Name}** by ${p.Brand} (${p.Category}) - $${p.Price_USD}, Rating: ${p.Rating}/5, For: ${p.Skin_Type}`
      ).join('\n');

      systemPrompt += `\n\nCURRENT PRODUCT MATCHES:\n${productList}\n\nPlease recommend these specific products based on the conversation history.`;
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