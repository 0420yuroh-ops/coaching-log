"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = {
  bg: "#1a1d23", surface: "#20242c", card: "#272b35",
  border: "#2e3340", accent: "#4f8ef7", accentSoft: "#1e3460",
  text: "#dde1ea", muted: "#7a8499", success: "#34c77b",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        if (data.user) {
          await supabase.from("coaches").insert({
            auth_id: data.user.id, name: "", service_name: "", email,
          });
          router.push("/");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError("メールアドレスまたはパスワードが正しくありません"); return; }
        router.push("/");
      }
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}>
      <div style={{ width: 380, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, letterSpacing: "0.05em" }}>COACHING LOG</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>スポーツメンタルコーチング</div>
        </div>

        {error && (
          <div style={{ background: "#2a0f0f", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>メールアドレス</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="coach@example.com"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>パスワード</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="8文字以上"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <button onClick={handleSubmit} disabled={loading || !email.trim() || !password.trim()}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
          {loading ? "処理中..." : isSignUp ? "アカウントを作成" : "ログイン"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button onClick={() => { setIsSignUp(p => !p); setError(""); }}
            style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
            {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "新規アカウントを作成"}
          </button>
        </div>
      </div>
    </div>
  );
}