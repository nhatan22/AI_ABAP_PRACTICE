import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ScoreRing, TrackBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser();
  const subs = await db.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { exercise: { select: { title: true, slug: true, track: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lịch sử nộp bài</h1>
        <p className="mt-1 text-sm text-muted">100 lần nộp gần nhất. Bấm vào để mở lại bài.</p>
      </div>
      <div className="space-y-2">
        {subs.length === 0 && <p className="text-sm text-muted">Chưa có bài nộp nào.</p>}
        {subs.map((s) => (
          <Link
            key={s.id}
            href={`/practice/${s.exercise.slug}`}
            className="flex items-center gap-4 rounded-xl border border-line bg-panel p-3 transition hover:bg-panel2"
          >
            <ScoreRing value={s.score} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TrackBadge track={s.exercise.track} />
                <span className="truncate font-medium">{s.exercise.title}</span>
              </div>
              <div className="mt-1 text-xs text-muted">{s.createdAt.toLocaleString("vi-VN")}</div>
            </div>
            <div className="text-right text-xs">
              <div className={s.passed ? "text-ok" : "text-warn"}>{s.passed ? "✓ Đạt" : "Chưa đạt"}</div>
              <div className="text-muted">tối ưu {s.optimScore}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
