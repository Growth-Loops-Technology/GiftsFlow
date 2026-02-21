import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { generateEmbeddings } from "../lib/vector/upstash";
import { Index } from "@upstash/vector";
import cosmetics from "../data/beauty_products.json";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const embeddingModel = openai.embedding(EMBEDDING_MODEL_ID);

async function seedUpstash() {
    console.log("🌱 Starting Upstash Vector seeding...");

    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
        throw new Error("UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set");
    }

    const index = new Index({
        url: url.trim(),
        token: token.trim(),
    });

    console.log(`📊 Found ${cosmetics.length} products`);

    const BATCH_SIZE = 50;
    let upserted = 0;

    for (let i = 0; i < cosmetics.length; i += BATCH_SIZE) {
        const batch = cosmetics.slice(i, i + BATCH_SIZE);

        const texts = batch.map((product) => {
            return `${product.Product_Name}. ${product.Category}. Brand: ${product.Brand}. For ${product.Skin_Type} skin. Price: $${product.Price_USD}. Rating: ${product.Rating}/5.`;
        });

        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: texts,
        });

        const vectors = batch.map((product, idx) => ({
            id: product.id,
            vector: embeddings[idx],
            metadata: {
                resourceId: product.id,
                content: texts[idx],
                productName: product.Product_Name,
                brand: product.Brand,
                category: product.Category,
                price: product.Price_USD,
                rating: product.Rating,
                skinType: product.Skin_Type,
                imageUrl: product.imageUrl || "",
                productSize: product.Product_Size || "",
            },
        }));

        await index.upsert(vectors);
        upserted += vectors.length;

        console.log(`✅ Upserted ${upserted}/${cosmetics.length} products`);
    }

    console.log("🎉 Seeding complete!");
}

seedUpstash().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
