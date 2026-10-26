import { db } from "@/lib/db";
import { getProgress } from "@/lib/stats";
import { requireUser } from "@/lib/auth";
import { ExerciseList, type ListItem } from "@/components/ExerciseList";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const user = await requireUser();
  const [exercises, progress] = await Promise.all([
    db.exercise.findMany({
      select: { id: true, slug: true, title: true, track: true, level: true, topic: true, tags: true, source: true },
    }),
    getProgress(user.id),
  ]);

  const items: ListItem[] = exercises.map((e) => {
    const p = progress.get(e.id);
    return {
      ...e,
      attempts: p?.attempts ?? 0,
      bestScore: p?.bestScore ?? 0,
      bestOptim: p?.bestOptim ?? 0,
      solved: p?.solved ?? false,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bài tập</h1>
        <p className="mt-1 text-sm text-muted">{items.length} bài · lọc theo track, mức độ, từ khoá.</p>
      </div>
      <ExerciseList items={items} />
    </div>
  );
}
