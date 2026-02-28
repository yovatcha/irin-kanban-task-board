import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BoardList from "@/components/board-list";
import { Search, Bell, Settings, LayoutGrid } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* ── Top Navigation Bar ── */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          height: "56px",
        }}
      >
        {/* Left: Logo + Nav links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-amber)" }}
            >
              <LayoutGrid className="w-4 h-4" style={{ color: "#1C1A18" }} />
            </div>
            <span
              className="font-semibold text-base tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Irin Board
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Boards", href: "/dashboard", active: true },
              { label: "Timeline", href: "#" },
              { label: "Calendar", href: "#" },
              { label: "Reports", href: "#" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: link.active
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  borderBottom: link.active
                    ? "2px solid var(--accent-amber)"
                    : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: Search + icons + avatar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              minWidth: "180px",
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Search tasks...</span>
          </div>

          {/* Icon buttons */}
          {[Bell, Settings].map((Icon, i) => (
            <button
              key={i}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-muted)",
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          {/* User avatar + logout */}
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2"
                style={
                  { ringColor: "var(--border-medium)" } as React.CSSProperties
                }
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent-amber)",
                  color: "#1C1A18",
                }}
              >
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto px-6 py-8">
        <BoardList />
      </main>
    </div>
  );
}
