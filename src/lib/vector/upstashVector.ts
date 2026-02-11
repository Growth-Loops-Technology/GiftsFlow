import { Index } from "@upstash/vector";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL_ID = "text-embedding-3-small";

function getIndex(): Index {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set."
    );
  }
  return new Index({ url, token });
}

const embeddingModel = openai.embedding(EMBEDDING_MODEL_ID);

/**
 * Generate embedding for a single query (for search).
 */
export async function generateEmbedding(value: string): Promise<number[]> {
  const input = value.replaceAll(/\s+/g, " ").trim();
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
}

/**
 * Generate embeddings for multiple chunks (e.g. Excel rows). Uses same order as input.
 */
export async function generateEmbeddings(
  values: string[]
): Promise<Array<{ content: string; embedding: number[] }>> {
  const normalized = values.map((v) => v.replaceAll(/\s+/g, " ").trim());
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: normalized,
  });
  return normalized.map((content, i) => ({
    content,
    embedding: embeddings[i],
  }));
}

/**
 * Upsert text chunks (e.g. from Excel rows) into Upstash Vector with optional resourceId for filtering.
 */
export async function upsertEmbeddings(
  resourceId: string,
  chunks: string[]
): Promise<void> {
  if (chunks.length === 0) return;
  const chunkEmbeddings = await generateEmbeddings(chunks);
  const toUpsert = chunkEmbeddings.map((item, i) => ({
    id: `${resourceId}-${i}`,
    vector: item.embedding,
    metadata: {
      resourceId,
      content: item.content,
    },
  }));
  await getIndex().upsert(toUpsert);
}

export type RowDataWithMetadata = {
  chunk: string;
  imageUrl: string;
  imageMetadata: {
    url: string;
    width?: number;
    height?: number;
    contentType?: string;
    size?: number;
    valid: boolean;
  };
};

/**
 * Upsert chunks with image metadata (e.g. from Excel upload with Name, Description, Image columns).
 */
export async function upsertEmbeddingsWithMetadata(
  resourceId: string,
  rowData: RowDataWithMetadata[]
): Promise<void> {
  if (rowData.length === 0) return;
  const chunks = rowData.map((r) => r.chunk);
  const chunkEmbeddings = await generateEmbeddings(chunks);
  const toUpsert = chunkEmbeddings.map((item, i) => {
    const row = rowData[i];
    return {
      id: `${resourceId}-${i}`,
      vector: item.embedding,
      metadata: {
        resourceId,
        content: item.content,
        imageUrl: row.imageUrl,
        imageValid: row.imageMetadata.valid,
        imageContentType: row.imageMetadata.contentType,
        imageSize: row.imageMetadata.size,
        imageWidth: row.imageMetadata.width,
        imageHeight: row.imageMetadata.height,
      },
    };
  });
  await getIndex().upsert(toUpsert);
}

export type RelevantHit = {
  id: string;
  score: number;
  metadata?: {
    resourceId?: string;
    content?: string;
    imageUrl?: string;
    imageValid?: boolean;
    imageContentType?: string;
    imageSize?: number;
    imageWidth?: number;
    imageHeight?: number;
  };
};

/**
 * Query Upstash Vector for top-k similar chunks. Use for RAG context.
 */
export async function findRelevantContent(
  query: string,
  topK: number = 4
): Promise<RelevantHit[]> {
  const vector = await generateEmbedding(query);
  const results = await getIndex().query({
    vector,
    topK,
    includeMetadata: true,
  });
  return results as RelevantHit[];
}
