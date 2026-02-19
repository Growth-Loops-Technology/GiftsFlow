"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, ShoppingBag, Star, ChevronLeft, ChevronRight } from "lucide-react";
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

/* ================= PRODUCT ROW ================= */

function ProductRow({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const timer = setTimeout(updateScrollButtons, 200);
    return () => clearTimeout(timer);
  }, [products]);

  return (
    <div className="ml-7 relative w-full">
      <p className="text-xs text-gray-500 font-medium mb-2">
        📦 {products.length} Products Found:
      </p>

      {/* LEFT ARROW */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-2 border text-amber-600 hover:bg-amber-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* RIGHT ARROW */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-2 border text-amber-600 hover:bg-amber-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth w-full"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product) => (
          <Card
            key={product.id}
            className="min-w-[280px] max-w-[280px] flex-shrink-0 bg-gradient-to-br from-white to-amber-50 border"
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-amber-100 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.Product_Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-amber-400" />
                  )}
                  <div className="absolute top-1 right-1 bg-white px-2 py-0.5 text-[10px] rounded-full font-bold text-amber-600">
                    ${product.Price_USD}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight break-words">
                      {product.Product_Name}
                    </h4>
                    <p className="text-xs text-amber-600 font-semibold">
                      {product.Brand}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      {product.Rating}/5
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                      >
                        View
                      </Button>
                    </Link>
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

/* ================= MAIN PAGE ================= */

export default function GiftsChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    try {
      let relevantProducts: Product[] = [];

      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const searchData = await searchRes.json();
      relevantProducts = searchData.products || [];

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl h-[80vh] flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-center text-xl font-semibold">
            🎁 Gift Shop Assistant
          </CardTitle>

          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
            <Link href="/portal" className="underline">
              Data
            </Link>
            |
            <Link href="/cosmetics" className="underline flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> View All Cosmetics
            </Link>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-3">
                <div
                  className={`flex items-start gap-2 ${message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  {message.role === "assistant" && (
                    <Bot className="w-5 h-5 text-amber-600 mt-1" />
                  )}

                  <div
                    className={`rounded-xl px-4 py-2 max-w-[85%] text-sm shadow break-words whitespace-pre-wrap ${message.role === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-800"
                      }`}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {message.role === "user" && (
                    <User className="w-5 h-5 text-amber-600 mt-1" />
                  )}
                </div>

                {message.role === "assistant" &&
                  message.products &&
                  message.products.length > 0 && (
                    <ProductRow products={message.products} />
                  )}
              </div>
            ))}

            {loading && (
              <div className="text-sm text-gray-500">Searching...</div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 p-3 border-t">
            <Input
              placeholder="Ask about products or gift ideas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading}
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