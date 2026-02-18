import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Index } from "@upstash/vector";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

async function diagnose() {
    console.log("🔍 Starting Diagnostics...");

    // 1. Check Env
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    const openAiKey = process.env.OPENAI_API_KEY;

    console.log("Environment check:");
    console.log("- UPSTASH_VECTOR_REST_URL:", url ? "Set ✅" : "Missing ❌");
    console.log("- UPSTASH_VECTOR_REST_TOKEN:", token ? "Set ✅" : "Missing ❌");
    console.log("- OPENAI_API_KEY:", openAiKey ? "Set ✅" : "Missing ❌");

    if (!url || !token || !openAiKey) {
        process.exit(1);
    }

    // 2. Test OpenAI Embedding
    try {
        console.log("\n🧪 Testing OpenAI Embedding...");
        const { embedding } = await embed({
            model: openai.embedding("text-embedding-3-small"),
            value: "Test diagnostic message",
        });
        console.log("✅ OpenAI Embedding successful! Length:", embedding.length);
    } catch (err: any) {
        console.error("❌ OpenAI Embedding failed:", err.message);
    }

    // 3. Test Upstash Vector Connectivity
    try {
        console.log("\n🧪 Testing Upstash Vector Connectivity...");
        const index = new Index({
            url: url.trim(),
            token: token.trim(),
        });
        const info = await index.info();
        console.log("✅ Upstash connection successful!");
        console.log("Index Info:", JSON.stringify(info, null, 2));
    } catch (err: any) {
        console.error("❌ Upstash connection failed:", err.message);
    }
}

diagnose().catch(console.error);
