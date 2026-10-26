"use client";

import { AlertTriangle, CheckCircle2, Info, Lightbulb, XCircle } from "lucide-react";
import type { Milestone, Review } from "@/lib/schemas";
import { ScoreRing } from "./Badges";

export type ReviewResult = {
  id: string;
  passed: boolean;
  score: number;
  optimScore: number;
  review: Review;
};

const sevIcon = {
  error: <XCircle size={14} className="mt-0.5 shrink-0 text-bad" />,
  warning: <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />,
  info: <Info size={14} className="mt-0.5 shrink-0 text-accent" />,
};

export function ReviewPanel({
  result,
  milestones,
  onJump,
}: {
  result: ReviewResult;
  milestones: Milestone[];
  onJump: (line: number) => void;
}) {
  const { review } = result;
  const met = review.milestones.filter((m) => m.met).length;
  const testsPassed = review.tests.filter((t) => t.pass).length;

  return (
    <div className="space-y-5 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-line bg-panel2 p-4">
        <ScoreRing value={result.score} label="điểm" />
        <ScoreRing value={result.optimScore} label="tối ưu" />
        <ScoreRing value={review.style.score} label="style" />
        <div className="min-w-[220px] flex-1">
          <div className={`mb-1 text-base font-semibold ${result.passed ? "text-ok" : "text-warn"}`}>
            {result.passed ? "✓ Đạt yêu cầu" : "Chưa đạt – xem chi tiết bên dưới"}
          </div>
          <p className="text-muted">{review.summary}</p>
        </div>
      </div>

      <Section title="1 · Compile" badge={review.compile.ok ? "OK" : "Có lỗi"} ok={review.compile.ok}>
        {review.compile.issues.length === 0 ? (
          <p className="text-muted">Không phát hiện lỗi cú pháp.</p>
        ) : (
          <ul className="space-y-2">
            {review.compile.issues.map((i, k) => (
              <li key={k} className="flex gap-2">
                {sevIcon[i.severity]}
                <div>
                  {i.line && (
                    <button onClick={() => onJump(i.line as number)} className="mr-2 font-mono text-xs text-accent hover:underline">
                      dòng {i.line}
                    </button>
                  )}
                  <span>{i.message}</span>
                  {i.fix && <div className="mt-0.5 text-xs text-muted">→ {i.fix}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="2 · Milestones" badge={`${met}/${milestones.length}`} ok={met === milestones.length}>
        <ul className="space-y-2">
          {milestones.map((m) => {
            const r = review.milestones.find((x) => x.id === m.id);
            return (
              <li key={m.id} className="flex gap-2">
                {r?.met ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-bad" />
                )}
                <div>
                  <div className="font-medium">{m.title}</div>
                  {r?.feedback && <div className="text-xs text-muted">{r.feedback}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="3 · Test (AI dry-run)" badge={`${testsPassed}/${review.tests.length}`} ok={testsPassed === review.tests.length && review.tests.length > 0}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">Case</th>
                <th className="py-1 pr-3 font-medium">Input</th>
                <th className="py-1 pr-3 font-medium">Expected</th>
                <th className="py-1 pr-3 font-medium">Actual</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {review.tests.map((t, k) => (
                <tr key={k} className="border-t border-line align-top">
                  <td className="py-1.5 pr-3">{t.name}</td>
                  <td className="py-1.5 pr-3 font-mono">{t.input}</td>
                  <td className="py-1.5 pr-3 font-mono">{t.expected}</td>
                  <td className="py-1.5 pr-3 font-mono">{t.actual}</td>
                  <td className="py-1.5">{t.pass ? <CheckCircle2 size={14} className="text-ok" /> : <XCircle size={14} className="text-bad" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted">* Đây là AI chạy tay theo code của bạn, không phải runtime SAP thật.</p>
      </Section>

      <Section title="4 · Độ phức tạp & tối ưu" badge={review.complexity.optimal ? "Tối ưu" : "Cải thiện được"} ok={review.complexity.optimal}>
        <div className="mb-3 grid grid-cols-3 gap-3 text-center">
          <Metric label="Time" value={review.complexity.time} />
          <Metric label="Space" value={review.complexity.space} />
          <Metric label="Mục tiêu" value={review.complexity.target} />
        </div>
        <p className="text-muted">{review.complexity.analysis}</p>
        {review.optimization.suggestions.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {review.optimization.suggestions.map((s, k) => (
              <li key={k} className="flex gap-2">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-warn" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
        {review.optimization.betterApproach && (
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
            <b className="text-accent">Hướng tối ưu hơn:</b> {review.optimization.betterApproach}
          </div>
        )}
      </Section>

      {review.style.notes.length > 0 && (
        <Section title="5 · Style" badge={String(review.style.score)} ok={review.style.score >= 70}>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {review.style.notes.map((n, k) => (
              <li key={k}>{n}</li>
            ))}
          </ul>
        </Section>
      )}

      {review.nextStep && (
        <div className="rounded-xl border border-ok/30 bg-ok/5 p-3">
          <b className="text-ok">Bước tiếp theo:</b> {review.nextStep}
        </div>
      )}
    </div>
  );
}

function Section({ title, badge, ok, children }: { title: string; badge: string; ok: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ok ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>{badge}</span>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-panel2 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}
