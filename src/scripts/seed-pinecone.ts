import { getPineconeClient } from "@/lib/pinecone";
import cosmetics from "../data/beauty_products.json";
import { InferenceClient } from "@huggingface/inference";
import { config } from "dotenv";
config({ path: ".env.local" });

const products = cosmetics as any[];

const seedPinecone = async () => {
  try {
    // Initialize clients
    const indexName = process.env.PINECONE_INDEX || "";
    const pinecone = getPineconeClient();
    const index = pinecone.Index(indexName);
    const hf = new InferenceClient(process.env.HF_TOKEN!);

    const batchSize = 10;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      // Generate embeddings
      const embeddings = await hf.featureExtraction({
        model: process.env.EMBEDDING_MODEL!,
        inputs: batch.map(
          (p) => `${p.Product_Name} by ${p.Brand}`
        ),
      });

      const upsertRequest = batch.map((product, idx) => ({
        id: product.id,
        values: Array.isArray(embeddings[idx])
          ? (embeddings[idx] as number[])
          : [embeddings[idx] as number],
        metadata: {
          ...product,
          Category: product.Category,
          Usage_Frequency: product.Usage_Frequency,
        },
      }));

        await index.upsert({
            records: upsertRequest,
        });
      console.log(`Processed batch ${i / batchSize + 1}`);
    }

    console.log("Successfully seeded Pinecone DB");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedPinecone();
