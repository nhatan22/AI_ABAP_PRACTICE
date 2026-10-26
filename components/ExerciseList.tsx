"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, Sparkles } from "lucide-react";
import { LEVELS, LEVEL_LABEL, type LevelName, type TrackName } from "@/lib/schemas";
import { LevelBadge, TrackBadge } from "./Badges";

export type ListItem = {
  id: string;
  slug: string;
  title: string;
  track: TrackName;
  level: LevelName;
  topic: string;
  tags: string[];
  source: string;
  attempts: number;
  bestScore: number;
  bestOptim: number;
  solved: boolean;
};

export function ExerciseList({ items }: { items: ListItem[] }) {
  const [track, setTrack] = useState<TrackName | "ALL">("ALL");
  const [level, setLevel] = useState<LevelName | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | "TODO" | "SOLVED">("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => (track === "ALL" ? true : i.track === track))
      .filter((i) => (level === "ALL" ? true : i.level === level))
      .filter((i) => (status === "ALL" ? true : status === "SOLVED" ? i.solved : !i.solved))
      .filter(
        (i) =>
          !needle ||
          i.title.toLowerCase().includes(needle) ||
          i.topic.toLowerCase().includes(needle) ||
          i.tags.some((t) => t.toLowerCase().includes(needle)),
      )
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.title.localeCompare(b.title));
  }, [items, track, level, status, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={track}
          onChange={setTrack}
          options={[
            ["ALL", "Tất cả"],
            ["ABAP", "ABAP"],
            ["UI5", "UI5 · JS"],
          ]}
        />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            ["ALL", "Mọi trạng thái"],
            ["TODO", "Chưa giải"],
            ["SOLVED", "Đã giải"],
          ]}
        />
        <div className="relative ml-auto w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm: hashed table, binding, LRU…"
            className="w-full rounded-lg border border-line bg-panel py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", ...LEVELS] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              level === l ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg"
            }`}
          >
            {l === "ALL" ? "Mọi mức độ" : LEVEL_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((e) => (
          <Link
            key={e.id}
            href={`/practice/${e.slug}`}
            className="group rounded-xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-panel2"
          >
            <div className="mb-2 flex items-center gap-2">
              <TrackBadge track={e.track} />
              <LevelBadge level={e.level} />
              {e.source === "ai" && (
                <span className="flex items-center gap-1 text-[11px] text-accent">
                  <Sparkles size={11} /> AI
                </span>
              )}
              {e.solved && <CheckCircle2 size={16} className="ml-auto text-ok" />}
            </div>
            <div className="font-medium leading-snug group-hover:text-strong">{e.title}</div>
            <div className="mt-1 text-xs text-muted">{e.topic}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {t}
                </span>
              ))}
            </div>
            {e.attempts > 0 && (
              <div className="mt-3 flex gap-4 border-t border-line pt-2 text-xs text-muted">
                <span>{e.attempts} lần nộp</span>
                <span>
                  Điểm <b className="text-fg">{e.bestScore}</b>
                </span>
                <span>
                  Tối ưu <b className="text-fg">{e.bestOptim}</b>
                </span>
              </div>
            )}
          </Link>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">Không có bài phù hợp.</p>}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex rounded-lg border border-line bg-panel p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1.5 text-xs transition ${
            value === v ? "bg-panel2 text-fg shadow" : "text-muted hover:text-fg"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
