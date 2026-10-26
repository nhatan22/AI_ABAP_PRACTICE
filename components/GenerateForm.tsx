"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { LEVELS, LEVEL_LABEL, type LevelName, type TrackName } from "@/lib/schemas";

const TOPICS: Record<TrackName, string[]> = {
  ABAP: [
    "Hashed table",
    "Sorted table & binary search",
    "Secondary key",
    "Two pointers",
    "Sliding window",
    "String functions & regex",
    "REDUCE / FOR / GROUP BY",
    "Open SQL tối ưu",
    "OO ABAP & exception",
    "Field-symbols & references",
  ],
  UI5: [
    "JSONModel binding",
    "Filter / Sorter",
    "Routing",
    "OData V2/V4",
    "Fragment & Dialog",
    "Custom control",
    "Performance (Map, debounce)",
    "Formatter & expression binding",
  ],
};

export function GenerateForm() {
  const router = useRouter();
  const [track, setTrack] = useState<TrackName>("ABAP");
  const [level, setLevel] = useState<LevelName>("MEDIUM");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level, topic, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");
      router.push(`/practice/${data.slug}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-panel p-6">
      <Field label="Track">
        <div className="flex gap-2">
          {(["ABAP", "UI5"] as const).map((t) => (
            <Chip key={t} active={track === t} onClick={() => setTrack(t)}>
              {t === "UI5" ? "SAPUI5 · JavaScript" : "ABAP thuần"}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Mức độ">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {LEVEL_LABEL[l]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Chủ đề">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ví dụ: hashed table, sliding window… (để trống = AI tự chọn)"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TOPICS[track].map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-fg"
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Yêu cầu thêm (tuỳ chọn)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ví dụ: bối cảnh tài chính, có edge case về số âm…"
          className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>

      {error && <p className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? "AI đang soạn đề… (10–40 giây)" : "Tạo bài tập"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
        active ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
