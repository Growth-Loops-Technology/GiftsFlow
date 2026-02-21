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

/**
 * Fetch a single vector by ID from Upstash
 */
export async function fetchVectorById(id: string): Promise<RelevantHit | null> {
    const client = getClient();
    const results = await client.fetch([id], { includeMetadata: true });

    if (!results || results.length === 0 || !results[0]) {
        return null;
    }

    const match = results[0];
    return {
        id: String(match.id),
        score: 1, // Full match by ID
        metadata: match.metadata as RelevantHit['metadata'],
    };
}

/**
 * List vectors from Upstash (useful for the cosmetics listing)
 */
export async function listVectors(limit: number = 20, cursor: string = "0"): Promise<{ products: RelevantHit[], nextCursor: string }> {
    const client = getClient();
    const results = await client.range({
        cursor,
        limit,
        includeMetadata: true,
    });

    return {
        products: results.vectors.map(v => ({
            id: String(v.id),
            score: 1,
            metadata: v.metadata as RelevantHit['metadata'],
        })),
        nextCursor: results.nextCursor,
    };
}

/**
 * Product data type matching the beauty products schema
 */
export interface Product {
    id: string;
    Product_Name: string;
    Brand: string;
    Category: string;
    Usage_Frequency?: string;
    Price_USD: number;
    Rating: number;
    Number_of_Reviews?: number;
    Product_Size: string;
    Skin_Type: string;
    Gender_Target?: string;
    Packaging_Type?: string;
    Main_Ingredient?: string;
    Cruelty_Free?: boolean;
    Country_of_Origin?: string;
    content: string;
    imageUrl: string;
}

/**
 * Format product as searchable content
 */
export function formatProductContent(product: Product): string {
    const parts = [
        `Product: ${product.Product_Name}`,
        `Brand: ${product.Brand}`,
        `Category: ${product.Category}`,
        `Price: $${product.Price_USD}`,
        `Rating: ${product.Rating}/5`,
        `Size: ${product.Product_Size}`,
        `Skin Type: ${product.Skin_Type}`,
    ];
    
    if (product.Main_Ingredient) parts.push(`Main Ingredient: ${product.Main_Ingredient}`);
    if (product.Gender_Target) parts.push(`For: ${product.Gender_Target}`);
    
    return parts.join(". ");
}

/**
 * Upsert products to Upstash
 */
export async function upsertProducts(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    console.log(`[Products] Generating embeddings for ${products.length} products...`);
    const contents = products.map(p => formatProductContent(p));
    const embeddings = await generateEmbeddings(contents);
    const client = getClient();

    const vectors = embeddings.map((item, i) => {
        const product = products[i];
        return {
            id: product.id,
            vector: item.embedding,
            metadata: {
                type: "product",
                productName: product.Product_Name,
                brand: product.Brand,
                category: product.Category,
                price: product.Price_USD,
                rating: product.Rating,
                skinType: product.Skin_Type,
                imageUrl: product.imageUrl,
                content: item.content,
            },
        };
    });

    await client.upsert(vectors);
    console.log(`[Products] Successfully upserted ${products.length} products`);
}

/**
 * Get all products (with pagination)
 */
export async function getAllProducts(limit: number = 100): Promise<Product[]> {
    const client = getClient();
    let cursor = "0";
    let allProducts: Product[] = [];
    let iteration = 0;
    const maxIterations = 100; // Safety limit

    while (iteration < maxIterations) {
        const results = await client.range({
            cursor,
            limit: 1000,
            includeMetadata: true,
        });

        if (!results.vectors || results.vectors.length === 0) break;

        const products = results.vectors
            .filter(v => v.metadata?.productName) // Filter by product name existence instead of type
            .map(v => ({
                id: String(v.id),
                Product_Name: v.metadata?.productName || "",
                Brand: v.metadata?.brand || "",
                Category: v.metadata?.category || "",
                Price_USD: v.metadata?.price || 0,
                Rating: v.metadata?.rating || 0,
                Product_Size: v.metadata?.productSize || "",
                Skin_Type: v.metadata?.skinType || "",
                imageUrl: v.metadata?.imageUrl || "",
                content: v.metadata?.content || "",
            } as Product));

        allProducts.push(...products);

        if (allProducts.length >= limit) {
            return allProducts.slice(0, limit);
        }

        cursor = results.nextCursor;
        if (!cursor || cursor === "0") break;
        iteration++;
    }

    return allProducts;
}

/**
 * Search products with vector similarity
 */
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const hits = await findRelevantContent(query, limit);
    
    return hits
        .filter(hit => hit.metadata?.productName) // Filter by product name existence instead of type
        .map(hit => ({
            id: hit.id,
            Product_Name: hit.metadata?.productName || "",
            Brand: hit.metadata?.brand || "",
            Category: hit.metadata?.category || "",
            Price_USD: hit.metadata?.price || 0,
            Rating: hit.metadata?.rating || 0,
            Product_Size: hit.metadata?.productSize || "",
            Skin_Type: hit.metadata?.skinType || "",
            imageUrl: hit.metadata?.imageUrl || "",
            content: hit.metadata?.content || "",
        } as Product));
}
