import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  upsertEmbeddingsWithMetadata,
} from "@/lib/vector/upstashVector";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

/* ----------------------------- Utilities ----------------------------- */

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

/* --------------------------- Image Metadata --------------------------- */

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

/* ------------------------- Row Transformation ------------------------- */

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

/* ------------------------------- POST -------------------------------- */

export async function POST(request: Request) {
  try {
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
      : `batch-${Date.now()}`;

    /* ------------------ Delete Old Vectors (Reupload Case) ------------------ */

   

    /* ------------------------ Parse Excel ------------------------ */

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
        { error: "No data rows found." },
        { status: 400 }
      );
    }

    const columns = validateAndExtractColumns(rows);

    /* ---------------- Sequential Processing (Safer) ---------------- */

    const rowData = [];

    for (const row of rows) {
      rowData.push(
        await rowToChunkWithMetadata(
          row,
          columns.nameCol,
          columns.descriptionCol,
          columns.imageCol,
          columns.otherCols
        )
      );
    }

    /* ----------------------- Upsert Vectors ----------------------- */

    await upsertEmbeddingsWithMetadata(resourceId, rowData);

    const validImages = rowData.filter((r) => r.imageMetadata.valid).length;

    return NextResponse.json({
      success: true,
      resourceId,
      rowsUpserted: rowData.length,
      imagesValid: validImages,
      imagesInvalid: rowData.length - validImages,
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
