import { z } from "zod";
import { lintFor } from "@/lib/lint";
import { apiUser } from "@/lib/auth";

const Body = z.object({ track: z.enum(["ABAP", "UI5"]), code: z.string().max(40_000) });

export async function POST(req: Request) {
  const me = await apiUser();
  if (me instanceof Response) return me;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  return Response.json(lintFor(parsed.data.track, parsed.data.code));
}
