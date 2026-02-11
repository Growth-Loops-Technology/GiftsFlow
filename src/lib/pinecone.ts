import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
config({ path: ".env.local" });

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_APIKEY!,
  });
};
