import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import * as XLSX from 'xlsx';
import { z } from "zod";
import {
  upsertEmbeddingsWithMetadata,
} from "@/lib/vector/upstash";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];


function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase();
}

function findColumn(headers: string[], target: string): string | undefined {
  const normalized = normalizeColumnName(target);
  return headers.find((h) => normalizeColumnName(h) === normalized);
}

function validateAndExtractColumns(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    throw new Error("No rows to validate");
  }

  const headers = Object.keys(rows[0]);

  const nameCol = findColumn(headers, "name");
  const descriptionCol = findColumn(headers, "description");
  const imageCol = findColumn(headers, "image");

  if (!nameCol) throw new Error('Required column "Name" not found');
  if (!descriptionCol) throw new Error('Required column "Description" not found');
  if (!imageCol) throw new Error('Required column "Image" not found');

  const otherCols = headers.filter(
    (h) =>
      normalizeColumnName(h) !== normalizeColumnName(nameCol) &&
      normalizeColumnName(h) !== normalizeColumnName(descriptionCol) &&
      normalizeColumnName(h) !== normalizeColumnName(imageCol)
  );

  return { nameCol, descriptionCol, imageCol, otherCols };
}


async function fetchImageMetadata(imageUrl: string) {
  if (!imageUrl.startsWith("http")) {
    return { url: imageUrl, valid: false };
  }

  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    if (!response.ok) {
      return { url: imageUrl, valid: false };
    }

    const contentType = response.headers.get("content-type") || undefined;
    const contentLength = response.headers.get("content-length");
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    return {
      url: imageUrl,
      contentType,
      size,
      valid: true,
    };
  } catch (err) {
    console.warn(`Image metadata fetch failed: ${imageUrl}`, err);
    return { url: imageUrl, valid: false };
  }
}

async function rowToChunkWithMetadata(
  row: Record<string, unknown>,
  nameCol: string,
  descriptionCol: string,
  imageCol: string,
  otherCols: string[]
) {
  const name = String(row[nameCol] ?? "").trim();
  const description = String(row[descriptionCol] ?? "").trim();
  const imageUrl = String(row[imageCol] ?? "").trim();

  if (!name || !description || !imageUrl) {
    throw new Error(
      `Row missing required fields. Name: ${name}, Description: ${description}, Image: ${imageUrl}`
    );
  }

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    // Check if user is vendor or admin
    if (token.role !== "VENDOR" && token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only vendors and admins can upload products." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const shopId = formData.get("shopId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file. Send a file in form field 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 5MB allowed." },
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

    const parsedShopId =
      typeof shopId === "string"
        ? z.string().min(1).parse(shopId.trim())
        : null;

    const resourceId = parsedShopId
      ? `shop-${parsedShopId}`
      : `batch-${Date.now()}`
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

    console.log(`[Portal Upload] Found ${rows.length} rows in sheet "${firstSheetName}"`);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found." },
        { status: 400 }
      );
    }

    let columns;
    try {
      columns = validateAndExtractColumns(rows);
      console.log(`[Portal Upload] Columns validated:`, columns);
    } catch (err: any) {
      console.error(`[Portal Upload] Column validation failed:`, err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.log(`[Portal Upload] Starting parallel processing of ${rows.length} rows...`);

    // Process rows in parallel to avoid timeouts
    const rowData = await Promise.all(
      rows.map(async (row, index) => {
        try {
          return await rowToChunkWithMetadata(
            row,
            columns.nameCol,
            columns.descriptionCol,
            columns.imageCol,
            columns.otherCols
          );
        } catch (err: any) {
          console.error(`[Portal Upload] Error processing row ${index + 1}:`, err.message);
          throw err; // Re-throw to be caught by the outer catch
        }
      })
    );

    console.log(`[Portal Upload] Finished row processing. Generating embeddings and upserting to Upstash...`);
    await upsertEmbeddingsWithMetadata(resourceId, rowData);
    console.log(`[Portal Upload] Successfully upserted ${rowData.length} vectors to resource ${resourceId}`);

    const validImages = rowData.filter((r) => r.imageMetadata.valid).length;

    return NextResponse.json({
      success: true,
      resourceId,
      rowsUpserted: rowData.length,
      imagesValid: validImages,
      imagesInvalid: rowData.length - validImages,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid shopId." },
        { status: 400 }
      );
    }

    console.error("Portal upload error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to process upload. Check server logs." },
      { status: 500 }
    );
  }
}
