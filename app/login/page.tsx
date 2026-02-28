import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

const LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export default function LoginPage() {
  const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_LOGIN_CHANNEL_ID}&redirect_uri=${encodeURIComponent(
    `${APP_URL}/api/auth/line`,
  )}&state=random_state&scope=profile%20openid`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "var(--accent-amber)" }}
          >
            <LayoutGrid className="w-7 h-7" style={{ color: "#1C1A18" }} />
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Irin Task Board
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              สำหรับจัดการงานของทีมกับ LINE bot ไอริน
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-6"
          style={{ backgroundColor: "var(--border-subtle)" }}
        />

        {/* Sign in text */}
        <p
          className="text-sm text-center mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          เข้าสู่ระบบด้วยบัญชี LINE เพื่อใช้งาน
        </p>

        {/* LINE Login Button */}
        <a href={lineLoginUrl} className="block w-full">
          <button
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: "#06C755",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(6, 199, 85, 0.3)",
            }}
          >
            {/* LINE Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>
        </a>

        {/* Footer note */}
        <p
          className="text-xs text-center mt-5"
          style={{ color: "var(--text-disabled)" }}
        >
          ระบบจะใช้ข้อมูลโปรไฟล์ LINE ของคุณเพื่อสร้างบัญชี
        </p>
      </div>
    </div>
  );
}
