import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(process.cwd(), ".env.local") });

import { getIndex, EMBEDDING_MODEL_ID } from "../lib/vector/pinecone";
import cosmetics from "../data/beauty_products.json";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const products = cosmetics as any[];

const seedPinecone = async () => {
  try {
    const index = getIndex();
    const batchSize = 10;

    console.log(`Seeding Pinecone index with ${products.length} products...`);
    console.log(`Using embedding model: ${EMBEDDING_MODEL_ID}`);

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const values = batch.map((p) => `${p.Product_Name} by ${p.Brand} - ${p.Category}: ${p.Description || ''}`);

      const { embeddings } = await embedMany({
        model: openai.embedding(EMBEDDING_MODEL_ID),
        values: values,
      });

      const upsertRequest = batch.map((product, idx) => ({
        id: product.id,
        values: embeddings[idx],
        metadata: {
          ...product,
          Category: product.Category,
          Usage_Frequency: product.Usage_Frequency,
          resourceId: 'seed-cosmetics',
          content: values[idx]
        },
      }));

      // @ts-ignore
      await index.upsert(upsertRequest);
      console.log(`Processed batch ${Math.ceil((i + 1) / batchSize)} / ${Math.ceil(products.length / batchSize)}`);
    }

    console.log("✅ Successfully seeded Pinecone DB");
  } catch (error) {
    console.error("❌ Error seeding Pinecone:", error);
    process.exit(1);
  }
};

seedPinecone();