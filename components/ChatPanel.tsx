"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Trash2, User } from "lucide-react";
import { Markdown } from "./Markdown";

export type ChatView = { role: "user" | "model"; content: string };

const QUICK = [
  "Gợi ý hướng làm, đừng cho đáp án",
  "Giải thích cấu trúc dữ liệu nên dùng",
  "Vì sao code của tôi chưa tối ưu?",
  "Kiểm tra giúp edge case tôi bỏ sót",
];

export function ChatPanel({
  exerciseId,
  getCode,
  initial,
}: {
  exerciseId: string;
  getCode: () => string;
  initial: ChatView[];
}) {
  const [messages, setMessages] = useState<ChatView[]>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, message, code: getCode() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");
      setMessages((m) => [...m, { role: "model", content: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    await fetch(`/api/chat?exerciseId=${exerciseId}`, { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3 pt-4 text-center">
            <Bot size={28} className="mx-auto text-accent" />
            <p className="text-sm text-muted">
              Gia sư AI đọc được đề và code hiện tại của bạn. Nó sẽ gợi mở thay vì đưa đáp án.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-fg"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                m.role === "user" ? "bg-accent/20 text-accent" : "bg-ok/15 text-ok"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`max-w-[88%] rounded-xl border px-3 py-2 ${
                m.role === "user" ? "border-accent/30 bg-accent/10" : "border-line bg-panel2"
              }`}
            >
              {m.role === "user" ? <p className="whitespace-pre-wrap text-sm">{m.content}</p> : <Markdown>{m.content}</Markdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 size={14} className="animate-spin" /> Gia sư đang suy nghĩ…
          </div>
        )}
        {error && <p className="rounded-lg border border-bad/40 bg-bad/10 p-2 text-xs text-bad">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="Hỏi gia sư… (Enter gửi, Shift+Enter xuống dòng)"
            className="flex-1 resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-on transition hover:brightness-110 disabled:opacity-40"
              aria-label="Gửi"
            >
              <Send size={15} />
            </button>
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:text-bad"
                aria-label="Xoá hội thoại"
                title="Xoá hội thoại"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
