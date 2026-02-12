"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag, Star } from "lucide-react";

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

export default function CosmeticsChatbot() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi 👋 I’m your cosmetics assistant. Ask me about skincare, makeup, or ingredients!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/cosmetics");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/completion/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.message || "Sorry, I couldn’t find cosmetic data." },
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 p-4 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chat Section */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] shadow-xl rounded-2xl flex flex-col bg-white/80 backdrop-blur-sm border-white/50">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Bot className="w-6 h-6 text-purple-600" />
                Assistant
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 pt-4 overflow-hidden">
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "bot" && <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><Bot className="w-5 h-5 text-purple-600" /></div>}
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm shadow-sm ${msg.role === "user"
                            ? "bg-purple-600 text-white rounded-br-none"
                            : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                          }`}
                      >
                        {msg.text}
                      </div>
                      {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><User className="w-5 h-5 text-pink-600" /></div>}
                    </div>
                  ))}
                  {loading && (
                    <div className="text-xs text-gray-400 animate-pulse ml-10">Thinking...</div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask about skincare..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="bg-white/50 border-gray-200 focus-visible:ring-purple-500"
                />
                <Button onClick={sendMessage} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Trending Cosmetics</h2>
          </div>

          <ScrollArea className="h-[600px] rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 pb-4">
              {products.map((product) => (
                <Card key={product.id} className="bg-white hover:shadow-lg transition-shadow duration-300 border-gray-100 overflow-hidden group">
                  <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder image since we don't have real URLs yet */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 to-purple-50 opacity-50 group-hover:opacity-70 transition-opacity" />
                    <ShoppingBag className="w-12 h-12 text-purple-200" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                      ${product.Price_USD}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">{product.Brand}</div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {product.Rating}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{product.Product_Name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{product.Category} • {product.Skin_Type}</p>
                    <Button variant="outline" className="w-full text-xs h-8 border-purple-200 hover:bg-purple-50 hover:text-purple-700">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

      </div>
    </div>
  );
}
