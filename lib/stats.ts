import { db } from "./db";

export type Progress = {
  attempts: number;
  bestScore: number;
  bestOptim: number;
  solved: boolean;
};

/** exerciseId -> aggregated progress, computed from all submissions. */
export async function getProgress(userId: string): Promise<Map<string, Progress>> {
  const rows = await db.submission.groupBy({
    by: ["exerciseId"],
    where: { userId },
    _count: { _all: true },
    _max: { score: true, optimScore: true },
  });
  const passed = await db.submission.groupBy({
    by: ["exerciseId"],
    where: { userId, passed: true },
    _count: { _all: true },
  });
  const solved = new Set(passed.map((p) => p.exerciseId));
  return new Map(
    rows.map((r) => [
      r.exerciseId,
      {
        attempts: r._count._all,
        bestScore: r._max.score ?? 0,
        bestOptim: r._max.optimScore ?? 0,
        solved: solved.has(r.exerciseId),
      },
    ]),
  );
}
