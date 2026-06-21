"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Bot, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChatHistory, appendChat, clearChat } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";

const QUICK_PROMPTS = [
  "Give me my daily briefing",
  "Am I on track with nutrition?",
  "What should I focus on in today's workout?",
  "How's my strength progressing?",
  "Tips to get leaner without losing muscle",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getChatHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content, timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    appendChat(userMsg);
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
      appendChat(assistantMsg);
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I couldn't connect. Make sure ANTHROPIC_API_KEY is set in your .env.local file.",
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    clearChat();
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 rounded-full p-2">
              <Bot size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold">AI Coach</h1>
              <p className="text-xs text-gray-500">Knows your workouts, food & progress</p>
            </div>
          </div>
          <button onClick={handleClear} className="text-gray-600 hover:text-red-400 p-2">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36">
        {messages.length === 0 && (
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-2">
              <div className="inline-flex bg-blue-500/10 rounded-full p-4">
                <Zap size={32} className="text-blue-400" />
              </div>
              <p className="font-semibold">Your personalized coach</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                I know your workout history, nutrition, strength trends, and your custom 5-day program. Ask me anything.
              </p>
            </div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm hover:border-blue-500/50 hover:text-blue-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              msg.role === "assistant" ? "bg-blue-500/20" : "bg-[#2a2a2a]"
            )}>
              {msg.role === "assistant" ? <Bot size={14} className="text-blue-400" /> : <User size={14} className="text-gray-400" />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "assistant"
                ? "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100"
                : "bg-blue-600 text-white"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 z-10 bg-[#0a0a0a] border-t border-[#1a1a1a] px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
            placeholder="Ask your coach..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-blue-600 disabled:opacity-40 rounded-xl px-4 flex items-center justify-center transition-opacity"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
