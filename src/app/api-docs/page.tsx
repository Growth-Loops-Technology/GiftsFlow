"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SWAGGER_UI_CDN =
  "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
const SWAGGER_UI_CSS =
  "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: {
      url: string;
      domNode: HTMLElement;
    }) => void;
  }
}

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SWAGGER_UI_CSS;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = SWAGGER_UI_CDN;
    script.async = true;
    script.onload = () => {
      if (typeof window.SwaggerUIBundle === "function") {
        window.SwaggerUIBundle({
          url: "/api/openapi",
          domNode: container,
        });
        setLoading(false);
      } else {
        setError("Swagger UI failed to load.");
        setLoading(false);
      }
    };
    script.onerror = () => {
      setError("Failed to load Swagger UI script.");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Home
        </Link>
        <span className="text-sm text-gray-500">API Docs (Swagger)</span>
      </div>
      {loading && (
        <div className="p-8 text-center text-gray-500">Loading Swagger UI…</div>
      )}
      {error && (
        <div className="p-8 text-center text-red-600">{error}</div>
      )}
      <div ref={containerRef} id="swagger-ui" className={loading ? "hidden" : ""} />
    </div>
  );
}
