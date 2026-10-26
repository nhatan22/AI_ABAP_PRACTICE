import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { gemini, parseJson } from "@/lib/gemini";
import { lintFor } from "@/lib/lint";
import { MilestoneSchema, ReviewSchema, type TrackName } from "@/lib/schemas";
import { REVIEW_SYSTEM, reviewPrompt } from "@/lib/prompts";

export const maxDuration = 120;

const Body = z.object({ exerciseId: z.string(), code: z.string().min(1).max(40_000) });

export async function POST(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { exerciseId, code } = parsed.data;

  const ex = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex) return Response.json({ error: "Không tìm thấy bài" }, { status: 404 });

  const milestones = MilestoneSchema.array().parse(ex.milestones);
  const lint = lintFor(ex.track as TrackName, code);

  let review;
  try {
    const text = await gemini({
      system: REVIEW_SYSTEM,
      turns: [
        {
          role: "user",
          text: reviewPrompt({
            track: ex.track,
            title: ex.title,
            description: ex.description,
            milestones,
            targetBigO: ex.targetBigO,
            code,
            lint,
          }),
        },
      ],
      json: true,
      temperature: 0.2,
    });
    review = ReviewSchema.parse(parseJson(text));
  } catch (e) {
    return Response.json({ error: `AI chấm bài lỗi: ${(e as Error).message}` }, { status: 502 });
  }

  // Make sure every milestone is represented, even if the model skipped one.
  const byId = new Map(review.milestones.map((m) => [m.id, m]));
  review.milestones = milestones.map(
    (m) => byId.get(m.id) ?? { id: m.id, met: false, feedback: "AI chưa đánh giá mốc này." },
  );

  // A hard syntax error found by our own checker beats an optimistic model.
  if (!lint.ok && review.compile.ok) {
    review.compile.ok = false;
    review.compile.issues.unshift(
      ...lint.issues
        .filter((i) => i.severity === "error")
        .map((i) => ({ line: i.line, severity: "error" as const, message: i.message, fix: "" })),
    );
  }

  const allMet = review.milestones.every((m) => m.met);
  const score = review.compile.ok ? review.score : Math.min(review.score, 40);
  const passed = review.compile.ok && allMet && score >= 60;

  const submission = await db.submission.create({
    data: {
      exerciseId,
      userId: me.id,
      code,
      review: review as object,
      passed,
      score,
      optimScore: review.optimization.score,
    },
  });

  return Response.json({
    id: submission.id,
    createdAt: submission.createdAt,
    passed,
    score,
    optimScore: review.optimization.score,
    review,
  });
}
