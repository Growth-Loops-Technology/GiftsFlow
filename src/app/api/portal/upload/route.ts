import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import { upsertEmbeddingsWithMetadata } from "@/lib/vector/upstashVector";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

/**
 * Normalize column names (case-insensitive, trim whitespace).
 */
function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Find column name (case-insensitive) in headers.
 */
function findColumn(
  headers: string[],
  target: string
): string | undefined {
  const normalized = normalizeColumnName(target);
  return headers.find((h) => normalizeColumnName(h) === normalized);
}

/**
 * Validate required columns exist and extract them.
 */
function validateAndExtractColumns(
  rows: Record<string, unknown>[]
): {
  nameCol: string;
  descriptionCol: string;
  imageCol: string;
  otherCols: string[];
} {
  if (rows.length === 0) {
    throw new Error("No rows to validate");
  }
  const headers = Object.keys(rows[0]);
  const nameCol = findColumn(headers, "name");
  const descriptionCol = findColumn(headers, "description");
  const imageCol = findColumn(headers, "image");

  if (!nameCol) {
    throw new Error('Required column "Name" not found');
  }
  if (!descriptionCol) {
    throw new Error('Required column "Description" not found');
  }
  if (!imageCol) {
    throw new Error('Required column "Image" not found');
  }

  const otherCols = headers.filter(
    (h) =>
      normalizeColumnName(h) !== normalizeColumnName(nameCol) &&
      normalizeColumnName(h) !== normalizeColumnName(descriptionCol) &&
      normalizeColumnName(h) !== normalizeColumnName(imageCol)
  );

  return { nameCol, descriptionCol, imageCol, otherCols };
}

/**
 * Fetch image metadata from URL (dimensions, content-type, etc.).
 */
async function fetchImageMetadata(
  imageUrl: string
): Promise<{
  url: string;
  width?: number;
  height?: number;
  contentType?: string;
  size?: number;
  valid: boolean;
}> {
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    if (!response.ok) {
      return { url: imageUrl, valid: false };
    }
    const contentType = response.headers.get("content-type") || undefined;
    const contentLength = response.headers.get("content-length");
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    // Try to get dimensions if it's an image
    if (contentType?.startsWith("image/")) {
      // For dimensions, we'd need to fetch the image, but that's expensive.
      // For now, just return what we have from HEAD.
      return {
        url: imageUrl,
        contentType,
        size,
        valid: true,
      };
    }
    return { url: imageUrl, contentType, size, valid: true };
  } catch (err) {
    console.warn(`Failed to fetch image metadata for ${imageUrl}:`, err);
    return { url: imageUrl, valid: false };
  }
}

/**
 * Convert a row to chunk text and extract image metadata.
 */
async function rowToChunkWithMetadata(
  row: Record<string, unknown>,
  nameCol: string,
  descriptionCol: string,
  imageCol: string,
  otherCols: string[]
): Promise<{
  chunk: string;
  imageUrl: string;
  imageMetadata: Awaited<ReturnType<typeof fetchImageMetadata>>;
}> {
  const name = String(row[nameCol] ?? "").trim();
  const description = String(row[descriptionCol] ?? "").trim();
  const imageUrl = String(row[imageCol] ?? "").trim();

  if (!name || !description || !imageUrl) {
    throw new Error(
      `Row missing required fields. Name: ${name}, Description: ${description}, Image: ${imageUrl}`
    );
  }

  // Build chunk text: prioritize Name and Description, then other fields
  const parts: string[] = [`Name: ${name}`, `Description: ${description}`];
  otherCols.forEach((col) => {
    const val = row[col];
    if (val != null && String(val).trim() !== "") {
      parts.push(`${col}: ${val}`);
    }
  });

  const chunk = parts.join(". ");
  const imageMetadata = await fetchImageMetadata(imageUrl);

  return { chunk, imageUrl, imageMetadata };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const shopId = formData.get("shopId"); // optional

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file. Send a file in form field 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const contentType = file.type;
    const name = file.name.toLowerCase();
    const isExcel =
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      ALLOWED_TYPES.includes(contentType);
    if (!isExcel) {
      return NextResponse.json(
        { error: "Invalid file type. Use .xlsx or .xls." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json(
        { error: "Excel file has no sheets." },
        { status: 400 }
      );
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found. Ensure the first row is headers." },
        { status: 400 }
      );
    }

    // Validate required columns exist
    let columns;
    try {
      columns = validateAndExtractColumns(rows);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Column validation failed" },
        { status: 400 }
      );
    }

    // Process rows: extract chunks and image metadata
    const rowData = await Promise.all(
      rows.map((row) =>
        rowToChunkWithMetadata(
          row,
          columns.nameCol,
          columns.descriptionCol,
          columns.imageCol,
          columns.otherCols
        )
      )
    );

    // Validate all rows have required fields
    const invalidRows = rowData.filter((r) => !r.chunk || !r.imageUrl);
    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: `${invalidRows.length} row(s) missing required fields (Name, Description, or Image).`,
        },
        { status: 400 }
      );
    }

    const resourceId =
      typeof shopId === "string" && shopId.trim()
        ? `shop-${z.string().min(1).parse(shopId.trim())}-${Date.now()}`
        : `batch-${Date.now()}`;

    await upsertEmbeddingsWithMetadata(resourceId, rowData);

    const validImages = rowData.filter((r) => r.imageMetadata.valid).length;
    const invalidImages = rowData.length - validImages;

    return NextResponse.json({
      success: true,
      resourceId,
      rowsUpserted: rowData.length,
      imagesValid: validImages,
      imagesInvalid: invalidImages,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid shopId." },
        { status: 400 }
      );
    }
    console.error("Portal upload error:", err);
    return NextResponse.json(
      { error: "Failed to process upload. Check server logs." },
      { status: 500 }
    );
  }
}
