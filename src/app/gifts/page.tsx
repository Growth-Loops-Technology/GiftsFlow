"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";
import Link from "next/link";
import { DefaultChatTransport } from "ai";

export default function GiftsChatPage() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status  } = useChat({
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
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            Gift Shop Assistant
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Answers are based on uploaded product data.{" "}
            <Link href="/portal" className="underline">
              Upload Excel
            </Link>
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <ScrollArea className="h-80 pr-3">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                    className={`rounded-xl px-4 py-2 max-w-[75%] text-sm shadow ${
                      message.role === "user"
                        ? "bg-amber-600 text-white"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <ReactMarkdown key={index}>
                          {part.text}
                        </ReactMarkdown>
                      ) : null
                    )}
                  </div>

                  {message.role === "user" && (
                    <User className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                  )}
                </div>
              ))}

              {/* ✅ Streaming Loading Bubble */}
              {status === "submitted" && (
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                  <div className="bg-white px-4 py-2 rounded-xl shadow text-sm text-gray-500 animate-pulse">
                    Thinking ... 🤔
                  </div>
                </div>
              )}

              {/* 👇 Invisible anchor for auto-scroll */}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;

              sendMessage({text: input}); // ✅ correct usage
              setInput("");
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Ask about products or gift ideas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" disabled={status === "streaming"}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
