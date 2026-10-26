import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { gemini } from "@/lib/gemini";
import { MilestoneSchema } from "@/lib/schemas";
import { TUTOR_SYSTEM, tutorContext } from "@/lib/prompts";

export const maxDuration = 90;

const Body = z.object({
  exerciseId: z.string(),
  message: z.string().min(1).max(4000),
  code: z.string().max(40_000).default(""),
});

export async function POST(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { exerciseId, message, code } = parsed.data;

  const ex = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex) return Response.json({ error: "Không tìm thấy bài" }, { status: 404 });

  const history = await db.chatMessage.findMany({
    where: { exerciseId, userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  history.reverse();

  const context = tutorContext({
    track: ex.track,
    title: ex.title,
    description: ex.description,
    milestones: MilestoneSchema.array().parse(ex.milestones),
    code,
  });

  try {
    const reply = await gemini({
      system: TUTOR_SYSTEM,
      turns: [
        { role: "user", text: context },
        { role: "model", text: "Đã nắm đề và code hiện tại của bạn. Bạn muốn hỏi gì?" },
        ...history.map((h) => ({ role: h.role as "user" | "model", text: h.content })),
        { role: "user", text: message },
      ],
      temperature: 0.6,
    });
    await db.chatMessage.createMany({
      data: [
        { exerciseId, userId: me.id, role: "user", content: message },
        { exerciseId, userId: me.id, role: "model", content: reply },
      ],
    });
    return Response.json({ reply });
  } catch (e) {
    return Response.json({ error: `AI lỗi: ${(e as Error).message}` }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const id = new URL(req.url).searchParams.get("exerciseId");
  if (!id) return Response.json({ error: "Thiếu exerciseId" }, { status: 400 });
  await db.chatMessage.deleteMany({ where: { exerciseId: id, userId: me.id } });
  return Response.json({ ok: true });
}
