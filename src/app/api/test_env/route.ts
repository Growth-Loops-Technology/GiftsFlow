import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasPineconeKey: !!process.env.PINECONE_APIKEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });
}