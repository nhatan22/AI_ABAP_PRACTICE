import { z } from "zod";
import { authenticate, startSession } from "@/lib/auth";

const Body = z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(200) });

// Simple in-memory brute-force guard: 5 failures per ip+username -> 60s lockout.
const fails = new Map<string, { n: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 60_000;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Nhập tên đăng nhập và mật khẩu" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const key = `${ip}|${parsed.data.username.trim().toLowerCase()}`;
  const state = fails.get(key);
  if (state && state.n >= MAX_FAILS && state.until > Date.now()) {
    const wait = Math.ceil((state.until - Date.now()) / 1000);
    return Response.json({ error: `Sai quá nhiều lần. Thử lại sau ${wait}s.` }, { status: 429 });
  }

  const user = await authenticate(parsed.data.username, parsed.data.password);
  if (!user) {
    fails.set(key, { n: (state && state.until > Date.now() ? state.n : 0) + 1, until: Date.now() + LOCK_MS });
    return Response.json({ error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401 });
  }

  fails.delete(key);
  await startSession(user.id);
  return Response.json({ ok: true, role: user.role });
}
