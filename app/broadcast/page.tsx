import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import BroadcastForm from "@/components/broadcast-form";

export default async function BroadcastPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <header
        className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          height: "56px",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
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
      </header>

      <main className="flex-1 overflow-auto px-6 py-10 flex justify-center">
        <BroadcastForm senderName={user.name} />
      </main>
    </div>
  );
}
