"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function PortalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [shopId, setShopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Please select an Excel file." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shopId.trim()) formData.append("shopId", shopId.trim());

      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Upload failed." });
        return;
      }
      setMessage({
        type: "success",
        text: `Uploaded ${data.rowsUpserted} rows. Resource ID: ${data.resourceId}.`,
      });
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Gift Shop Portal
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Upload your product data (Excel). Rows will be embedded and stored for search.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Shop ID (optional)</label>
              <Input
                placeholder="e.g. my-shop"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium mb-1 block">
                  Excel file (.xlsx or .xls)
                </label>
                <a
                  className="text-sm underline text-muted-foreground hover:text-foreground"
                  href="/sample-gift-upload.xlsx"
                  download
                >
                  Download sample
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              <Upload className="w-4 h-4" />
              {loading ? "Uploading…" : "Upload & embed"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/gifts" className="underline">
              Chat over your uploaded data
            </Link>
          </p>
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
