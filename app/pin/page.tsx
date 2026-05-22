import { redirect } from "next/navigation";
import Image from "next/image";
import {
  getAccessPin,
  getCurrentUser,
  isPinVerified,
  setPinVerified,
} from "@/lib/auth";

async function verifyPin(formData: FormData) {
  "use server";
  const pin = String(formData.get("pin") ?? "").trim();
  if (pin !== getAccessPin()) {
    redirect("/pin?error=1");
  }
  await setPinVerified();
  redirect("/dashboard");
}

export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (await isPinVerified()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const hasError = error === "1";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-110"
      >
        <source src="/images/irin.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-8 shadow-xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-3xl blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, var(--accent-amber), transparent 70%)",
              }}
            />
            <div
              className="relative w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-amber), rgba(255,255,255,0.04))",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Image
                src="/logo.png"
                alt="Irin Task Board"
                width={80}
                height={80}
                priority
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              ใส่รหัส PIN
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              ยินดีต้อนรับ {user.name} — กรุณาใส่รหัสเพื่อเข้าใช้งาน
            </p>
          </div>
        </div>

        <div
          className="h-px mb-6"
          style={{ backgroundColor: "var(--border-subtle)" }}
        />

        <form action={verifyPin} className="flex flex-col gap-4">
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="••••••"
            className="w-full h-12 px-4 rounded-xl text-center text-lg tracking-[0.5em] outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
              border: `1px solid ${
                hasError ? "#ef4444" : "var(--border-subtle)"
              }`,
            }}
          />

          {hasError && (
            <p
              className="text-xs text-center -mt-1"
              style={{ color: "#ef4444" }}
            >
              รหัส PIN ไม่ถูกต้อง กรุณาลองอีกครั้ง
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--accent-amber)",
              color: "#1C1A18",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            }}
          >
            ยืนยัน
          </button>
        </form>

        <form action="/api/auth/logout" method="POST" className="mt-4">
          <button
            type="submit"
            className="w-full text-xs text-center transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
