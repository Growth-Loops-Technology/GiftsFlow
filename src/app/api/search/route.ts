import { NextResponse } from "next/server";
import { findRelevantContent } from "@/lib/vector/pinecone";
import beautyProducts from '@/data/beauty_products.json';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔍 Searching for:", query);

    // Try to get products from Pinecone
    try {
      const hits = await findRelevantContent(query, 5);
      console.log(`📊 Pinecone returned ${hits.length} hits`);

      if (hits.length > 0) {
        // Extract product IDs from Pinecone metadata
        const productIds = hits
          .map(hit => hit.metadata?.resourceId || hit.id)
          .filter(Boolean);

        console.log("Product IDs from Pinecone:", productIds);

        // Match with local products
        const products = beautyProducts.filter(product => 
          productIds.some(id => id.includes(product.id))
        );

        if (products.length > 0) {
          console.log(`✅ Found ${products.length} products from Pinecone`);
          return NextResponse.json({ products });
        }
      }
    } catch (pineconeError) {
      console.error("⚠️ Pinecone error, falling back to local search:", pineconeError);
    }

    // Fallback to local keyword search
    console.log("📦 Using local keyword search...");
    const searchTerms = query.toLowerCase().split(/\s+/);
    const products = beautyProducts.filter(product => {
      const searchText = `${product.Product_Name} ${product.Category} ${product.Brand} ${product.Skin_Type}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    }).slice(0, 5);

    console.log(`✅ Found ${products.length} products locally`);
    return NextResponse.json({ products });

  } catch (error) {
    console.error("💥 Search API error:", error);
    return NextResponse.json(
      { error: "Search failed", products: [] },
      { status: 500 }
    );
  }
}