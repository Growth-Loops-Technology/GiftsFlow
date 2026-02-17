"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag, Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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

// ... (Product and Message interfaces are the same)

function ProductRow({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    // Check initial overflow with multiple attempts
    const timers = [100, 500, 1000].map(ms => setTimeout(handleScroll, ms));
    return () => timers.forEach(clearTimeout);
  }, [products]);

  // If there are more than 2 products, we likely have overflow on mobile/small desktop
  const hasMultipleProducts = products.length > 2;

  return (
    <div className="ml-7 w-full relative group pr-6">
      <p className="text-xs text-gray-500 font-medium mb-2">
        📦 {products.length} Products Found:
      </p>

      {/* Navigation Arrows - Using group-hover to ensure they are seen but also always checking overflow */}
      {(showLeftArrow || (hasMultipleProducts && false)) && (
        <button
          onClick={(e) => { e.preventDefault(); scroll("left"); }}
          className="absolute left-0 top-[64%] -translate-y-1/2 z-30 bg-white shadow-xl rounded-full p-2 border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:scale-110 active:scale-95 transition-all -ml-5 flex items-center justify-center cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3px]" />
        </button>
      )}

      {(showRightArrow || (hasMultipleProducts && !showLeftArrow)) && (
        <button
          onClick={(e) => { e.preventDefault(); scroll("right"); }}
          className="absolute right-0 top-[64%] -translate-y-1/2 z-30 bg-white shadow-xl rounded-full p-2 border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:scale-110 active:scale-95 transition-all mr-0 flex items-center justify-center cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[3px]" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
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
                      onClick={() => window.open("https://example.com", "_blank")}
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
  );
}

export default function GiftsChatPage() {
  // ... (rest of component)

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

    const lowerQuery = userQuery.toLowerCase();

    // Sync with backend logic: don't fetch products if it's just a vague gift query
    const productKeywords = [
      'product', 'moisturizer', 'cream', 'serum', 'cleanser', 'mask', 'toner', 'oil', 'lotion', 'gel', 'balm',
      'face wash', 'lipstick', 'foundation', 'sunscreen', 'shampoo', 'conditioner'
    ];
    const isDirectProductQuery = productKeywords.some(keyword => lowerQuery.includes(keyword));
    const isSpecificEnough = lowerQuery.length > 50 || isDirectProductQuery;

    // Only search products if it's a direct product query OR a very specific request
    const shouldFetchProducts = isDirectProductQuery || isSpecificEnough;

    try {
      let relevantProducts: Product[] = [];

      if (shouldFetchProducts) {
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

        <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0 px-4 py-4">
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
                      <ProductRow products={products} />
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
