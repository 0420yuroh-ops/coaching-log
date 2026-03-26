"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = {
  bg: "#1a1d23", surface: "#20242c", card: "#272b35",
  border: "#2e3340", accent: "#4f8ef7", accentSoft: "#1e3460",
  text: "#dde1ea", muted: "#7a8499", success: "#34c77b", warning: "#f5a623",
};

type Athlete = { id: string; name: string; sport: string; goal: string; };
type SessionAnalysis = {
  id: string; session_date: string; title: string;
  summary: string; mental_state: string; next_session: string;
};
type Report = {
  report_title: string; intro_message: string; progress_summary: string;
  current_strength: string; next_focus: string; closing_message: string;
};
type Coach = { name: string; service_name: string; email: string; };

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [analyses, setAnalyses] = useState<SessionAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [{ data: ath }, { data: c }] = await Promise.all([
        supabase.from("athletes").select("id, name, sport, goal").is("archived_at", null).order("created_at"),
        supabase.from("coaches").select("name, service_name, email").limit(1).single(),
      ]);
      if (ath) setAthletes(ath);
      if (c) setCoach(c);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedAthleteId) return;
    setLoadingAnalyses(true);
    setSelectedIds(new Set());
    async function loadAnalyses() {
      const { data: sessions } = await supabase.from("sessions")
        .select("id, session_date, title, ai_status")
        .eq("athlete_id", selectedAthleteId)
        .eq("ai_status", "done")
        .order("session_date", { ascending: false });
      if (!sessions || sessions.length === 0) { setAnalyses([]); setLoadingAnalyses(false); return; }
      const { data: analysisData } = await supabase.from("session_analyses")
        .select("session_id, summary, mental_state, next_session")
        .in("session_id", sessions.map(s => s.id));
      const merged: SessionAnalysis[] = sessions.map(s => ({
        id: s.id, session_date: s.session_date, title: s.title,
        summary: analysisData?.find(a => a.session_id === s.id)?.summary || "",
        mental_state: analysisData?.find(a => a.session_id === s.id)?.mental_state || "",
        next_session: analysisData?.find(a => a.session_id === s.id)?.next_session || "",
      }));
      setAnalyses(merged);
      setLoadingAnalyses(false);
    }
    loadAnalyses();
  }, [selectedAthleteId]);

  async function handleGenerate() {
    setGenerating(true); setError("");
    const selected = analyses.filter(a => selectedIds.has(a.id));
    const athlete = athletes.find(a => a.id === selectedAthleteId);
    try {
      const res = await fetch("/api/report-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete, sessions: selected }),
      });
      const data = await res.json();
      if (data.report) { setReport(data.report); setStep(3); }
      else { setError("レポートの生成に失敗しました。再度お試しください。"); setStep(1); }
    } catch { setError("レポートの生成に失敗しました。再度お試しください。"); setStep(1); }
    finally { setGenerating(false); }
  }

  function buildReportHtml() {
    const athlete = athletes.find(a => a.id === selectedAthleteId);
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;
    const sections = [
      { label: "この期間の変化・成長", content: report!.progress_summary },
      { label: "現在の強み", content: report!.current_strength },
      { label: "今後のフォーカス", content: report!.next_focus },
    ];
    return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>${athlete?.name}_メンタルコーチングレポート</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif; color: #1a1a2e; background: #fff; }
  .page { max-width: 720px; margin: 0 auto; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #e8ecf8; margin-bottom: 32px; }
  .header-left .service { font-size: 13px; color: #4a5080; font-weight: 700; margin-bottom: 4px; }
  .header-left .coach { font-size: 12px; color: #7a82a8; }
  .header-right { text-align: right; font-size: 12px; color: #7a82a8; }
  .title { text-align: center; font-size: 26px; font-weight: 700; color: #1a2060; margin-bottom: 8px; }
  .athlete-name { text-align: center; font-size: 14px; color: #5a6090; margin-bottom: 28px; }
  .intro { background: #f4f6ff; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px; font-size: 14px; line-height: 1.8; color: #2a2a4a; }
  .section { margin-bottom: 22px; }
  .section-label { font-size: 11px; font-weight: 700; color: #4a5ccc; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #d0d6f8; }
  .section-content { font-size: 14px; line-height: 1.85; color: #2a2a4a; }
  .closing { background: #f4f6ff; border-radius: 10px; padding: 18px 20px; font-size: 14px; line-height: 1.8; color: #2a2a4a; margin-top: 24px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e8ecf8; display: flex; justify-content: space-between; font-size: 11px; color: #9a9ec0; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 32px 40px; } }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="service">${coach?.service_name || ""}</div>
      <div class="coach">${coach?.name ? `コーチ：${coach.name}` : ""}</div>
    </div>
    <div class="header-right">
      <div>${dateStr}</div>
      ${coach?.email ? `<div>${coach.email}</div>` : ""}
    </div>
  </div>
  <div class="title">${report!.report_title}</div>
  <div class="athlete-name">${athlete?.name} さんへ</div>
  <div class="intro">${report!.intro_message}</div>
  ${sections.map(s => `
  <div class="section">
    <div class="section-label">${s.label}</div>
    <div class="section-content">${s.content.replace(/\n/g, "<br>")}</div>
  </div>`).join("")}
  <div class="closing">${report!.closing_message.replace(/\n/g, "<br>")}</div>
  <div class="footer">
    <div>${coach?.name || ""} / ${coach?.service_name || ""}</div>
    <div>Coaching Log</div>
  </div>
</div>
</body></html>`;
  }

  function handlePrint() {
    if (!report) return;
    const html = buildReportHtml();
    sessionStorage.setItem("reportHtml", html);
    window.location.href = "/report/preview";
  }

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  const REPORT_FIELDS: { key: keyof Report; label: string; rows: number }[] = [
    { key: "report_title", label: "レポートタイトル", rows: 1 },
    { key: "intro_message", label: "導入文", rows: 3 },
    { key: "progress_summary", label: "この期間の変化・成長", rows: 4 },
    { key: "current_strength", label: "現在の強み", rows: 3 },
    { key: "next_focus", label: "今後のフォーカス", rows: 3 },
    { key: "closing_message", label: "締めのメッセージ", rows: 3 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", color: COLORS.text }}>
      <div style={{ height: 48, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <a href="/" style={{ fontSize: 18, textDecoration: "none" }}>🏅</a>
        <div style={{ fontWeight: 800, fontSize: 14 }}>COACHING LOG</div>
        <div style={{ fontSize: 11, color: COLORS.muted, paddingLeft: 12, borderLeft: `1px solid ${COLORS.border}` }}>PDFレポート作成</div>
        <a href="/" style={{ marginLeft: "auto", fontSize: 12, color: COLORS.muted, textDecoration: "none" }}>← メインに戻る</a>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          {[{ n: 1, label: "セッション選択" }, { n: 2, label: "AI生成中" }, { n: 3, label: "確認・編集・出力" }].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step >= s.n ? COLORS.accent : COLORS.surface, color: step >= s.n ? "#fff" : COLORS.muted, border: `1px solid ${step >= s.n ? COLORS.accent : COLORS.border}` }}>{s.n}</div>
              <div style={{ fontSize: 12, color: step >= s.n ? COLORS.text : COLORS.muted, fontWeight: step === s.n ? 700 : 400 }}>{s.label}</div>
              {i < 2 && <div style={{ width: 24, height: 1, background: COLORS.border }} />}
            </div>
          ))}
        </div>

        {error && <div style={{ background: "#2a0f0f", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#ef4444", fontSize: 13 }}>{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>セッションを選択</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8, fontWeight: 600 }}>選手</div>
              <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)}
                style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", cursor: "pointer" }}>
                <option value="">選手を選択してください</option>
                {athletes.map(a => <option key={a.id} value={a.id}>{a.name}（{a.sport}）</option>)}
              </select>
            </div>

            {selectedAthleteId && (
              <div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8, fontWeight: 600 }}>
                  レポートに含めるセッションを選択
                  {analyses.length > 0 && <span style={{ marginLeft: 8 }}>AI整理済み {analyses.length}件</span>}
                </div>
                {loadingAnalyses ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.muted }}>読み込み中...</div>
                ) : analyses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.muted, fontSize: 13 }}>AI整理済みのセッションがありません</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 4 }}>
                      <button onClick={() => setSelectedIds(new Set(analyses.map(a => a.id)))} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>全選択</button>
                      <button onClick={() => setSelectedIds(new Set())} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>全解除</button>
                    </div>
                    {analyses.map(a => (
                      <div key={a.id} onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })}
                        style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${selectedIds.has(a.id) ? COLORS.accent : COLORS.border}`, background: selectedIds.has(a.id) ? COLORS.accentSoft : COLORS.surface, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.15s" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedIds.has(a.id) ? COLORS.accent : COLORS.muted}`, background: selectedIds.has(a.id) ? COLORS.accent : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {selectedIds.has(a.id) && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{a.session_date} · {a.title}</div>
                          <div style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.summary?.slice(0, 60) || "要約なし"}{(a.summary?.length || 0) > 60 ? "..." : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { setStep(2); handleGenerate(); }} disabled={selectedIds.size === 0}
              style={{ width: "100%", marginTop: 24, padding: "14px", borderRadius: 10, border: "none", background: selectedIds.size > 0 ? COLORS.accent : COLORS.border, color: selectedIds.size > 0 ? "#fff" : COLORS.muted, fontWeight: 700, fontSize: 14, cursor: selectedIds.size > 0 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              レポートを作成する（{selectedIds.size}件のセッションをまとめて分析）
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>レポートを生成しています...</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>{selectedIds.size}件のセッションを統合分析中</div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && report && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>確認・編集</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{selectedAthlete?.name} · {selectedIds.size}件のセッションをもとに生成</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setReport(null); setError(""); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 13, cursor: "pointer" }}>やり直す</button>
                <button onClick={handlePrint}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📄 PDF出力</button>
              </div>
            </div>

            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {REPORT_FIELDS.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
                  {f.rows === 1 ? (
                    <input value={report[f.key]} onChange={e => setReport(p => p ? { ...p, [f.key]: e.target.value } : p)}
                      style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 15, fontWeight: 700, padding: "10px 12px", outline: "none", boxSizing: "border-box" }} />
                  ) : (
                    <textarea value={report[f.key]} onChange={e => setReport(p => p ? { ...p, [f.key]: e.target.value } : p)} rows={f.rows}
                      style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.8, boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
            </div>

            <button onClick={handlePrint}
              style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              📄 PDF出力（印刷ダイアログが開きます）
            </button>
          </div>
        )}
      </div>
      <style>{`select option { background: #272b35; } textarea::placeholder { color: #4a5268; }`}</style>
    </div>
  );
}
