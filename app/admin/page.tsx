import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { AdminPanel, type AdminUser } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireAdminPage(); // non-admins are redirected to "/"
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      role: true,
      disabled: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { submissions: true } },
    },
  });

  const initial: AdminUser[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    disabled: u.disabled,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    submissions: u._count.submissions,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý user</h1>
        <p className="mt-1 text-sm text-muted">
          Chỉ admin tạo được tài khoản. Bạn đang đăng nhập là <b className="text-fg">{me.username}</b>.
        </p>
      </div>
      <AdminPanel initial={initial} />
    </div>
  );
}
