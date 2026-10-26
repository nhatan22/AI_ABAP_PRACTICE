import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, Gauge, Target, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { getProgress } from "@/lib/stats";
import { requireUser } from "@/lib/auth";
import { LEVELS, type LevelName, type TrackName } from "@/lib/schemas";
import { LevelBadge, ScoreRing, TrackBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const [exercises, progress, recent] = await Promise.all([
    db.exercise.findMany({
      select: { id: true, slug: true, title: true, track: true, level: true, topic: true },
    }),
    getProgress(user.id),
    db.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { exercise: { select: { title: true, slug: true, track: true } } },
    }),
  ]);

  const tracks: TrackName[] = ["ABAP", "UI5"];
  const solvedCount = (t: TrackName) =>
    exercises.filter((e) => e.track === t && progress.get(e.id)?.solved).length;
  const totalCount = (t: TrackName) => exercises.filter((e) => e.track === t).length;

  const attempts = [...progress.values()];
  const avgBest = attempts.length ? Math.round(attempts.reduce((s, p) => s + p.bestScore, 0) / attempts.length) : 0;
  const avgOptim = attempts.length ? Math.round(attempts.reduce((s, p) => s + p.bestOptim, 0) / attempts.length) : 0;

  // Recommendation: lowest-level unsolved exercise per track.
  const order = (l: string) => LEVELS.indexOf(l as LevelName);
  const next = tracks
    .map((t) =>
      exercises
        .filter((e) => e.track === t && !progress.get(e.id)?.solved)
        .sort((a, b) => order(a.level) - order(b.level))[0],
    )
    .filter(Boolean);

  // Weak spots: topics where the best optimisation score is still low.
  const byTopic = new Map<string, number[]>();
  for (const e of exercises) {
    const p = progress.get(e.id);
    if (p) byTopic.set(e.topic, [...(byTopic.get(e.topic) ?? []), p.bestOptim]);
  }
  const weak = [...byTopic.entries()]
    .map(([topic, v]) => ({ topic, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <p className="mb-2 flex items-center gap-2 text-sm text-ok">
          <Zap size={14} /> Luyện như LeetCode, chấm bởi AI
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Tự code ABAP & SAPUI5, AI sẽ <span className="text-accent">compile, kiểm từng milestone</span> và chấm độ tối ưu.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Hashed table, secondary key, sliding window, LRU… hoặc Fiori binding, routing, Map aggregation. Mỗi bài có mốc
          kiểm tra, gợi ý từng bước, gia sư AI không tiết lộ đáp án.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/exercises"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on transition hover:brightness-110"
          >
            Vào luyện tập <ArrowRight size={15} />
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-fg transition hover:bg-panel2"
          >
            Nhờ AI ra đề mới
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CheckCircle2} label="ABAP đã giải" value={`${solvedCount("ABAP")}/${totalCount("ABAP")}`} />
        <Stat icon={CheckCircle2} label="UI5 đã giải" value={`${solvedCount("UI5")}/${totalCount("UI5")}`} />
        <Stat icon={Target} label="Điểm tốt nhất TB" value={attempts.length ? String(avgBest) : "—"} />
        <Stat icon={Gauge} label="Tối ưu TB" value={attempts.length ? String(avgOptim) : "—"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
            <Flame size={14} /> Bài nên làm tiếp
          </h2>
          {next.length === 0 && <p className="text-sm text-muted">Bạn đã giải hết! Hãy nhờ AI ra đề mới.</p>}
          {next.map((e) => (
            <Link
              key={e.id}
              href={`/practice/${e.slug}`}
              className="group flex items-center justify-between rounded-xl border border-line bg-panel p-4 transition hover:border-accent/50 hover:bg-panel2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <TrackBadge track={e.track} />
                  <LevelBadge level={e.level} />
                  <span className="text-xs text-muted">{e.topic}</span>
                </div>
                <div className="font-medium">{e.title}</div>
              </div>
              <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          ))}

          {weak.length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="mb-3 text-sm font-semibold">Điểm cần cải thiện (tối ưu thấp nhất)</h3>
              <div className="space-y-2">
                {weak.map((w) => (
                  <div key={w.topic} className="flex items-center gap-3 text-sm">
                    <span className="w-48 truncate text-muted">{w.topic}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel2">
                      <div className="h-full rounded-full bg-gradient-to-r from-warn to-ok" style={{ width: `${w.avg}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono text-xs">{w.avg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Lần nộp gần đây</h2>
          {recent.length === 0 && <p className="text-sm text-muted">Chưa có bài nộp nào.</p>}
          {recent.map((s) => (
            <Link
              key={s.id}
              href={`/practice/${s.exercise.slug}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3 transition hover:bg-panel2"
            >
              <ScoreRing value={s.score} size={46} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.exercise.title}</div>
                <div className="text-xs text-muted">
                  {s.passed ? "✓ Đạt" : "Chưa đạt"} · tối ưu {s.optimScore} · {s.createdAt.toLocaleString("vi-VN")}
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted">
        <Icon size={14} /> {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
