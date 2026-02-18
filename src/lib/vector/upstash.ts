import { Index } from "@upstash/vector";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";

/**
 * Upstash Vector client
 */
function getClient(): Index {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
        throw new Error("UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set.");
    }

    return new Index({
        url: url.trim(),
        token: token.trim(),
    });
}

const embeddingModel = openai.embedding(EMBEDDING_MODEL_ID);

/**
 * Generate embedding for single query
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
 * Generate embeddings for multiple values
 */
export async function generateEmbeddings(
    values: string[]
): Promise<Array<{ content: string; embedding: number[] }>> {
    const normalized = values.map((v) =>
        v.replaceAll(/\s+/g, " ").trim()
    );

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
 * Simple text upsert
 */
export async function upsertEmbeddings(
    resourceId: string,
    chunks: string[]
): Promise<void> {
    if (chunks.length === 0) return;

    const chunkEmbeddings = await generateEmbeddings(chunks);
    const client = getClient();

    const vectors = chunkEmbeddings.map((item, i) => ({
        id: `${resourceId}-${i}`,
        vector: item.embedding,
        metadata: {
            resourceId,
            content: item.content,
        },
    }));

    await client.upsert(vectors);
}

/**
 * Row data type with image metadata
 */
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
 * Upsert with SAFE metadata (no undefined)
 */
export async function upsertEmbeddingsWithMetadata(
    resourceId: string,
    rowData: RowDataWithMetadata[]
): Promise<void> {
    if (rowData.length === 0) return;

    console.log(`[Upstash] Generating embeddings for ${rowData.length} chunks...`);
    const chunks = rowData.map((r) => r.chunk);
    const chunkEmbeddings = await generateEmbeddings(chunks);
    const client = getClient();

    console.log(`[Upstash] Upserting ${chunkEmbeddings.length} vectors for resource ${resourceId}...`);
    const vectors = chunkEmbeddings.map((item, i) => {
        const row = rowData[i];

        const metadata: Record<string, string | number | boolean> = {
            resourceId,
            content: item.content,
            imageUrl: row.imageUrl,
            imageValid: row.imageMetadata.valid,
        };

        if (row.imageMetadata.contentType !== undefined)
            metadata.imageContentType = row.imageMetadata.contentType;

        if (row.imageMetadata.size !== undefined)
            metadata.imageSize = row.imageMetadata.size;

        if (row.imageMetadata.width !== undefined)
            metadata.imageWidth = row.imageMetadata.width;

        if (row.imageMetadata.height !== undefined)
            metadata.imageHeight = row.imageMetadata.height;

        return {
            id: `${resourceId}-${i}`,
            vector: item.embedding,
            metadata,
        };
    });

    await client.upsert(vectors);
    console.log(`[Upstash] Successfully upserted to resource ${resourceId}`);
}

/**
 * Upstash search result
 */
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
        [key: string]: any;
    };
};

/**
 * Query Upstash Vector
 */
export async function findRelevantContent(
    query: string,
    topK: number = 4
): Promise<RelevantHit[]> {
    const vector = await generateEmbedding(query);
    const client = getClient();

    const results = await client.query({
        vector,
        topK,
        includeMetadata: true,
    });

    return results.map((match) => ({
        id: String(match.id),
        score: match.score || 0,
        metadata: match.metadata as RelevantHit['metadata'],
    }));
}
