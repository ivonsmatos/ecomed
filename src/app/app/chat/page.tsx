"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL: Message = {
  role: "assistant",
  content:
    "Olá! Sou o EcoBot. Posso ajudar com informações sobre descarte correto de medicamentos, pontos de coleta e dúvidas sobre resíduos de saúde. Como posso ajudar você hoje?",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao consultar o assistente");
      }

      const data = (await res.json()) as { resposta: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.resposta }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error && err.message !== "Erro ao consultar o assistente"
              ? err.message
              : "Desculpe, o EcoBot demorou para responder. Tente novamente com uma pergunta mais curta.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-background">
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 dark:bg-green-900">
          <Bot className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-sm">EcoBot</p>
          <p className="text-xs text-muted-foreground">Especialista em descarte de medicamentos</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex gap-3 items-start", msg.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "assistant"
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-zinc-200 dark:bg-zinc-700",
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-green-600" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "assistant"
                  ? "bg-muted rounded-tl-none"
                  : "bg-green-600 text-white rounded-tr-none",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Bot className="h-4 w-4 text-green-600" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Digitando…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground px-4 pb-1">
        Este assistente fornece informações educativas apenas. Consulte um profissional de saúde
        para orientações médicas.
      </p>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t px-4 py-3 flex items-end gap-2 bg-background"
      >
        <Textarea
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunta sobre descarte de medicamentos…"
          rows={1}
          className="min-h-10 max-h-32 resize-none flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="bg-green-600 hover:bg-green-700 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
