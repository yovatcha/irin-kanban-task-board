import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import KanbanBoard from "@/components/kanban-board";
import { LayoutGrid, ChevronLeft } from "lucide-react";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", backgroundColor: "var(--bg-base)" }}
    >
      {/* ── Top nav (shared design) ── */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          height: "56px",
        }}
      >
        {/* Left: Logo + back link */}
        <div className="flex items-center gap-4">
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

          <a
            href="/dashboard"
            className="flex items-center gap-1 text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Boards
          </a>
        </div>

        {/* Right: user avatar */}
        <div className="flex items-center gap-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
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
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {user.name}
          </span>
        </div>
      </header>

      {/* ── Kanban board fills remaining height ── */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard boardId={id} />
      </main>
    </div>
  );
}
