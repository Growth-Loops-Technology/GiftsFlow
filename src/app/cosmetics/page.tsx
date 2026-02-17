"use client"
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag, Star, ExternalLink, MessageCircle, X, ChevronUp, ChevronDown } from "lucide-react";
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

export default function CosmeticsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const productsPerPage = 20;

  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi 👋 I'm your cosmetics assistant. Ask me about skincare, makeup, or ingredients!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await fetch("/api/cosmetics");
        const data = await res.json();
        setAllProducts(data);
        setDisplayProducts(data.slice(0, productsPerPage));
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMore = () => {
    const nextBatch = allProducts.slice(0, (page + 1) * productsPerPage);
    setDisplayProducts(nextBatch);
    setPage(page + 1);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/completion/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery }),
      });
      const data = await res.json();

      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      const searchData = await searchRes.json();
      const relevantProducts = searchData.products || [];

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
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-purple-600" />
            Cosmetix
          </h1>
          <div className="text-sm text-gray-500 font-medium">
            Discover {allProducts.length} Premium Products
          </div>
        </div>
      </header>

      {/* Main Content: Product Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {fetchingProducts ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading beauty products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-gray-100 overflow-hidden bg-white">
                  <div className="aspect-square bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                    <ShoppingBag className="w-20 h-20 text-purple-100 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-purple-600 shadow-sm border border-purple-50">
                      ${product.Price_USD}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <p className="text-xs text-purple-600 font-bold tracking-wider uppercase">{product.Brand}</p>
                      <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 h-10 group-hover:text-purple-600 transition-colors">
                        {product.Product_Name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-medium">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{product.Category}</span>
                      <span>•</span>
                      <span>{product.Skin_Type}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{product.Rating}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-4 text-xs font-bold rounded-full border-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        onClick={() => window.open('https://example.com', '_blank')}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {displayProducts.length < allProducts.length && (
              <div className="mt-12 flex justify-center pb-12">
                <Button
                  onClick={loadMore}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-full font-bold shadow-lg hover:shadow-purple-200 transition-all gap-2"
                >
                  Load More Products <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Minimized Chat Box (Floating) */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${chatOpen ? 'w-96' : 'w-14'}`}>
        {!chatOpen ? (
          <Button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:scale-105 transition-transform p-0 flex items-center justify-center text-white"
          >
            <MessageCircle className="w-7 h-7" />
          </Button>
        ) : (
          <Card className="shadow-2xl rounded-2xl flex flex-col bg-white border-purple-100 h-[500px] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-sm">Beauty Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
              <ScrollArea className="flex-1 min-h-0 px-4 py-4">
                <div className="space-y-4 pb-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "bot" && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-purple-600" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 max-w-[85%] text-xs shadow-sm ${msg.role === "user"
                            ? "bg-purple-600 text-white rounded-br-none"
                            : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                            }`}
                        >
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>

                      {msg.role === "bot" && msg.products && msg.products.length > 0 && (
                        <div className="ml-8 space-y-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Suggestions:</p>
                          <div className="flex flex-col gap-2">
                            {msg.products.map((product) => (
                              <div key={product.id} className="bg-purple-50/50 p-2 rounded-xl flex items-center gap-2 border border-purple-100/50">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="w-4 h-4 text-purple-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[10px] text-gray-900 truncate leading-none mb-0.5">{product.Product_Name}</p>
                                  <p className="text-[10px] text-purple-600 font-medium">${product.Price_USD}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => window.open('https://example.com', '_blank')}>
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-gray-100 bg-white">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <Input
                    placeholder="Ask for advice..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="bg-gray-50 border-none h-10 text-xs focus-visible:ring-purple-400"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 rounded-full p-0 flex-shrink-0"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}