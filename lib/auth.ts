import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { hashPassword, safeEqual, verifyPassword } from "./password";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export type SessionUser = { id: string; username: string; role: "ADMIN" | "USER" };

export const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
export const MIN_PASSWORD = 6;

export const adminUsername = () => (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();

/** Current user, re-checked against the DB so disabling/deleting an account takes effect immediately. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = await verifySession(token);
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.disabled) return null;
  return { id: user.id, username: user.username, role: user.role };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** For route handlers: returns the user, or a ready-made error Response. */
export async function apiUser(opts: { admin?: boolean } = {}): Promise<SessionUser | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (opts.admin && user.role !== "ADMIN") return Response.json({ error: "Chỉ admin được phép" }, { status: 403 });
  return user;
}

// Dummy hash so unknown usernames cost the same as wrong passwords.
const DUMMY = hashPassword("dummy-password-for-timing");

export async function authenticate(usernameRaw: string, password: string) {
  const username = usernameRaw.trim().toLowerCase();

  if (username === adminUsername()) {
    // The admin account is defined by env vars (ADMIN_USERNAME / ADMIN_PASSWORD) and is created on first login.
    const envPassword = process.env.ADMIN_PASSWORD;
    if (!envPassword || !safeEqual(password, envPassword)) return null;
    let admin = await db.user.findUnique({ where: { username } });
    if (!admin) {
      admin = await db.user.create({
        data: { username, passwordHash: await hashPassword(envPassword), role: "ADMIN" },
      });
    } else if (admin.role !== "ADMIN" || admin.disabled) {
      admin = await db.user.update({ where: { id: admin.id }, data: { role: "ADMIN", disabled: false } });
    }
    return admin;
  }

  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    await verifyPassword(password, await DUMMY);
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash)) || user.disabled) return null;
  return user;
}

export async function startSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
