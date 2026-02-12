import { Pinecone } from "@pinecone-database/pinecone";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";

function getClient(): Pinecone {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        throw new Error("PINECONE_API_KEY must be set.");
    }
    return new Pinecone({ apiKey });
}

export function getIndex() {
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) {
        throw new Error("PINECONE_INDEX must be set.");
    }
    return getClient().index(indexName);
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
 * Generate embeddings for multiple chunks.
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
 * Upsert text chunks into Pinecone.
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

    await getIndex().upsert(vectors as any);
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
 * Upsert chunks with image metadata into Pinecone.
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
        return {
            id: `${resourceId}-${i}`,
            values: item.embedding,
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

    await getIndex().upsert(vectors as any);
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
        [key: string]: any;
    };
};

/**
 * Query Pinecone for top-k similar chunks.
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

    return results.matches.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
    }));
}
