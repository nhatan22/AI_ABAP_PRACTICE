"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  Lightbulb,
  Loader2,
  MessageCircle,
  Play,
  RotateCcw,
  ScanSearch,
  Wand2,
  XCircle,
} from "lucide-react";
import type { LevelName, LintResult, Milestone, Review, TrackName } from "@/lib/schemas";
import { lintFor } from "@/lib/lint";
import { formatAbap } from "@/lib/abap-format";
import { CodeEditor } from "./CodeEditor";
import { ReviewPanel, type ReviewResult } from "./ReviewPanel";
import { ChatPanel, type ChatView } from "./ChatPanel";
import { LevelBadge, ScoreRing, TrackBadge } from "./Badges";
import { Markdown } from "./Markdown";

export type ExerciseView = {
  id: string;
  slug: string;
  track: TrackName;
  level: LevelName;
  title: string;
  topic: string;
  tags: string[];
  description: string;
  milestones: Milestone[];
  starterCode: string;
  hints: string[];
  targetBigO: string;
};

export type SubmissionView = {
  id: string;
  createdAt: string;
  score: number;
  optimScore: number;
  passed: boolean;
  code: string;
  review: Review;
};

type LeftTab = "problem" | "milestones" | "hints" | "chat" | "history" | "solution";
type BottomTab = "lint" | "review";

const TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
  { id: "problem", label: "Đề bài", icon: null },
  { id: "milestones", label: "Milestones", icon: null },
  { id: "hints", label: "Gợi ý", icon: <Lightbulb size={13} /> },
  { id: "chat", label: "Gia sư AI", icon: <MessageCircle size={13} /> },
  { id: "history", label: "Lịch sử", icon: null },
];

export function Workspace({
  exercise,
  submissions: initialSubs,
  chat,
  userId,
}: {
  exercise: ExerciseView;
  submissions: SubmissionView[];
  chat: ChatView[];
  userId: string;
}) {
  const draftKey = `dojo:draft:${userId}:${exercise.slug}`;
  const [code, setCode] = useState(initialSubs[0]?.code ?? exercise.starterCode);
  const [lint, setLint] = useState<LintResult>({ ok: true, issues: [] });
  const [subs, setSubs] = useState(initialSubs);
  const [result, setResult] = useState<ReviewResult | null>(
    initialSubs[0]
      ? {
          id: initialSubs[0].id,
          passed: initialSubs[0].passed,
          score: initialSubs[0].score,
          optimScore: initialSubs[0].optimScore,
          review: initialSubs[0].review,
        }
      : null,
  );
  const [left, setLeft] = useState<LeftTab>("problem");
  const [bottom, setBottom] = useState<BottomTab>(initialSubs[0] ? "review" : "lint");
  const [bottomOpen, setBottomOpen] = useState(true);
  const [hintCount, setHintCount] = useState(0);
  const [solution, setSolution] = useState<{ solution: string; targetBigO: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reveal, setReveal] = useState<{ line: number; nonce: number } | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  // Restore unsaved draft (only when it differs from the latest submission).
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft !== null && draft !== codeRef.current) setCode(draft);
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, code);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [code, draftKey]);

  // Live static check (pure client-side, instant).
  useEffect(() => {
    const t = setTimeout(() => setLint(lintFor(exercise.track, code)), 450);
    return () => clearTimeout(t);
  }, [code, exercise.track]);

  const format = useCallback(async () => {
    try {
      if (exercise.track === "ABAP") {
        setCode((c) => formatAbap(c));
      } else {
        const [prettier, babel, estree] = await Promise.all([
          import("prettier/standalone"),
          import("prettier/plugins/babel"),
          import("prettier/plugins/estree"),
        ]);
        const out = await prettier.format(codeRef.current, {
          parser: "babel",
          plugins: [babel, estree as never],
          printWidth: 100,
          tabWidth: 2,
        });
        setCode(out);
      }
      setError("");
    } catch (e) {
      setError(`Không format được: ${(e as Error).message.split("\n")[0]}`);
      setBottom("lint");
      setBottomOpen(true);
    }
  }, [exercise.track]);

  const check = useCallback(() => {
    setLint(lintFor(exercise.track, codeRef.current));
    setBottom("lint");
    setBottomOpen(true);
  }, [exercise.track]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setLint(lintFor(exercise.track, codeRef.current));
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, code: codeRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");
      setResult(data);
      setSubs((s) => [
        {
          id: data.id,
          createdAt: data.createdAt,
          score: data.score,
          optimScore: data.optimScore,
          passed: data.passed,
          code: codeRef.current,
          review: data.review,
        },
        ...s,
      ]);
      setBottom("review");
      setBottomOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, exercise.id, exercise.track]);

  function resetCode() {
    if (confirm("Đặt lại về code khởi đầu? Bản nháp hiện tại sẽ mất.")) setCode(exercise.starterCode);
  }

  async function showSolution() {
    if (!solution) {
      if (!confirm("Xem đáp án mẫu? Hãy chắc chắn bạn đã thử hết sức và dùng gợi ý/gia sư trước.")) return;
      const res = await fetch("/api/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Lỗi");
      setSolution(data);
    }
    setLeft("solution");
  }

  const markers = useMemo(() => lint.issues, [lint]);
  const issueCounts = {
    error: lint.issues.filter((i) => i.severity === "error").length,
    warning: lint.issues.filter((i) => i.severity === "warning").length,
  };
  const metIds = new Set(result?.review.milestones.filter((m) => m.met).map((m) => m.id));
  const jump = (line: number) => setReveal({ line, nonce: Date.now() });

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(380px,42%)_1fr]">
      {/* ---------- LEFT: problem / tools ---------- */}
      <section className="flex min-h-0 flex-col border-r border-line bg-panel/60">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-2 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setLeft(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                left === t.id ? "bg-panel2 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === "milestones" && result && (
                <span className="rounded bg-ok/15 px-1 text-[10px] text-ok">
                  {metIds.size}/{exercise.milestones.length}
                </span>
              )}
            </button>
          ))}
          {solution && (
            <button
              onClick={() => setLeft("solution")}
              className={`rounded-lg px-3 py-1.5 text-xs ${left === "solution" ? "bg-panel2 text-fg" : "text-muted"}`}
            >
              Đáp án
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {left === "problem" && (
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <TrackBadge track={exercise.track} />
                <LevelBadge level={exercise.level} />
                <span className="text-xs text-muted">{exercise.topic}</span>
                <span className="ml-auto rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
                  mục tiêu {exercise.targetBigO}
                </span>
              </div>
              <h1 className="text-xl font-semibold leading-snug">{exercise.title}</h1>
              <Markdown>{exercise.description}</Markdown>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {exercise.tags.map((t) => (
                  <span key={t} className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {left === "milestones" && (
            <div className="space-y-3 p-5">
              <p className="text-xs text-muted">
                Mỗi milestone được AI kiểm tra riêng khi bạn bấm <b>Nộp & chấm</b>.
              </p>
              {exercise.milestones.map((m, i) => {
                const r = result?.review.milestones.find((x) => x.id === m.id);
                return (
                  <div key={m.id} className="rounded-xl border border-line bg-panel p-3">
                    <div className="flex items-start gap-2.5">
                      {!r ? (
                        <Circle size={17} className="mt-0.5 shrink-0 text-muted" />
                      ) : r.met ? (
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-ok" />
                      ) : (
                        <XCircle size={17} className="mt-0.5 shrink-0 text-bad" />
                      )}
                      <div>
                        <div className="font-medium">
                          {i + 1}. {m.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">{m.detail}</div>
                        {r?.feedback && (
                          <div className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs ${r.met ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>
                            {r.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {left === "hints" && (
            <div className="space-y-3 p-5">
              <p className="text-xs text-muted">Mở từng gợi ý một. Càng ít gợi ý, bạn học càng sâu.</p>
              {exercise.hints.slice(0, hintCount).map((h, i) => (
                <div key={i} className="rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-warn">Gợi ý {i + 1}</div>
                  <Markdown>{h}</Markdown>
                </div>
              ))}
              {hintCount < exercise.hints.length ? (
                <button
                  onClick={() => setHintCount((n) => n + 1)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-sm text-muted transition hover:border-warn hover:text-warn"
                >
                  <Lightbulb size={14} /> Mở gợi ý {hintCount + 1}/{exercise.hints.length}
                </button>
              ) : (
                <p className="text-center text-xs text-muted">Đã mở hết gợi ý. Thử hỏi gia sư AI nhé.</p>
              )}
              <button
                onClick={showSolution}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-muted transition hover:text-bad"
              >
                <Eye size={13} /> Xem đáp án mẫu
              </button>
            </div>
          )}

          {/* Kept mounted so the conversation survives tab switches */}
          <div className={left === "chat" ? "h-full" : "hidden"}>
            <ChatPanel exerciseId={exercise.id} getCode={() => codeRef.current} initial={chat} />
          </div>

          {left === "history" && (
            <div className="space-y-2 p-4">
              {subs.length === 0 && <p className="text-sm text-muted">Chưa có lần nộp nào.</p>}
              {subs.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
                  <ScoreRing value={s.score} size={44} />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className={s.passed ? "text-ok" : "text-warn"}>{s.passed ? "✓ Đạt" : "Chưa đạt"} · tối ưu {s.optimScore}</div>
                    <div className="text-muted">{new Date(s.createdAt).toLocaleString("vi-VN")}</div>
                  </div>
                  <button
                    onClick={() => {
                      setCode(s.code);
                      setResult({ id: s.id, passed: s.passed, score: s.score, optimScore: s.optimScore, review: s.review });
                      setBottom("review");
                      setBottomOpen(true);
                    }}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-fg"
                  >
                    Mở lại
                  </button>
                </div>
              ))}
            </div>
          )}

          {left === "solution" && solution && (
            <div className="space-y-3 p-5">
              <div className="rounded-lg border border-bad/30 bg-bad/5 p-2.5 text-xs text-bad">
                Đáp án mẫu (không nhất thiết là cách duy nhất). Hãy so sánh với code của bạn rồi tự viết lại.
              </div>
              <pre className="overflow-x-auto rounded-xl border border-line bg-bg p-4 font-mono text-[12.5px] leading-relaxed text-fg">
                {solution.solution}
              </pre>
              <p className="text-xs text-muted">Độ phức tạp mục tiêu: <b className="font-mono text-fg">{solution.targetBigO}</b></p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- RIGHT: editor + results ---------- */}
      <section className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel/60 px-3 py-2">
          <span className="font-mono text-xs text-muted">{exercise.track === "ABAP" ? "zpractice.abap" : "Controller.js"}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ToolButton onClick={format} icon={<Wand2 size={14} />} title="Format code (Alt+Shift+F)">
              Format
            </ToolButton>
            <ToolButton onClick={check} icon={<ScanSearch size={14} />} title="Static check ngay lập tức">
              Check
              {(issueCounts.error > 0 || issueCounts.warning > 0) && (
                <span className="ml-1 flex gap-1 text-[10px]">
                  {issueCounts.error > 0 && <span className="rounded bg-bad/20 px-1 text-bad">{issueCounts.error}</span>}
                  {issueCounts.warning > 0 && <span className="rounded bg-warn/20 px-1 text-warn">{issueCounts.warning}</span>}
                </span>
              )}
            </ToolButton>
            <ToolButton onClick={resetCode} icon={<RotateCcw size={14} />} title="Về code khởi đầu">
              Reset
            </ToolButton>
            <button
              onClick={submit}
              disabled={submitting}
              title="Ctrl+Enter"
              className="flex items-center gap-2 rounded-lg bg-ok px-4 py-1.5 text-sm font-semibold text-on transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {submitting ? "AI đang chấm…" : "Nộp & chấm"}
            </button>
          </div>
        </div>

        <div className="min-h-[200px] flex-1">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={exercise.track === "ABAP" ? "abap" : "javascript"}
            markers={markers}
            onSubmit={submit}
            onFormat={format}
            reveal={reveal}
          />
        </div>

        <div className={`flex flex-col border-t border-line bg-panel/70 ${bottomOpen ? "h-[42%] min-h-[180px]" : "h-10"}`}>
          <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-1">
            <button
              onClick={() => {
                setBottom("lint");
                setBottomOpen(true);
              }}
              className={`rounded-lg px-3 py-1 text-xs ${bottom === "lint" ? "bg-panel2 text-fg" : "text-muted hover:text-fg"}`}
            >
              Static check {lint.issues.length > 0 && <span className="ml-1 text-warn">({lint.issues.length})</span>}
            </button>
            <button
              onClick={() => {
                setBottom("review");
                setBottomOpen(true);
              }}
              className={`rounded-lg px-3 py-1 text-xs ${bottom === "review" ? "bg-panel2 text-fg" : "text-muted hover:text-fg"}`}
            >
              Kết quả AI {result && <span className={result.passed ? "ml-1 text-ok" : "ml-1 text-warn"}>({result.score})</span>}
            </button>
            <button
              onClick={() => setBottomOpen((o) => !o)}
              className="ml-auto grid h-6 w-6 place-items-center rounded text-muted hover:text-fg"
              aria-label="Thu gọn / mở rộng"
            >
              {bottomOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>

          {bottomOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {error && <p className="m-3 rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{error}</p>}

              {bottom === "lint" && (
                <div className="p-4 text-sm">
                  {lint.issues.length === 0 ? (
                    <p className="flex items-center gap-2 text-ok">
                      <CheckCircle2 size={15} /> Không thấy vấn đề cấu trúc/cú pháp. Bấm <b>Nộp & chấm</b> để AI compile & kiểm milestone.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {lint.issues.map((i, k) => (
                        <li key={k} className="flex gap-2">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              i.severity === "error" ? "bg-bad" : i.severity === "warning" ? "bg-warn" : "bg-accent"
                            }`}
                          />
                          <div>
                            {i.line && (
                              <button onClick={() => jump(i.line as number)} className="mr-2 font-mono text-xs text-accent hover:underline">
                                dòng {i.line}
                              </button>
                            )}
                            {i.message}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 text-[11px] text-muted">
                    Static check chạy ngay trên trình duyệt (không có hệ thống SAP thật). Nó bắt lỗi cấu trúc & mùi hiệu năng; việc “compile” chi tiết do AI thực hiện khi nộp bài.
                  </p>
                </div>
              )}

              {bottom === "review" &&
                (result ? (
                  <ReviewPanel result={result} milestones={exercise.milestones} onJump={jump} />
                ) : (
                  <p className="p-6 text-center text-sm text-muted">Chưa có kết quả. Bấm “Nộp & chấm” (Ctrl+Enter).</p>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ToolButton({
  onClick,
  icon,
  title,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:border-accent/60 hover:text-fg"
    >
      {icon}
      {children}
    </button>
  );
}
