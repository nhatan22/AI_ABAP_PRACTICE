"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle2, KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";

export type AdminUser = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  submissions: number;
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");
  return data;
}

export function AdminPanel({ initial }: { initial: AdminUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    run("create", async () => {
      const { user } = await call("/api/admin/users", "POST", { username, password });
      setUsers((u) => [...u, { ...user, createdAt: user.createdAt, submissions: user._count.submissions }]);
      setNotice(`Đã tạo tài khoản "${user.username}". Hãy gửi mật khẩu cho họ.`);
      setUsername("");
      setPassword("");
    });
  };

  const toggle = (u: AdminUser) =>
    run(`t:${u.id}`, async () => {
      await call(`/api/admin/users/${u.id}`, "PATCH", { disabled: !u.disabled });
      setUsers((all) => all.map((x) => (x.id === u.id ? { ...x, disabled: !u.disabled } : x)));
    });

  const resetPassword = (u: AdminUser) => {
    const pw = prompt(`Mật khẩu mới cho "${u.username}" (tối thiểu 6 ký tự):`);
    if (!pw) return;
    run(`p:${u.id}`, async () => {
      await call(`/api/admin/users/${u.id}`, "PATCH", { password: pw });
      setNotice(`Đã đổi mật khẩu của "${u.username}".`);
    });
  };

  const remove = (u: AdminUser) => {
    if (!confirm(`Xoá "${u.username}"? Toàn bộ lịch sử nộp bài và chat của họ cũng bị xoá.`)) return;
    run(`d:${u.id}`, async () => {
      await call(`/api/admin/users/${u.id}`, "DELETE");
      setUsers((all) => all.filter((x) => x.id !== u.id));
    });
  };

  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none transition focus:border-accent";

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={15} className="text-accent" /> Tạo tài khoản mới
        </h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập (a-z, 0-9, _ . -)"
            autoComplete="off"
            required
            className={input}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (≥ 6 ký tự)"
            type="text"
            autoComplete="off"
            required
            minLength={6}
            className={input}
          />
          <button
            type="submit"
            disabled={busy === "create"}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on transition hover:brightness-110 disabled:opacity-60"
          >
            {busy === "create" && <Loader2 size={15} className="animate-spin" />} Tạo
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg border border-bad/40 bg-bad/10 p-2.5 text-sm text-bad">{error}</p>}
        {notice && <p className="mt-3 rounded-lg border border-ok/40 bg-ok/10 p-2.5 text-sm text-ok">{notice}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-panel2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tài khoản</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Lần nộp</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Đăng nhập gần nhất</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.username}</span>
                    {u.role === "ADMIN" && (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">ADMIN</span>
                    )}
                    {u.disabled && (
                      <span className="rounded bg-bad/15 px-1.5 py-0.5 text-[10px] font-semibold text-bad">ĐÃ KHOÁ</span>
                    )}
                  </div>
                  <div className="text-xs text-muted">tạo {new Date(u.createdAt).toLocaleDateString("vi-VN")}</div>
                </td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{u.submissions}</td>
                <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" ? (
                    <div className="text-right text-xs text-muted">quản lý qua .env</div>
                  ) : (
                    <div className="flex justify-end gap-1.5">
                      <IconBtn title="Đổi mật khẩu" onClick={() => resetPassword(u)} busy={busy === `p:${u.id}`}>
                        <KeyRound size={14} />
                      </IconBtn>
                      <IconBtn
                        title={u.disabled ? "Mở khoá" : "Khoá tài khoản"}
                        onClick={() => toggle(u)}
                        busy={busy === `t:${u.id}`}
                      >
                        {u.disabled ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                      </IconBtn>
                      <IconBtn title="Xoá" danger onClick={() => remove(u)} busy={busy === `d:${u.id}`}>
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  busy,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={busy}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition disabled:opacity-50 ${
        danger ? "hover:border-bad/60 hover:text-bad" : "hover:border-accent/60 hover:text-fg"
      }`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
