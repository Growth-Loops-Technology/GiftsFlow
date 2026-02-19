import { NextResponse } from 'next/server';
import beautyProducts from '@/data/beauty_products.json';

export async function GET() {
  try {
    // Return a subset or full list depending on requirements
    // For now, let's return the first 100 for the listing
    return NextResponse.json((beautyProducts as any[]).slice(0, 100));
  } catch (error) {
    console.error("Cosmetics API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
