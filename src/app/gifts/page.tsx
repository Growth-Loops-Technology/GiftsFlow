"use client";

import { useState, useEffect, useRef } from "react";
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

export default function GiftsChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Clear old messages on mount
  useEffect(() => {
    setMessages([]);
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");
    setLoading(true);

    // Detect if user is asking for products
    const productQueryKeywords = [
      'product', 'recommend', 'suggestion', 'need', 'want', 'looking for',
      'show me', 'find', 'search', 'moisturizer', 'cream', 'serum',
      'cleanser', 'mask', 'toner', 'oil', 'lotion', 'gel', 'balm',
      'dry skin', 'oily skin', 'sensitive skin', 'acne', 'anti-aging',
      'gift', 'best', 'good', 'help', 'for'
    ];

    const lowerQuery = userQuery.toLowerCase();
    const isProductQuery = productQueryKeywords.some(keyword => lowerQuery.includes(keyword));

    try {
      let relevantProducts: Product[] = [];

      // Only fetch products if user is asking for them
      if (isProductQuery) {
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userQuery }),
        });
        const searchData = await searchRes.json();
        relevantProducts = searchData.products || [];
      }

      // Call chat API for streaming response
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      // Get AI response
      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      if (reader) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          products: relevantProducts,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          aiResponse += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: aiResponse }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
                const products = message.products || [];

                return (
                  <div key={message.id} className="flex flex-col gap-3">
                    {/* Chat bubble */}
                    <div
                      className={`flex items-start gap-2 ${message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                        }`}
                    >
                      {message.role === "assistant" && (
                        <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      )}

                      <div
                        className={`rounded-xl px-4 py-2 max-w-[85%] text-sm shadow ${message.role === "user"
                          ? "bg-amber-600 text-white"
                          : "bg-white text-gray-800"
                          }`}
                      >
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {message.role === "user" && (
                        <User className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* 🛍️ Products under assistant - Horizontal Scrollable */}
                    {message.role === "assistant" && products.length > 0 && (
                      <div className="ml-7 w-full">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          📦 {products.length} Products Found:
                        </p>

                        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth">
                          {products.map((product) => (
                            <Card
                              key={product.id}
                              className="min-w-[280px] max-w-[280px] bg-gradient-to-br from-white to-amber-50 border-amber-100 hover:shadow-lg transition-all flex-shrink-0"
                            >
                              <CardContent className="p-3">
                                <div className="flex gap-3">
                                  <div className="w-20 h-20 bg-gradient-to-tr from-amber-100 via-orange-100 to-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm relative group">
                                    <ShoppingBag className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600">
                                      ${product.Price_USD}
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">
                                        {product.Product_Name}
                                      </h4>
                                      <p className="text-xs text-amber-600 font-semibold">
                                        {product.Brand}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>{product.Rating}/5</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-[10px] px-2 border-amber-200 hover:bg-amber-600 hover:text-white"
                                        onClick={() =>
                                          window.open(
                                            "https://example.com",
                                            "_blank"
                                          )
                                        }
                                      >
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
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
              disabled={loading || !input.trim()}
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
