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
import { DefaultChatTransport } from "ai";

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

// Minimal type definition if not exported
interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
  state: 'partial-call' | 'call' | 'result';
}

const ChatProductCard = ({ product }: { product: Product }) => (
  <Card className="w-48 flex-shrink-0 bg-white shadow-sm border-gray-100 overflow-hidden mr-2">
    <div className="h-24 bg-gray-50 flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-50 to-orange-50 opacity-50" />
      <ShoppingBag className="w-8 h-8 text-amber-300" />
      <div className="absolute top-1 right-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-gray-600 shadow-sm">
        ${product.Price_USD}
      </div>
    </div>
    <div className="p-2">
      <div className="flex justify-between items-start mb-1">
        <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wide truncate max-w-[80px]">{product.Brand}</div>
        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
          <Star className="w-2.5 h-2.5 fill-current" />
          {product.Rating}
        </div>
      </div>
      <h3 className="font-semibold text-xs text-gray-900 truncate mb-0.5" title={product.Product_Name}>{product.Product_Name}</h3>
      <p className="text-[10px] text-gray-500 mb-2 truncate">{product.Category}</p>
      <Link href="https://example.com" target="_blank" className="block">
        <Button variant="outline" size="sm" className="w-full text-[10px] h-6 border-amber-200 hover:bg-amber-50 hover:text-amber-700 p-0">
          View <ExternalLink className="w-2 h-2 ml-1" />
        </Button>
      </Link>
    </div>
  </Card>
);

export default function GiftsChatPage() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // ✅ Auto scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-gray-100 pb-4">
          <CardTitle className="text-center text-xl font-semibold flex items-center justify-center gap-2">
            🎁 Gift Shop Assistant
          </CardTitle>
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
            <span>
              Based on uploaded <Link href="/portal" className="underline hover:text-amber-600">data</Link>
            </span>
            <span className="text-gray-300">|</span>
            <Link href="/cosmetics" className="flex items-center gap-1 hover:text-amber-600 underline">
              <ShoppingBag className="w-3 h-3" /> View All Cosmetics
            </Link>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-6">
              {messages.map((message) => {
                // Cast to any to access toolInvocations if missing from type definition
                const msgAny = message as any;

                return (
                  <div key={message.id} className="flex flex-col gap-2">
                    {/* Text Content - Handle parts if available or content string */}
                    <div
                      className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"
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
                        {/* Render text parts or content */}
                        {msgAny.parts ? (
                          msgAny.parts.map((part: any, i: number) =>
                            part.type === 'text' ? <ReactMarkdown key={i}>{part.text}</ReactMarkdown> : null
                          )
                        ) : (
                          <ReactMarkdown>{msgAny.content || ''}</ReactMarkdown>
                        )}
                      </div>

                      {message.role === "user" && (
                        <User className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Tool Invocations (Product Cards) */}
                    {msgAny.toolInvocations?.map((toolInvocation: any) => {
                      const { toolName, toolCallId, state } = toolInvocation;

                      if (state === 'result' && toolName === 'suggest_products') {
                        const products = toolInvocation.result as Product[];
                        return (
                          <div key={toolCallId} className="pl-9 w-full overflow-x-auto pb-2">
                            <div className="flex gap-2">
                              {products.length > 0 ? (
                                products.map((product) => (
                                  <ChatProductCard key={product.id} product={product} />
                                ))
                              ) : (
                                <div className="text-xs text-gray-500 italic">No products found.</div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              })}

              {/* Streaming Loading Bubble */}
              {status === "submitted" && (
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                  <div className="bg-white px-4 py-2 rounded-xl shadow text-sm text-gray-500 animate-pulse">
                    Thinking ... 🤔
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              // Send message using the required format for this version
              sendMessage({ role: 'user', content: input } as any);
              setInput("");
            }}
            className="flex gap-2 pt-2"
          >
            <Input
              placeholder="Ask about products or gift ideas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={status === "streaming" || !input.trim()} className="bg-amber-600 hover:bg-amber-700">
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
