"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";

export default function BroadcastForm({ senderName }: { senderName: string }) {
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && !isSending;

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to send");
      } else {
        setResult({ sent: data.sent, failed: data.failed });
        setMessage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl rounded-2xl p-6"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="mb-4">
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Broadcast announcement
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          ส่งข้อความถึงสมาชิกทุกคนผ่าน LINE ในนามของ{" "}
          <span style={{ color: "var(--text-primary)" }}>{senderName}</span>
        </p>
      </div>

      <label
        htmlFor="broadcast-message"
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        Message
      </label>
      <textarea
        id="broadcast-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        placeholder="พิมพ์ข้อความประกาศที่นี่..."
        className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {result && (
            <span>
              ส่งสำเร็จ {result.sent} คน · ล้มเหลว {result.failed} คน
            </span>
          )}
          {error && <span style={{ color: "#ef4444" }}>{error}</span>}
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
          className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--accent-amber)",
            color: "#1C1A18",
          }}
        >
          <Send className="w-4 h-4" />
          {isSending ? "Sending..." : "Send broadcast"}
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !isSending && setConfirmOpen(false)}
        onConfirm={handleSend}
        title="Send broadcast?"
        description="ข้อความนี้จะถูกส่งถึงสมาชิกทุกคนผ่าน LINE ทันที"
        confirmText="Send"
        cancelText="Cancel"
      />
    </div>
  );
}
