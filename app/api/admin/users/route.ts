import { z } from "zod";
import { db } from "@/lib/db";
import { MIN_PASSWORD, USERNAME_RE, adminUsername, apiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const userSelect = {
  id: true,
  username: true,
  role: true,
  disabled: true,
  createdAt: true,
  lastLoginAt: true,
  _count: { select: { submissions: true } },
} as const;

export async function GET() {
  const me = await apiUser({ admin: true });
  if (me instanceof Response) return me;
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" }, select: userSelect });
  return Response.json({ users });
}

const Create = z.object({
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, "Tên đăng nhập 3–32 ký tự: a-z, 0-9, _ . -"),
  password: z.string().min(MIN_PASSWORD, `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự`).max(200),
});

export async function POST(req: Request) {
  const me = await apiUser({ admin: true });
  if (me instanceof Response) return me;

  const parsed = Create.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { username, password } = parsed.data;

  if (username === adminUsername()) return Response.json({ error: "Tên này dành riêng cho admin" }, { status: 400 });
  if (await db.user.findUnique({ where: { username } })) {
    return Response.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
  }

  // Only the admin account is defined via env; everyone created here is a regular user.
  const user = await db.user.create({
    data: { username, passwordHash: await hashPassword(password), role: "USER" },
    select: userSelect,
  });
  return Response.json({ user }, { status: 201 });
}
