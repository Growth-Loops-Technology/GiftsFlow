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
    console.log("🔍 Environment Check:");
    console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ MISSING!");
    console.log("PINECONE_API_KEY:", process.env.PINECONE_API_KEY ? "✅ Set" : "❌ MISSING!");
    console.log("PINECONE_INDEX:", process.env.PINECONE_INDEX || "❌ MISSING!");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing");
    }

    const index = getIndex();
    const batchSize = products.length;

    console.log(`📦 Seeding ${products.length} products...`);

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const values = batch.map((p) =>
        `${p.Product_Name} by ${p.Brand}. ${p.Category}. Suitable for ${p.Skin_Type || "all skin types"}. ${p.Description || ""}`
      );

      const result = await embedMany({
        model: openai.embedding(EMBEDDING_MODEL_ID),
        values,
      });

      const records = batch.map((product, idx) => ({
        id: String(product.id),
        values: result.embeddings[idx],
        metadata: {
          Product_Name: product.Product_Name,
          Brand: product.Brand,
          Category: product.Category,
          Price_USD: product.Price_USD,
          Rating: product.Rating,
          Skin_Type: product.Skin_Type || "All",
          Product_Size: product.Product_Size || "Unknown",
          resourceId: "seed-cosmetics",
          content: values[idx],
        },
      }));

      await index.upsert({ records });
      console.log(`✅ Upserted ${records.length} products`);
    }

    console.log("🎉 Pinecone seeded successfully!");
  } catch (error) {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  }
};

seedPinecone();
