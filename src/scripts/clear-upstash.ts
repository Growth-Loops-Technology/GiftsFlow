import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Index } from "@upstash/vector";

async function clearUpstash() {
    console.log("🧨 Preparing to clear Upstash Vector index...");

    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
        throw new Error("Missing Upstash credentials in .env.local");
    }

    const index = new Index({
        url: url.trim(),
        token: token.trim(),
    });

    try {
        // This removes all vectors and metadata from the index
        await index.reset();
        console.log("✨ Success: The index has been completely cleared.");
    } catch (error) {
        console.error("❌ Failed to clear index:", error);
    }
}

clearUpstash();