"use client"
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag, Star, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
  role: "bot" | "user";
  text: string;
  products?: Product[];
}

export default function CosmeticsChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi 👋 I'm your cosmetics assistant. Ask me about skincare, makeup, or ingredients!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");
    setLoading(true);

    try {
      // Call AI API
      const res = await fetch("/api/completion/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery }),
      });

      const data = await res.json();

      // Fetch products from search API (tries Pinecone first, falls back to local)
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const searchData = await searchRes.json();
      const relevantProducts = searchData.products || [];

      console.log(`Found ${relevantProducts.length} products:`, relevantProducts);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.message || "Here are some products I found for you!",
          products: relevantProducts
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[85vh] shadow-2xl rounded-3xl flex flex-col bg-white">
        <CardHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Bot className="w-7 h-7 text-purple-600" />
            Cosmetics Assistant
          </CardTitle>
          <p className="text-center text-sm text-gray-500">Ask me anything about beauty products!</p>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0 px-4 py-4">
            <div className="space-y-4 pb-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="space-y-3">
                  <div className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[70%] text-sm shadow-sm ${msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                        }`}
                    >
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-pink-600" />
                      </div>
                    )}
                  </div>

                  {msg.role === "bot" && msg.products && msg.products.length > 0 && (
                    <div className="ml-10 space-y-3">
                      <p className="text-xs text-gray-500 font-medium">📦 {msg.products.length} Products Found:</p>
                      {msg.products.map((product) => (
                        <Card key={product.id} className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 hover:shadow-lg transition-all">
                          <CardContent className="p-3 flex gap-3">
                            <div className="w-24 h-24 bg-gradient-to-tr from-pink-100 via-purple-100 to-pink-50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm relative group">
                              <ShoppingBag className="w-12 h-12 text-purple-300 group-hover:scale-110 transition-transform" />
                              <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-purple-600">
                                ${product.Price_USD}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 mb-0.5 leading-tight line-clamp-2">
                                  {product.Product_Name}
                                </h4>
                                <p className="text-xs text-purple-600 font-semibold mb-1">{product.Brand}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{product.Category}</span>
                                  <span>•</span>
                                  <span>{product.Skin_Type}</span>
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
                                  className="h-7 text-xs border-purple-200 hover:bg-purple-600 hover:text-white"
                                  onClick={() => window.open('https://example.com', '_blank')}
                                >
                                  View <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600 animate-pulse" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm text-sm text-gray-500 border border-gray-100">
                    Searching products...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                placeholder="e.g., I need a long-lasting lipstick"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="bg-white border-purple-200 focus-visible:ring-purple-400"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
              >
                Send
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}