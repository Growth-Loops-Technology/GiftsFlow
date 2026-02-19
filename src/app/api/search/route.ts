import { NextResponse } from "next/server";
import beautyProducts from "@/data/beauty_products.json";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log("🔍 Searching locally for:", query);

        const searchTerms = query.toLowerCase().split(/\s+/);

        const products = (beautyProducts as any[]).filter(product => {
            const searchText = `${product.Product_Name} ${product.Category} ${product.Brand} ${product.Skin_Type}`.toLowerCase();
            return searchTerms.some((term: string) => searchText.includes(term));
        }).slice(0, 10);

        console.log(`✅ Returning ${products.length} products found locally`);
        return NextResponse.json({ products });

    } catch (error) {
        console.error("💥 Search API error:", error);
        return NextResponse.json(
            { error: "Search failed", products: [] },
            { status: 500 }
        );
    }
}
