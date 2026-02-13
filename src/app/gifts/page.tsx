"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag, Star, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  Product_Name: string;
  Brand: string;
  Category: string;
  Price_USD: number;
  Rating: number;
  Product_Size: string;
  Skin_Type: string;
}

export default function GiftsChatPage() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [productsMap, setProductsMap] = useState<Record<string, Product[]>>({});

  const { messages, sendMessage, status } = useChat({
    transport: {
      call: async ({ messages }) => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        return response;
      },
    },
  });

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // 🔎 Fetch products whenever assistant responds
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    // find previous user query
    const prevUser = [...messages].reverse().find(m => m.role === "user");
    if (!prevUser) return;

    const query = prevUser.content;

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await res.json();
        if (data.products) {
          setProductsMap(prev => ({
            ...prev,
            [lastMsg.id]: data.products
          }));
        }
      } catch (e) {
        console.error("Product search failed", e);
      }
    };

    fetchProducts();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ role: "user", content: input });
    setInput("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-gray-100 pb-4">
          <CardTitle className="text-center text-xl font-semibold flex items-center justify-center gap-2">
            🎁 Gift Shop Assistant
          </CardTitle>
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
            <span>
              Based on uploaded{" "}
              <Link href="/portal" className="underline hover:text-amber-600">
                data
              </Link>
            </span>
            <span className="text-gray-300">|</span>
            <Link
              href="/cosmetics"
              className="flex items-center gap-1 hover:text-amber-600 underline"
            >
              <ShoppingBag className="w-3 h-3" /> View All Cosmetics
            </Link>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-6">
              {messages.map((message) => {
                const products = productsMap[message.id] || [];

                return (
                  <div key={message.id} className="flex flex-col gap-3">
                    {/* Chat bubble */}
                    <div
                      className={`flex items-start gap-2 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      )}

                      <div
                        className={`rounded-xl px-4 py-2 max-w-[85%] text-sm shadow ${
                          message.role === "user"
                            ? "bg-amber-600 text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>

                      {message.role === "user" && (
                        <User className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* 🛍️ Products under assistant */}
                    {message.role === "assistant" && products.length > 0 && (
                      <div className="ml-7 space-y-3">
                        <p className="text-xs text-gray-500 font-medium">
                          📦 {products.length} Products Found:
                        </p>

                        {products.map((product) => (
                          <Card
                            key={product.id}
                            className="bg-gradient-to-br from-white to-amber-50 border-amber-100 hover:shadow-lg transition-all"
                          >
                            <CardContent className="p-3 flex gap-3">
                              <div className="w-24 h-24 bg-gradient-to-tr from-amber-100 via-orange-100 to-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm relative group">
                                <ShoppingBag className="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform" />
                                <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600">
                                  ${product.Price_USD}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
                                    {product.Product_Name}
                                  </h4>
                                  <p className="text-xs text-amber-600 font-semibold mb-1">
                                    {product.Brand}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{product.Category}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{product.Rating}/5</span>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-amber-200 hover:bg-amber-600 hover:text-white"
                                    onClick={() =>
                                      window.open(
                                        "https://example.com",
                                        "_blank"
                                      )
                                    }
                                  >
                                    View
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {status === "streaming" && (
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                  <div className="bg-white px-4 py-2 rounded-xl shadow text-sm text-gray-500 animate-pulse">
                    Searching products...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="flex gap-2 pt-2">
            <Input
              placeholder="Ask about products or gift ideas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={status === "streaming" || !input.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
      
    </div>
  );
}
