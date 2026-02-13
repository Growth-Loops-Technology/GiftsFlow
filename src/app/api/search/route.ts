import { NextResponse } from "next/server";
import { findRelevantContent } from "@/lib/vector/pinecone";
import beautyProducts from "@/data/beauty_products.json";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log("🔍 Searching for:", query);

        // 🔹 Pinecone search
        try {
            const hits = await findRelevantContent(query, 5);
            console.log(`📊 Pinecone returned ${hits.length} hits`);

            if (hits.length > 0) {
                const productIds = hits
                    .map(hit => hit.metadata?.resourceId || hit.id)
                    .filter(Boolean);

                const products = beautyProducts.filter(product =>
                    productIds.includes(product.id)
                );

                if (products.length > 0) {
                    console.log(`✅ Found ${products.length} products from Pinecone`);
                    return NextResponse.json({ products });
                }
            }
        } catch (err) {
            console.warn("⚠️ Pinecone failed, fallback search");
        }

        // 🔹 Smart local search
        console.log("📦 Using smart local search...");
        const q = query.toLowerCase();

        const products = beautyProducts
            .map(product => {
                const text = `${product.Product_Name} ${product.Category} ${product.Brand} ${product.Skin_Type}`.toLowerCase();

                let score = 0;
                if (text.includes(q)) score += 3;

                q.split(/\s+/).forEach(w => {
                    if (text.includes(w)) score += 1;
                });

                return { product, score };
            })
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(p => p.product);

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
