import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { gemini, parseJson } from "@/lib/gemini";
import { GeneratedExerciseSchema, LEVELS, TRACKS } from "@/lib/schemas";
import { GENERATE_SYSTEM, TRACK_CONTEXT } from "@/lib/prompts";

export const maxDuration = 120;

const Body = z.object({
  track: z.enum(TRACKS),
  level: z.enum(LEVELS),
  topic: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

export async function POST(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { track, level, topic, notes } = parsed.data;

  const existing = await db.exercise.findMany({
    where: { track },
    select: { title: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const prompt = `${TRACK_CONTEXT[track]}

Hãy tạo MỘT bài tập mới.
- Track: ${track}
- Mức độ: ${level}
- Chủ đề muốn luyện: ${topic?.trim() || "tự chọn chủ đề phù hợp (ưu tiên cấu trúc dữ liệu & tối ưu)"}
${notes ? `- Yêu cầu thêm: ${notes}` : ""}
- KHÔNG trùng với các bài đã có: ${existing.map((e) => e.title).join(" | ") || "(chưa có)"}`;

  try {
    const text = await gemini({
      system: GENERATE_SYSTEM,
      turns: [{ role: "user", text: prompt }],
      json: true,
      temperature: 0.9,
    });
    const ex = GeneratedExerciseSchema.parse(parseJson(text));
    const slug = `${track.toLowerCase()}-${slugify(ex.title) || "bai-tap"}-${Date.now().toString(36)}`;
    const created = await db.exercise.create({
      data: { ...ex, slug, track, level, source: "ai" },
    });
    return Response.json({ slug: created.slug });
  } catch (e) {
    return Response.json({ error: `Không tạo được bài: ${(e as Error).message}` }, { status: 502 });
  }
}
