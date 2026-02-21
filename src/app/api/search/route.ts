import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/vector/upstash";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log("🔍 Searching Upstash Vector DB for:", query);

        const products = await searchProducts(query, 10);

        console.log(`✅ Returning ${products.length} products found`);
        return NextResponse.json({ products });

    } catch (error) {
        console.error("💥 Search API error:", error);
        return NextResponse.json(
            { error: "Search failed", products: [] },
            { status: 500 }
        );
    }
}
