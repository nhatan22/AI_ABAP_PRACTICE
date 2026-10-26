import { z } from "zod";
import { db } from "@/lib/db";
import { MIN_PASSWORD, apiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const Patch = z.object({
  password: z.string().min(MIN_PASSWORD, `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự`).max(200).optional(),
  disabled: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const me = await apiUser({ admin: true });
  if (me instanceof Response) return me;
  const { id } = await params;

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  if (target.role === "ADMIN") {
    return Response.json({ error: "Tài khoản admin được quản lý qua biến môi trường (.env)" }, { status: 400 });
  }

  const data: { passwordHash?: string; disabled?: boolean } = {};
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);
  if (parsed.data.disabled !== undefined) data.disabled = parsed.data.disabled;

  await db.user.update({ where: { id }, data });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await apiUser({ admin: true });
  if (me instanceof Response) return me;
  const { id } = await params;

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  if (target.role === "ADMIN" || target.id === me.id) {
    return Response.json({ error: "Không thể xoá tài khoản admin" }, { status: 400 });
  }

  await db.user.delete({ where: { id } }); // submissions & chat cascade
  return Response.json({ ok: true });
}
