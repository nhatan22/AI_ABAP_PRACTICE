"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      title="Đăng xuất"
      aria-label="Đăng xuất"
      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-bad/60 hover:text-bad"
    >
      <LogOut size={15} />
    </button>
  );
}
