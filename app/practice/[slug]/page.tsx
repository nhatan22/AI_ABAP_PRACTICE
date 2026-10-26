import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MilestoneSchema, ReviewSchema } from "@/lib/schemas";
import { Workspace, type ExerciseView, type SubmissionView } from "@/components/Workspace";

export const dynamic = "force-dynamic";

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const ex = await db.exercise.findUnique({
    where: { slug },
    include: {
      submissions: { where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 },
      messages: { where: { userId: user.id }, orderBy: { createdAt: "asc" }, take: 60 },
    },
  });
  if (!ex) notFound();

  const exercise: ExerciseView = {
    id: ex.id,
    slug: ex.slug,
    track: ex.track,
    level: ex.level,
    title: ex.title,
    topic: ex.topic,
    tags: ex.tags,
    description: ex.description,
    milestones: MilestoneSchema.array().parse(ex.milestones),
    starterCode: ex.starterCode,
    hints: ex.hints,
    targetBigO: ex.targetBigO,
  };

  const submissions: SubmissionView[] = ex.submissions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    score: s.score,
    optimScore: s.optimScore,
    passed: s.passed,
    code: s.code,
    review: ReviewSchema.parse(s.review),
  }));

  return (
    <Workspace
      key={`${user.id}:${ex.id}`}
      userId={user.id}
      exercise={exercise}
      submissions={submissions}
      chat={ex.messages.map((m) => ({ role: m.role as "user" | "model", content: m.content }))}
    />
  );
}
