
import { NextResponse } from 'next/server';
import beautyProducts from '@/data/beauty_products.json';

export async function GET() {
  return NextResponse.json(beautyProducts);
}
