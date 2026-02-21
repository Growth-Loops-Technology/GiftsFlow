import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/vector/upstash";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get all products and find by ID
        const products = await getAllProducts(10000);
        const product = products.find(p => p.id === id);

        if (product) {
            return NextResponse.json(product);
        }

        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    } catch (error) {
        console.error("Product API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
