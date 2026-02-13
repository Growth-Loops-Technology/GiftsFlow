"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function GiftsChatPage() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  // Auto scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

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
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-2">
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
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.role === "user" && (
                      <User className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}

              {status === "streaming" && (
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