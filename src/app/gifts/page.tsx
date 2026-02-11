"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";
import Link from "next/link";

export default function GiftsChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I’m your gift shop assistant. Ask me about products from the data your shop uploaded, or get gift ideas.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.error ?? data.message ?? "Sorry, I couldn’t find an answer.",
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
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <Bot className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div
                    className={`rounded-xl px-4 py-2 max-w-[75%] text-sm shadow ${
                      msg.role === "user"
                        ? "bg-amber-600 text-white"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <User className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-sm text-muted-foreground">
                  Assistant is typing…
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about products or gift ideas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={loading}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
