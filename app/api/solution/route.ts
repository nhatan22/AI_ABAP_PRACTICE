import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";

const Body = z.object({ exerciseId: z.string() });

export async function POST(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const ex = await db.exercise.findUnique({
    where: { id: parsed.data.exerciseId },
    select: { solution: true, targetBigO: true },
  });
  if (!ex) return Response.json({ error: "Không tìm thấy bài" }, { status: 404 });
  return Response.json(ex);
}
