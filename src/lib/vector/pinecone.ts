import { Pinecone } from "@pinecone-database/pinecone";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";

/**
 * Pinecone client
 */
function getClient(): Pinecone {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        throw new Error("PINECONE_API_KEY must be set.");
    }
    return new Pinecone({ apiKey });
}

/**
 * Pinecone index
 */
export function getIndex() {
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) {
        throw new Error("PINECONE_INDEX must be set.");
    }
    return getClient().index(indexName);
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

    const vectors = chunkEmbeddings.map((item, i) => ({
        id: `${resourceId}-${i}`,
        values: item.embedding,
        metadata: {
            resourceId,
            content: item.content,
        },
    }));

    await getIndex().upsert(vectors);
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

    const chunks = rowData.map((r) => r.chunk);
    const chunkEmbeddings = await generateEmbeddings(chunks);

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
            values: item.embedding,
            metadata,
        };
    });

    await getIndex().upsert(vectors);
}

/**
 * Pinecone search result
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
 * Query Pinecone
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

    return results.matches.map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
    }));
}
