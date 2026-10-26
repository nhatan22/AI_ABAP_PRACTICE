import Link from "next/link";
import { Code2, History, LayoutDashboard, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/exercises", label: "Bài tập", icon: ListChecks },
  { href: "/generate", label: "AI ra đề", icon: Sparkles },
  { href: "/history", label: "Lịch sử", icon: History },
];

export async function Nav() {
  const user = await getCurrentUser();
  const items = user?.role === "ADMIN" ? [...links, { href: "/admin", label: "Quản lý user", icon: ShieldCheck }] : links;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-ok text-on">
            <Code2 size={16} strokeWidth={2.6} />
          </span>
          <span>
            ABAP<span className="text-muted"> & </span>UI5 Dojo
          </span>
        </Link>
        {user && (
          <nav className="flex items-center gap-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-panel2 hover:text-fg"
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <span className="hidden items-center gap-1.5 text-xs text-muted md:flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/15 font-semibold uppercase text-accent">
                  {user.username[0]}
                </span>
                {user.username}
                {user.role === "ADMIN" && (
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">ADMIN</span>
                )}
              </span>
              <LogoutButton />
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
