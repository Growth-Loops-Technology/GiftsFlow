import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "GiftsFlow API",
    description: "Gift shop portal: Excel upload, embeddings, and RAG chat.",
    version: "1.0.0",
  },
  servers: [
    { url: "/", description: "Current origin" },
  ],
  paths: {
    "/api/completion/test": {
      post: {
        summary: "Simple completion",
        description: "Single-turn text completion (e.g. cosmetics chatbot).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", description: "User message" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Completion result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "429": { description: "OpenAI quota exceeded" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/portal/upload": {
      post: {
        summary: "Upload Excel to vector DB",
        description:
          "Upload a gift shop Excel file. Rows are parsed, embedded, and upserted into Upstash Vector. **Required columns:** Name, Description, Image (URL). Image URLs are validated and metadata (content-type, size) is stored.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "Excel file (.xlsx or .xls), max 5MB. Must have columns: Name, Description, Image (case-insensitive).",
                  },
                  shopId: {
                    type: "string",
                    description: "Optional shop identifier",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Upload success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    resourceId: { type: "string" },
                    rowsUpserted: { type: "integer" },
                    imagesValid: {
                      type: "integer",
                      description: "Number of valid image URLs",
                    },
                    imagesInvalid: {
                      type: "integer",
                      description: "Number of invalid/unreachable image URLs",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description:
              "Bad request (missing file, wrong type, missing required columns, empty rows, invalid image URLs)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { error: { type: "string" } },
                },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
    },
    "/api/chat": {
      post: {
        summary: "RAG chat over gift data",
        description:
          "Send a message; relevant chunks are retrieved from the vector DB and used as context for the LLM reply.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", description: "User message" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Assistant reply",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "400": {
            description: "Missing or invalid message",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { error: { type: "string" } },
                },
              },
            },
          },
          "429": { description: "OpenAI quota exceeded" },
          "500": { description: "Internal server error" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
