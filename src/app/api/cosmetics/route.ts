import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/vector/upstash';

export async function GET() {
  try {
    // Fetch products from Upstash Vector DB
    const products = await getAllProducts(100);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Cosmetics API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
