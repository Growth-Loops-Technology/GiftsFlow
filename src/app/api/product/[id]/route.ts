import { NextResponse } from "next/server";
import beautyProducts from "@/data/beauty_products.json";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = (beautyProducts as any[]).find(p => p.id === id);

        if (product) {
            return NextResponse.json(product);
        }

        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    } catch (error) {
        console.error("Product API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
