"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const COLORS = {
  bg: "#f5f5f7",
  surface: "#ffffff",
  card: "#f9f9fb",
  border: "#e0e0e5",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  text: "#1a1a2e",
  muted: "#6b7280",
  success: "#16a34a",
  warning: "#d97706",
};

type Analysis = {
  summary: string; theme: string; mental_state: string; cognition: string;
  behavior: string; next_session: string; intervention: string; act_insight: string; nlp_insight: string;
};
type Session = { id: string; athlete_id: string; session_date: string; title: string; raw_note: string; ai_status: "none" | "done"; analysis: Analysis | null; };
type Athlete = { id: string; name: string; sport: string; goal: string; notes: string; profile: string; created_at: string; archived_at: string | null; sort_order: number; };
type SessionsMap = Record<string, Session[]>;

function useAutoSave(value: string, onSave: (v: string) => void, delay = 1500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSave(value), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);
}

function EditableField({ value, onChange, singleLine = false, color }: { value: string; onChange: (v: string) => void; singleLine?: boolean; color?: string; }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  function commit() { setEditing(false); if (draft !== value) onChange(draft); }
  const baseStyle: React.CSSProperties = { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${color || COLORS.accent}`, color: COLORS.text, fontSize: 13, lineHeight: 1.75, outline: "none", padding: "2px 0", fontFamily: "inherit", boxSizing: "border-box" };
  if (editing) {
    return singleLine
      ? <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }} style={baseStyle} />
      : <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }} style={{ ...baseStyle, resize: "none", minHeight: 60 }} rows={Math.max(2, (draft || "").split("\n").length)} />;
  }
  return (
    <div onClick={() => setEditing(true)} title="クリックして編集" style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: "text", minHeight: 22, borderRadius: 4, padding: "2px 4px", margin: "0 -4px" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {value || <span style={{ color: COLORS.muted, fontStyle: "italic" }}>クリックして入力...</span>}
    </div>
  );
}

function AnalysisResult({ analysis, onUpdate }: { analysis: Analysis; onUpdate: (a: Analysis) => void }) {
  const [openDeep, setOpenDeep] = useState(false);

  const display = [
    { key: "summary", label: "セッション要約", icon: "📋", color: "#5b8def", single: false },
    { key: "theme", label: "今回のテーマ", icon: "🎯", color: "#9b7de8", single: true },
    { key: "mental_state", label: "感情・メンタル状態", icon: "💭", color: "#d4699a", single: false },
    { key: "cognition", label: "認知パターン", icon: "🧠", color: "#c9923a", single: false },
    { key: "behavior", label: "行動変容点", icon: "🔄", color: "#3daa72", single: false },
    { key: "next_session", label: "次回セッション課題", icon: "📅", color: "#2ea8b8", single: false },
    { key: "intervention", label: "コーチの介入内容", icon: "🛠️", color: "#7a8499", single: false },
  ] as const;
  const deep = [
    { key: "act_insight", label: "ACT視点（心理的柔軟性）", icon: "🌿" },
    { key: "nlp_insight", label: "NLP視点（ビリーフ・リソース）", icon: "🔬" },
  ] as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, padding: "0 2px" }}>✏️ 各項目をクリックして編集できます</div>
      {display.map(s => (
        <div key={s.key} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${s.color}` }}>
          <div style={{ fontSize: 11, color: s.color, marginBottom: 8, fontWeight: 700, letterSpacing: "0.06em" }}>{s.icon} {s.label}</div>
          <EditableField value={analysis[s.key]} onChange={v => onUpdate({ ...analysis, [s.key]: v })} singleLine={s.single} color={s.color} />
        </div>
      ))}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
        <button onClick={() => setOpenDeep(p => !p)} style={{ width: "100%", padding: "12px 16px", background: COLORS.surface, border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700 }}>🔍 心理的深層分析（ACT / NLP）</span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>{openDeep ? "▲" : "▼"}</span>
        </button>
        {openDeep && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {deep.map(s => (
              <div key={s.key} style={{ background: COLORS.card, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, fontWeight: 700 }}>{s.icon} {s.label}</div>
                <EditableField value={analysis[s.key]} onChange={v => onUpdate({ ...analysis, [s.key]: v })} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditAthleteModal({ athlete, onClose, onSave, onDelete, onArchive }: { athlete: Athlete; onClose: () => void; onSave: (a: Partial<Athlete>) => void; onDelete: () => void; onArchive: () => void }) {
  const [name, setName] = useState(athlete.name);
  const [sport, setSport] = useState(athlete.sport || "");
  const [goal, setGoal] = useState(athlete.goal || "");
  const [profile, setProfile] = useState(athlete.profile || "");
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>選手情報を編集</div>
        {[
          { label: "名前 *", value: name, set: setName, ph: "田中 颯太" },
          { label: "競技", value: sport, set: setSport, ph: "バスケットボール" },
          { label: "目標", value: goal, set: setGoal, ph: "インターハイ出場" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>選手プロフィール</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>競技背景・性格・人間関係・モチベーション源泉など、AI分析の文脈になる情報を自由に記述してください</div>
          <textarea value={profile} onChange={e => setProfile(e.target.value)}
            placeholder={"例）高校3年。中学から競技を始め、もともと競技自体が好きで取り組んでいる。プレッシャー場面では自己批判が強くなる傾向。チームメイトとの関係は良好だが、監督への遠慮が強い。家族は競技に積極的で、特に母親のサポートが大きい。"}
            rows={7}
            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => { if (name.trim()) { onSave({ name, sport, goal, profile }); onClose(); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>保存</button>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { onArchive(); onClose(); }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 16, cursor: "pointer" }} title={athlete.archived_at ? "アーカイブから戻す" : "アーカイブする"}>
            {athlete.archived_at ? "📂" : "📁"}
          </button>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} title="削除" style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", color: COLORS.muted, fontSize: 14, cursor: "pointer", opacity: 0.5 }}>🗑️</button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#ef4444" }}>本当に削除しますか？</div>
              <button onClick={() => setConfirming(false)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>やめる</button>
              <button onClick={() => { onDelete(); onClose(); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>削除</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditSessionModal({ session, onClose, onSave, onDelete }: { session: Session; onClose: () => void; onSave: (s: { title: string; session_date: string }) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(session.title);
  const [date, setDate] = useState(session.session_date);
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 400 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>セッションを編集</div>
        {[
          { label: "日付", value: date, set: setDate, type: "date", ph: "" },
          { label: "タイトル", value: title, set: setTitle, type: "text", ph: "試合前メンタル調整" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box", colorScheme: "light" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => { if (title.trim()) { onSave({ title, session_date: date }); onClose(); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>保存</button>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} title="削除" style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: "transparent", color: COLORS.muted, fontSize: 14, cursor: "pointer", opacity: 0.5 }}>🗑️</button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#ef4444" }}>本当に削除しますか？</div>
              <button onClick={() => setConfirming(false)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>やめる</button>
              <button onClick={() => { onDelete(); onClose(); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>削除</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type AthleteDetailSession = {
  id: string; session_date: string; title: string; ai_status: string;
  analysis: Analysis | null;
};

type PeriodKey = "recent3" | "1month" | "3months" | "all";

type MetaAnalysis = {
  cognition_change: string;
  emotion_trend: string;
  recurring_themes: string;
  growth_points: string;
  next_phase: string;
};

function MetaFieldCard({ field, value, editing, onChange, collapsible }: {
  field: { key: string; label: string; color: string; icon: string };
  value: string; editing: boolean; onChange: (v: string) => void; collapsible: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", borderLeft: `3px solid ${field.color}` }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: collapsible ? "pointer" : "default" }}
        onClick={() => collapsible && setOpen(p => !p)}>
        <div style={{ fontSize: 11, color: field.color, fontWeight: 700, letterSpacing: "0.06em" }}>{field.icon} {field.label}</div>
        {collapsible && <span style={{ fontSize: 12, color: COLORS.muted }}>{open ? "▲" : "▼"}</span>}
      </div>
      {(!collapsible || open) && (
        <div style={{ padding: "0 16px 14px" }}>
          {editing ? (
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
              style={{ width: "100%", background: COLORS.card, border: `1px solid ${field.color}`, borderRadius: 6, color: COLORS.text, fontSize: 13, padding: "8px 10px", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.75, boxSizing: "border-box" }} />
          ) : (
            <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{value}</div>
          )}
        </div>
      )}
    </div>
  );
}

function AthleteDetailPanel({ athlete, coachId, onShowSession, onUpdateAnalysis }: {
  athlete: Athlete;
  coachId: string;
  onShowSession: () => void;
  onUpdateAnalysis: (sessionId: string, analysis: Analysis) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"analysis" | "overview">("overview");
  const [period, setPeriod] = useState<PeriodKey>("3months");
  const [sessions, setSessions] = useState<AthleteDetailSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<MetaAnalysis | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const [metaInfo, setMetaInfo] = useState<{ generatedAt: string; updatedAt: string; periodLabel: string; sessionCount: number } | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState<MetaAnalysis | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contract & Calendar state
  const [contract, setContract] = useState<{ id?: string; start_date: string; end_date: string; total_sessions: number; done_sessions: number } | null>(null);
  const [editingContract, setEditingContract] = useState(false);
  const [contractDraft, setContractDraft] = useState<{ start_date: string; end_date: string; total_sessions: number } | null>(null);
  const [events, setEvents] = useState<{ id: string; event_date: string; title: string; status: string; start_time?: string; end_time?: string; location?: string; memo?: string }[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [addingEvent, setAddingEvent] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventMemo, setNewEventMemo] = useState("");
  const [editingEvent, setEditingEvent] = useState<{ id: string; event_date: string; title: string; status: string; start_time?: string; end_time?: string; location?: string; memo?: string } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: "recent3", label: "直近3回" },
    { key: "1month",  label: "1ヶ月" },
    { key: "3months", label: "3ヶ月" },
    { key: "all",     label: "全期間" },
  ];

  const META_FIELDS: { key: keyof MetaAnalysis; label: string; color: string; icon: string }[] = [
    { key: "cognition_change",  label: "認知パターンの変化",       color: "#f59e0b", icon: "🧠" },
    { key: "emotion_trend",     label: "感情・メンタル状態の推移", color: "#ec4899", icon: "💭" },
    { key: "recurring_themes",  label: "繰り返されるテーマ・課題", color: "#8b5cf6", icon: "🔁" },
    { key: "growth_points",     label: "成長・変化のポイント",     color: "#10b981", icon: "📈" },
    { key: "next_phase",        label: "次のフェーズへの示唆",     color: "#3b82f6", icon: "🎯" },
  ];

  async function fetchSessions() {
    setLoading(true);
    try {
      let query = supabase.from("sessions").select("*").eq("athlete_id", athlete.id).order("session_date", { ascending: true });
      if (period === "recent3") query = supabase.from("sessions").select("*").eq("athlete_id", athlete.id).order("session_date", { ascending: false }).limit(3);
      else if (period === "1month") query = query.gte("session_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
      else if (period === "3months") query = query.gte("session_date", new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0]);
      const { data: sessionData } = await query;
      if (!sessionData) { setLoading(false); return; }
      const ids = sessionData.map(s => s.id);
      const { data: analysisData } = ids.length > 0
        ? await supabase.from("session_analyses").select("*").in("session_id", ids)
        : { data: [] };
      const merged: AthleteDetailSession[] = sessionData.map(s => ({
        ...s, analysis: analysisData?.find((a: { session_id: string }) => a.session_id === s.id) || null,
      }));
      const sorted = period === "recent3" ? merged : [...merged].reverse();
      setSessions(sorted);
    } finally { setLoading(false); }
  }

  async function fetchSavedMeta() {
    const { data } = await supabase.from("longitudinal_analyses").select("*").eq("athlete_id", athlete.id).maybeSingle();
    if (data) {
      setMeta({ cognition_change: data.cognition_change, emotion_trend: data.emotion_trend, recurring_themes: data.recurring_themes, growth_points: data.growth_points, next_phase: data.next_phase });
      setMetaInfo({ generatedAt: data.generated_at, updatedAt: data.updated_at, periodLabel: data.period, sessionCount: data.session_count });
    }
  }

  async function fetchContract() {
    const { data } = await supabase.from("contracts").select("*").eq("athlete_id", athlete.id).maybeSingle();
    if (data) setContract(data);
  }

  async function fetchEvents() {
    const { data } = await supabase.from("schedule_events").select("*").eq("athlete_id", athlete.id).order("event_date");
    if (data) setEvents(data);
  }

  async function handleSaveContract() {
    if (!contractDraft) return;
    if (contract?.id) {
      await supabase.from("contracts").update({ ...contractDraft, updated_at: new Date().toISOString() }).eq("id", contract.id);
      setContract({ ...contract, ...contractDraft });
    } else {
      const { data } = await supabase.from("contracts").insert({ athlete_id: athlete.id, ...contractDraft }).select().single();
      if (data) setContract(data);
    }
    setEditingContract(false);
    showToast("契約情報を保存しました", true);
  }

  async function handleAddEvent(date: string) {
    if (!newEventTitle.trim()) return;
    const { data } = await supabase.from("schedule_events").insert({
      athlete_id: athlete.id,
      event_date: date,
      title: newEventTitle,
      status: "planned",
      start_time: newEventStartTime || null,
      end_time: newEventEndTime || null,
      location: newEventLocation || null,
      memo: newEventMemo || null,
    }).select().single();
    if (data) setEvents(prev => [...prev, data]);
    setAddingEvent(null);
    setNewEventTitle("");
    setNewEventStartTime("");
    setNewEventEndTime("");
    setNewEventLocation("");
    setNewEventMemo("");
  }

  async function handleUpdateEvent() {
    if (!editingEvent || !editingEvent.title.trim()) return;
    await supabase.from("schedule_events").update({
      title: editingEvent.title,
      start_time: editingEvent.start_time || null,
      end_time: editingEvent.end_time || null,
      location: editingEvent.location || null,
      memo: editingEvent.memo || null,
      status: editingEvent.status,
    }).eq("id", editingEvent.id);
    setEvents(prev => prev.map(e => e.id === editingEvent.id ? editingEvent : e));
    setEditingEvent(null);
  }

  async function handleToggleEvent(event: { id: string; status: string }) {
    const newStatus = event.status === "planned" ? "done" : "planned";
    await supabase.from("schedule_events").update({ status: newStatus }).eq("id", event.id);
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e));
  }

  async function handleDeleteEvent(id: string) {
    await supabase.from("schedule_events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function handleGenerateMeta() {
    const aiSessions = sessions.filter(s => s.analysis);
    if (aiSessions.length === 0) return;
    setMetaLoading(true); setMetaError(false);
    try {
      const res = await fetch("/api/meta-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete, sessions: aiSessions }),
      });
      const data = await res.json();
      if (data.meta) {
        const now = new Date().toISOString();
        const periodLabel = PERIODS.find(p => p.key === period)?.label || period;
        await supabase.from("longitudinal_analyses").upsert({
          athlete_id: athlete.id, ...data.meta,
          coach_id: coachId,
          period: periodLabel, session_count: aiSessions.length,
          generated_at: now, updated_at: now,
        }, { onConflict: "athlete_id" });
        setMeta(data.meta);
        setMetaInfo({ generatedAt: now, updatedAt: now, periodLabel, sessionCount: aiSessions.length });
      } else setMetaError(true);
    } catch { setMetaError(true); }
    finally { setMetaLoading(false); }
  }

  async function autoSaveMeta(draft: MetaAnalysis) {
    const now = new Date().toISOString();
    await supabase.from("longitudinal_analyses").upsert({
      athlete_id: athlete.id, ...draft,
      coach_id: coachId,
      period: metaInfo?.periodLabel || "", session_count: metaInfo?.sessionCount || 0,
      generated_at: metaInfo?.generatedAt || now, updated_at: now,
    }, { onConflict: "athlete_id" });
    setMetaInfo(prev => prev ? { ...prev, updatedAt: now } : null);
    setMeta(draft);
    showToast("保存しました", true);
  }

  function handleMetaFieldChange(key: keyof MetaAnalysis, value: string) {
    const updated = { ...(metaDraft || meta!), [key]: value };
    setMetaDraft(updated);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSaveMeta(updated), 1500);
  }

  useEffect(() => { fetchSessions(); }, [period, athlete.id]);
  useEffect(() => {
    setMeta(null);
    setMetaInfo(null);
    setMetaDraft(null);
    setContract(null);
    setEvents([]);
    setEditingContract(false);
    setAddingEvent(null);
    setEditingEvent(null);
    setHoveredEvent(null);
    fetchSavedMeta();
    fetchContract();
    fetchEvents();
  }, [athlete.id]);

  const aiCount = sessions.filter(s => s.analysis).length;
  const displayMeta = metaDraft || meta;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  // Calendar helpers
  function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
  function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
  function getEventsForDate(dateStr: string) { return events.filter(e => e.event_date === dateStr); }

  // Contract progress（日数ベース）
  const sessionsDone = contract?.done_sessions || 0;
  const totalSessions = contract?.total_sessions || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateProgress = (() => {
    if (!contract?.start_date || !contract?.end_date) return 0;
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    if (total <= 0) return 0;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: COLORS.bg, fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", color: COLORS.text }}>

      {toast && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#0f2a1a" : "#2a0f0f", border: `1px solid ${toast.ok ? COLORS.success : "#ef4444"}`, color: toast.ok ? COLORS.success : "#ef4444", fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 8, zIndex: 10, whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{athlete.name[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{athlete.name}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{athlete.sport} · {athlete.goal}</div>
            </div>
          </div>
          <button onClick={onShowSession}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>
            📝 セッション
          </button>
        </div>
        {athlete.profile && (
          <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6, background: COLORS.surface, borderRadius: 8, padding: "6px 10px" }}>{athlete.profile}</div>
        )}
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {[{ key: "overview", label: "概要" }, { key: "analysis", label: "縦断分析" }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as "analysis" | "overview")}
              style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${activeTab === t.key ? COLORS.accent : COLORS.border}`, background: activeTab === t.key ? COLORS.accentSoft : "transparent", color: activeTab === t.key ? COLORS.accent : COLORS.muted, fontSize: 12, fontWeight: activeTab === t.key ? 700 : 400, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ===== 概要タブ ===== */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* 契約バー */}
              <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{sessionsDone}<span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 400 }}>/{totalSessions || "—"}</span></span>
                    {totalSessions > 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>残{totalSessions - sessionsDone}回</span>}
                  </div>
                  <button onClick={() => { setEditingContract(p => !p); setContractDraft(contract ? { start_date: contract.start_date, end_date: contract.end_date, total_sessions: contract.total_sessions } : { start_date: "", end_date: "", total_sessions: 10 }); }}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>
                    {editingContract ? "✕" : "✏️"}
                  </button>
                </div>

                {editingContract && contractDraft && (
                  <div style={{ background: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>開始日</div>
                        <input type="date" value={contractDraft.start_date} onChange={e => setContractDraft(p => p ? { ...p, start_date: e.target.value } : p)}
                          style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box", colorScheme: "light" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>終了日</div>
                        <input type="date" value={contractDraft.end_date} onChange={e => setContractDraft(p => p ? { ...p, end_date: e.target.value } : p)}
                          style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box", colorScheme: "light" }} />
                      </div>
                      <div style={{ width: 80 }}>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>総回数</div>
                        <input type="number" value={contractDraft.total_sessions} min={1} max={100} onChange={e => setContractDraft(p => p ? { ...p, total_sessions: Number(e.target.value) } : p)}
                          style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <button onClick={handleSaveContract} style={{ padding: "8px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>保存</button>
                  </div>
                )}

                {/* プログレスバー（日数ベース） */}
                {contract?.start_date && contract?.end_date && (
                  <>
                    {/* 期間表示 */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
                      <span>{contract.start_date}</span>
                      <span style={{ color: COLORS.accent, fontWeight: 600 }}>{dateProgress}%</span>
                      <span>{contract.end_date}</span>
                    </div>
                    {/* バー（日数ベース） */}
                    <div style={{ height: 6, background: COLORS.card, borderRadius: 3, marginBottom: 12, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
                      <div style={{ width: `${dateProgress}%`, height: "100%", background: COLORS.accent, borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                    {/* セッションドット（タップで済みに変換） */}
                    {totalSessions > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {Array.from({ length: totalSessions }).map((_, i) => (
                          <div key={i}
                            title={`${i + 1}回目${i < sessionsDone ? "（済み）" : "（未）"}`}
                          onClick={async () => {
                              const newDone = i < sessionsDone ? i : i + 1;
                              await supabase.from("contracts").update({ done_sessions: newDone, updated_at: new Date().toISOString() }).eq("id", contract!.id!);
                              setContract(prev => prev ? { ...prev, done_sessions: newDone } : prev);
                            }}
                            style={{ width: 12, height: 12, borderRadius: "50%", background: i < sessionsDone ? COLORS.accent : "transparent", border: `1.5px solid ${i < sessionsDone ? COLORS.accent : COLORS.border}`, cursor: "pointer", transition: "all 0.15s" }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
                {!contract && !editingContract && (
                  <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: COLORS.muted }}>
                    ✏️ 右上のボタンで契約情報を設定してください
                  </div>
                )}
              </div>

              {/* カレンダー */}
              <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <button onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 18, cursor: "pointer" }}>‹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{calMonth.getFullYear()}年{calMonth.getMonth() + 1}月</span>
                  <button onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 18, cursor: "pointer" }}>›</button>
                </div>

                {/* 曜日ヘッダー */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 4 }}>
                  {["日","月","火","水","木","金","土"].map(d => (
                    <div key={d} style={{ fontSize: 10, color: COLORS.muted, padding: "2px 0" }}>{d}</div>
                  ))}
                </div>

                {/* 日付グリッド */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: getFirstDayOfWeek(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayEvents = getEventsForDate(dateStr);
                    const today = new Date().toISOString().split("T")[0];
                    const isToday = dateStr === today;
                    return (
                      <div key={day} onClick={() => { setAddingEvent(dateStr); setNewEventTitle(""); }}
                        style={{ textAlign: "center", padding: "4px 2px", borderRadius: 6, cursor: "pointer", background: isToday ? COLORS.accentSoft : "transparent", border: isToday ? `1px solid ${COLORS.accent}` : "1px solid transparent" }}>
                        <div style={{ fontSize: 11, color: isToday ? COLORS.accent : COLORS.text, fontWeight: isToday ? 700 : 400 }}>{day}</div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
                          {dayEvents.map(ev => (
                            <div key={ev.id} style={{ position: "relative" }}>
                              <div
                                onClick={e => { e.stopPropagation(); handleToggleEvent(ev); }}
                                onMouseEnter={() => setHoveredEvent(ev.id)}
                                onMouseLeave={() => setHoveredEvent(null)}
                                onTouchStart={e => {
                                  e.stopPropagation();
                                  longPressTimer.current = setTimeout(() => {
                                    setEditingEvent(ev);
                                    setAddingEvent(null);
                                  }, 600);
                                }}
                                onTouchEnd={e => {
                                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                                }}
                                onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                                onContextMenu={e => { e.preventDefault(); setEditingEvent(ev); setAddingEvent(null); }}
                                style={{ width: 10, height: 10, borderRadius: "50%", background: ev.status === "done" ? COLORS.accent : COLORS.warning, cursor: "pointer", border: `1.5px solid ${ev.status === "done" ? COLORS.accent : COLORS.warning}` }} />
                              {/* PC：ホバーツールチップ */}
                              {hoveredEvent === ev.id && (
                                <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: COLORS.text, color: COLORS.surface, fontSize: 10, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 100, pointerEvents: "none" }}>
                                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                                  {ev.start_time && <div>{ev.start_time}{ev.end_time ? `〜${ev.end_time}` : ""}</div>}
                                  {ev.location && <div>📍 {ev.location}</div>}
                                  {ev.memo && <div>{ev.memo}</div>}
                                  <div style={{ opacity: 0.7, marginTop: 2 }}>{ev.status === "done" ? "✓ 実施済み" : "予定"} · 右クリックで編集</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 予定追加フォーム */}
                {addingEvent && (
                  <div style={{ marginTop: 12, background: COLORS.card, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10 }}>{addingEvent} に予定を追加</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
                        placeholder="タイトル（例：セッション・試合）"
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 3 }}>開始時刻</div>
                          <input type="time" value={newEventStartTime} onChange={e => setNewEventStartTime(e.target.value)}
                            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 3 }}>終了時刻</div>
                          <input type="time" value={newEventEndTime} onChange={e => setNewEventEndTime(e.target.value)}
                            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <input value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)}
                        placeholder="場所（任意）"
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", boxSizing: "border-box" }} />
                      <textarea value={newEventMemo} onChange={e => setNewEventMemo(e.target.value)}
                        placeholder="メモ（任意）" rows={2}
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", resize: "none", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleAddEvent(addingEvent)}
                          style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: COLORS.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>追加</button>
                        <button onClick={() => { setAddingEvent(null); setNewEventTitle(""); setNewEventStartTime(""); setNewEventEndTime(""); setNewEventLocation(""); setNewEventMemo(""); }}
                          style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 12, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* イベント編集パネル */}
                {editingEvent && (
                  <div style={{ marginTop: 12, background: COLORS.card, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.accent}` }}>
                    <div style={{ fontSize: 11, color: COLORS.accent, marginBottom: 10, fontWeight: 600 }}>{editingEvent.event_date} の予定を編集</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={editingEvent.title} onChange={e => setEditingEvent(p => p ? { ...p, title: e.target.value } : p)}
                        placeholder="タイトル"
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 3 }}>開始時刻</div>
                          <input type="time" value={editingEvent.start_time || ""} onChange={e => setEditingEvent(p => p ? { ...p, start_time: e.target.value } : p)}
                            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 3 }}>終了時刻</div>
                          <input type="time" value={editingEvent.end_time || ""} onChange={e => setEditingEvent(p => p ? { ...p, end_time: e.target.value } : p)}
                            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <input value={editingEvent.location || ""} onChange={e => setEditingEvent(p => p ? { ...p, location: e.target.value } : p)}
                        placeholder="場所"
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", boxSizing: "border-box" }} />
                      <textarea value={editingEvent.memo || ""} onChange={e => setEditingEvent(p => p ? { ...p, memo: e.target.value } : p)}
                        placeholder="メモ" rows={2}
                        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "7px 10px", outline: "none", resize: "none", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleUpdateEvent}
                          style={{ flex: 1, padding: "7px", borderRadius: 6, border: "none", background: COLORS.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>保存</button>
                        <button onClick={() => { setEditingEvent(p => p ? { ...p, status: p.status === "done" ? "planned" : "done" } : p); }}
                          style={{ flex: 1, padding: "7px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: editingEvent.status === "done" ? "#dcfce7" : COLORS.surface, color: editingEvent.status === "done" ? COLORS.success : COLORS.muted, fontSize: 11, cursor: "pointer" }}>
                          {editingEvent.status === "done" ? "✓ 実施済み" : "実施済みにする"}
                        </button>
                        <button onClick={() => { handleDeleteEvent(editingEvent.id); setEditingEvent(null); }}
                          style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid #fca5a5`, background: "#fff1f2", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>削除</button>
                        <button onClick={() => setEditingEvent(null)}
                          style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 12, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 凡例 */}
                <div style={{ display: "flex", gap: 12, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: COLORS.muted }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.accent }} />実施済み（タップで切替）
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: COLORS.muted }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.warning }} />予定
                  </div>
                </div>
              </div>

              {/* 現在の状況 */}
              <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10, fontWeight: 600 }}>現在の状況</div>
                {displayMeta ? (
                  <div>
                    <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, marginBottom: 10 }}>{displayMeta.growth_points}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.7, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                      <span style={{ color: COLORS.accent }}>課題：</span>{displayMeta.recurring_themes}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.muted }}>縦断分析タブで分析を生成すると表示されます</div>
                )}
              </div>
            </div>
          )}

          {/* ===== 縦断分析タブ ===== */}
          {activeTab === "analysis" && (
            <>
              {/* Period selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, marginRight: 4 }}>分析期間</div>
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => setPeriod(p.key)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${period === p.key ? COLORS.accent : COLORS.border}`, background: period === p.key ? COLORS.accentSoft : "transparent", color: period === p.key ? COLORS.accent : COLORS.muted, fontSize: 12, fontWeight: period === p.key ? 700 : 400, cursor: "pointer" }}>
                    {p.label}
                  </button>
                ))}
                {!loading && <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.muted }}>{sessions.length}件 · AI済 {aiCount}件</div>}
              </div>

              {metaInfo && displayMeta && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "8px 12px", background: COLORS.surface, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>
                    生成：{formatDate(metaInfo.generatedAt)} · 更新：{formatDate(metaInfo.updatedAt)} · {metaInfo.periodLabel} {metaInfo.sessionCount}件
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingMeta(p => !p)} style={{ padding: "3px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: editingMeta ? COLORS.accentSoft : "transparent", color: editingMeta ? COLORS.accent : COLORS.muted, fontSize: 11, cursor: "pointer" }}>
                      {editingMeta ? "✓ 編集中（自動保存）" : "✏️ 編集"}
                    </button>
                    <button onClick={() => { setMetaDraft(null); handleGenerateMeta(); }} style={{ padding: "3px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>再生成</button>
                  </div>
                </div>
              )}

              {!displayMeta && !metaLoading && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16, lineHeight: 1.7 }}>
                    {aiCount === 0 ? "AI整理済みのセッションがありません。" : `期間内のAI整理済みセッション ${aiCount}件 をまとめて縦断分析します。`}
                  </div>
                  {aiCount > 0 && (
                    <button onClick={handleGenerateMeta} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      ✨ 縦断分析を生成
                    </button>
                  )}
                </div>
              )}

              {metaLoading && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>✨</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>縦断分析を生成中...</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{aiCount}件のセッションデータを読み込んでいます</div>
                </div>
              )}

              {metaError && !metaLoading && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>分析の生成に失敗しました</div>
                  <button onClick={handleGenerateMeta} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 12, cursor: "pointer" }}>再試行</button>
                </div>
              )}

              {displayMeta && !metaLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {META_FIELDS.map(f => (
                    <MetaFieldCard key={f.key} field={f} value={metaDraft ? metaDraft[f.key] : displayMeta[f.key]} editing={editingMeta} onChange={v => handleMetaFieldChange(f.key, v)} collapsible={f.key === "next_phase"} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}


function Sidebar({ athletes, selectedId, onSelect, onAdd, onEdit, onDetail, onReorder, onArchive }: {
  athletes: Athlete[]; selectedId: string | null;
  onSelect: (id: string) => void; onAdd: () => void; onEdit: (a: Athlete) => void; onDetail: (a: Athlete) => void;
  onReorder: (newOrder: Athlete[]) => void; onArchive: (a: Athlete) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const active = athletes.filter(a => !a.archived_at).sort((a, b) => a.sort_order - b.sort_order);
  const archived = athletes.filter(a => a.archived_at);

  function handleDragStart(id: string) { setDraggingId(id); }
  function handleDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDragOverId(id); }
  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const list = [...active];
    const fromIdx = list.findIndex(a => a.id === draggingId);
    const toIdx = list.findIndex(a => a.id === targetId);
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    const updated = list.map((a, i) => ({ ...a, sort_order: i }));
    onReorder(updated);
    setDraggingId(null); setDragOverId(null);
  }

  return (
    <div style={{ width: 220, minWidth: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>Athletes</div>
          <button onClick={onAdd} style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}`, color: COLORS.accent, fontSize: 20, fontWeight: 300, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {active.map(a => (
          <div key={a.id}
            draggable
            onDragStart={() => handleDragStart(a.id)}
            onDragOver={e => handleDragOver(e, a.id)}
            onDrop={() => handleDrop(a.id)}
            onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
            onClick={() => onSelect(a.id)}
            onTouchStart={e => {
              const timer = setTimeout(() => { onEdit(a); }, 600);
              (e.currentTarget as HTMLElement).dataset.longPress = String(timer);
            }}
            onTouchEnd={e => {
              const timer = Number((e.currentTarget as HTMLElement).dataset.longPress);
              if (timer) clearTimeout(timer);
            }}
            onTouchMove={e => {
              const timer = Number((e.currentTarget as HTMLElement).dataset.longPress);
              if (timer) clearTimeout(timer);
            }}
            style={{ padding: "10px 12px", borderRadius: 8, cursor: "grab", marginBottom: 2, background: selectedId === a.id ? COLORS.accentSoft : dragOverId === a.id ? COLORS.card : "transparent", border: `1px solid ${selectedId === a.id ? COLORS.accent : dragOverId === a.id ? COLORS.border : "transparent"}`, transition: "all 0.15s", opacity: draggingId === a.id ? 0.4 : 1, position: "relative" }}
            onMouseEnter={e => { const btn = e.currentTarget.querySelector(".edit-btn") as HTMLElement; if (btn) btn.style.opacity = "1"; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector(".edit-btn") as HTMLElement; if (btn) btn.style.opacity = "0"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{a.name[0]}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{a.sport}</div>
              </div>
              <button className="edit-btn" onClick={e => { e.stopPropagation(); onEdit(a); }} style={{ opacity: 0, background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 12, padding: "2px 4px", borderRadius: 4, transition: "opacity 0.15s", flexShrink: 0 }}>✏️</button>
            </div>
          </div>
        ))}

        {/* アーカイブ：アクティブ選手の下に配置 */}
        {archived.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={() => setShowArchived(p => !p)}
              style={{ width: "100%", padding: "6px 10px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 12, borderRadius: 6 }}>
              <span>📁</span>
              <span>アーカイブ ({archived.length})</span>
              <span style={{ marginLeft: "auto" }}>{showArchived ? "▲" : "▼"}</span>
            </button>
            {showArchived && archived.map(a => (
              <div key={a.id} onClick={() => onSelect(a.id)}
                style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: selectedId === a.id ? COLORS.accentSoft : "transparent", opacity: 0.6 }}
                onMouseEnter={e => { const btn = e.currentTarget.querySelector(".edit-btn") as HTMLElement; if (btn) btn.style.opacity = "1"; }}
                onMouseLeave={e => { const btn = e.currentTarget.querySelector(".edit-btn") as HTMLElement; if (btn) btn.style.opacity = "0"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.muted, flexShrink: 0 }}>{a.name[0]}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                  </div>
                  <button className="edit-btn" onClick={e => { e.stopPropagation(); onEdit(a); }} style={{ opacity: 0, background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 12, padding: "2px 4px", borderRadius: 4, transition: "opacity 0.15s", flexShrink: 0 }}>✏️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionList({ athlete, sessions, selectedId, onSelect, onAdd, onDetail }: { athlete: Athlete | undefined; sessions: Session[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void; onDetail: (a: Athlete) => void }) {
  if (!athlete) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.surface, borderRight: `1px solid ${COLORS.border}` }}>
      <div style={{ textAlign: "center", color: COLORS.muted }}><div style={{ fontSize: 32, marginBottom: 8 }}>👈</div><div style={{ fontSize: 13 }}>選手を選択してください</div></div>
    </div>
  );
  return (
    <div style={{ width: 260, minWidth: 260, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{athlete.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => onDetail(athlete)} title="選手ダッシュボード" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.muted, fontSize: 13, padding: "3px 8px", cursor: "pointer" }}>📊</button>
            <button onClick={onAdd} style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}`, color: COLORS.accent, fontSize: 20, fontWeight: 300, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>{athlete.sport} · {athlete.goal}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {sessions.length === 0 && <div style={{ textAlign: "center", padding: "32px 16px", color: COLORS.muted, fontSize: 13 }}>セッションがありません</div>}
        {sessions.map(s => (
          <div key={s.id} onClick={() => onSelect(s.id)} style={{ padding: "12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: selectedId === s.id ? COLORS.card : "transparent", border: `1px solid ${selectedId === s.id ? COLORS.border : "transparent"}`, transition: "all 0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{s.session_date}</div>
              {s.ai_status === "done" ? <div style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>AI済</div> : <div style={{ fontSize: 10, background: COLORS.card, color: COLORS.muted, padding: "2px 6px", borderRadius: 4, border: `1px solid ${COLORS.border}` }}>未整理</div>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.raw_note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionDetail({ session, athlete, onUpdateNote, onUpdateAnalysis, onAnalyze, analyzing, onEditSession, onShowDashboard }: { session: Session | undefined; athlete: Athlete | undefined; onUpdateNote: (note: string) => void; onUpdateAnalysis: (a: Analysis) => void; onAnalyze: (note: string) => void; analyzing: boolean; onEditSession: (s: Session) => void; onShowDashboard?: () => void }) {
  const [note, setNote] = useState(session?.raw_note || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [activeTab, setActiveTab] = useState<"note" | "result">(session?.ai_status === "done" ? "result" : "note");
  useEffect(() => { setNote(session?.raw_note || ""); setActiveTab(session?.ai_status === "done" ? "result" : "note"); setSaveStatus("saved"); }, [session?.id]);
  useAutoSave(note, (v) => { onUpdateNote(v); setSaveStatus("saved"); });
  if (!session) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg }}>
      <div style={{ textAlign: "center", color: COLORS.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>📝</div><div style={{ fontSize: 14 }}>セッションを選択してください</div></div>
    </div>
  );
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bg, height: "100%", minWidth: 0 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{session.title}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{athlete?.name} · {session.session_date}</div>
            </div>
            <button onClick={() => onEditSession(session)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 13, padding: "4px 6px", borderRadius: 4 }} title="セッションを編集">✏️</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, color: saveStatus === "saving" ? COLORS.warning : COLORS.success }}>{saveStatus === "saving" ? "保存中..." : "✓ 保存済"}</div>
            {onShowDashboard && (
              <button onClick={onShowDashboard} title="ダッシュボードに戻る" style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 13, cursor: "pointer" }}>📊</button>
            )}
            {session.ai_status !== "done" ? (
              <button onClick={() => { onAnalyze(note); setActiveTab("result"); }} disabled={analyzing || !note.trim()} style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: analyzing ? "wait" : "pointer", background: analyzing ? COLORS.border : COLORS.accent, color: analyzing ? COLORS.muted : "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                {analyzing ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> 整理中...</> : <><span>✨</span> AI整理</>}
              </button>
            ) : (
              <button onClick={() => { onAnalyze(note); setActiveTab("result"); }} disabled={analyzing} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, cursor: "pointer", background: "transparent", color: COLORS.muted }}>再整理</button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {(["note", "result"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: activeTab === tab ? COLORS.accent : "transparent", color: activeTab === tab ? "#fff" : COLORS.muted, transition: "all 0.15s" }}>
              {tab === "note" ? "📝 生メモ" : "✨ 整理結果"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activeTab === "note" && (
          <textarea value={note} onChange={e => { setNote(e.target.value); setSaveStatus("saving"); }} placeholder={"セッション中のメモをそのまま入力してください\n\n例）\n今日は試合3日前。昨夜よく眠れなかったと。シュートの調子は戻ってきている。\nでも本番になると緊張してしまうと言っていた。\nルーティンの話をしたら「やってみる」と前向きな反応。..."}
            style={{ width: "100%", height: "calc(100vh - 280px)", minHeight: 320, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.text, fontSize: 14, lineHeight: 1.8, padding: "16px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        )}
        {activeTab === "result" && (
          session.ai_status === "done" && session.analysis ? <AnalysisResult analysis={session.analysis} onUpdate={onUpdateAnalysis} /> :
          analyzing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: COLORS.muted }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>AI整理中...</div>
              <div style={{ fontSize: 12 }}>コーチングログを構造化しています</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: COLORS.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 14 }}>生メモを入力してAI整理を実行してください</div>
            </div>
          )
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } textarea::placeholder { color: #3a4560; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #252d3d; border-radius: 3px; }`}</style>
    </div>
  );
}

function AddAthleteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: { name: string; sport: string; goal: string }) => void }) {
  const [name, setName] = useState(""); const [sport, setSport] = useState(""); const [goal, setGoal] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 400 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>選手を追加</div>
        {[{ label: "名前 *", value: name, set: setName, ph: "田中 颯太" }, { label: "競技", value: sport, set: setSport, ph: "バスケットボール" }, { label: "目標", value: goal, set: setGoal, ph: "インターハイ出場" }].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => { if (name.trim()) { onAdd({ name, sport, goal }); onClose(); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>追加</button>
        </div>
      </div>
    </div>
  );
}

function AddSessionModal({ athleteName, onClose, onAdd }: { athleteName: string; onClose: () => void; onAdd: (s: { title: string; date: string }) => void }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 400 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>新規セッション</div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 20 }}>{athleteName}</div>
        {[{ label: "日付", value: date, set: setDate, type: "date", ph: "" }, { label: "タイトル", value: title, set: setTitle, type: "text", ph: "試合前メンタル調整" }].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box", colorScheme: "light" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => { if (title.trim()) { onAdd({ title, date }); onClose(); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>作成</button>
        </div>
      </div>
    </div>
  );
}

type Coach = { id: string; name: string; service_name: string; email: string; };

function CoachSettingsModal({ onClose, coach, onSave }: { onClose: () => void; coach: Coach | null; onSave: (c: Coach) => void }) {
  const [name, setName] = useState(coach?.name || "");
  const [serviceName, setServiceName] = useState(coach?.service_name || "");
  const [email, setEmail] = useState(coach?.email || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (coach?.id) {
        await supabase.from("coaches").update({ name, service_name: serviceName, email, updated_at: new Date().toISOString() }).eq("id", coach.id);
        onSave({ ...coach, name, service_name: serviceName, email });
      } else {
        const { data } = await supabase.from("coaches").insert({ name, service_name: serviceName, email }).select().single();
        if (data) onSave(data);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 420 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>コーチ設定</div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 20 }}>PDFレポートのヘッダーに表示されます</div>
        {[
          { label: "コーチ名 *", value: name, set: setName, ph: "山田 太郎" },
          { label: "サービス名・団体名", value: serviceName, set: setServiceName, ph: "〇〇スポーツアカデミー" },
          { label: "メールアドレス", value: email, set: setEmail, ph: "coach@example.com" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: saved ? COLORS.success : COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
            {saved ? "✓ 保存しました" : saving ? "保存中..." : "保存"}
          </button>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={() => { supabase.auth.signOut(); window.location.href = "/login"; }}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 13, cursor: "pointer" }}>
            ログアウト
          </button>
          <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/terms" target="_blank" style={{ fontSize: 11, color: COLORS.muted, textDecoration: "none" }}>利用規約</a>
            <span style={{ fontSize: 11, color: COLORS.border }}>|</span>
            <a href="/privacy" target="_blank" style={{ fontSize: 11, color: COLORS.muted, textDecoration: "none" }}>プライバシーポリシー</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<SessionsMap>({});
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [showCoachSettings, setShowCoachSettings] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    async function loadAthletes() {
      const { data } = await supabase.from("athletes").select("*").order("sort_order").order("created_at");
      if (data && data.length > 0) {
        setAthletes(data);
        const firstActive = data.find(a => !a.archived_at);
        if (firstActive) setSelectedAthleteId(firstActive.id);
      }
      setLoading(false);
    }
    async function loadCoach() {
      const { data } = await supabase.from("coaches").select("*").limit(1).single();
      if (data) setCoach(data);
    }
    loadAthletes();
    loadCoach();
  }, []);

  useEffect(() => {
    if (!selectedAthleteId) return;
    async function loadSessions() {
      const { data: sessionData } = await supabase.from("sessions").select("*").eq("athlete_id", selectedAthleteId).order("session_date", { ascending: false });
      if (!sessionData) return;
      const { data: analysisData } = await supabase.from("session_analyses").select("*").in("session_id", sessionData.map(s => s.id));
      const sessionsWithAnalysis: Session[] = sessionData.map(s => ({ ...s, analysis: analysisData?.find(a => a.session_id === s.id) || null }));
      setSessions(prev => ({ ...prev, [selectedAthleteId!]: sessionsWithAnalysis }));
      if (sessionsWithAnalysis.length > 0) setSelectedSessionId(sessionsWithAnalysis[0].id);
    }
    loadSessions();
  }, [selectedAthleteId]);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  const athleteSessions = selectedAthleteId ? (sessions[selectedAthleteId] || []) : [];
  const selectedSession = athleteSessions.find(s => s.id === selectedSessionId);

  function handleSelectAthlete(id: string) { setSelectedAthleteId(id); setSelectedSessionId(null); }

  async function handleUpdateNote(note: string) {
    if (!selectedSessionId) return;
    setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, raw_note: note } : s) }));
    await supabase.from("sessions").update({ raw_note: note, updated_at: new Date().toISOString() }).eq("id", selectedSessionId);
  }

  async function handleUpdateAnalysis(analysis: Analysis) {
    if (!selectedSessionId) return;
    setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, analysis } : s) }));
    await supabase.from("session_analyses").upsert({ session_id: selectedSessionId, ...analysis, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
  }

  async function handleAnalyze(note: string) {
    if (!note.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note, athlete: selectedAthlete }) });
      const data = await res.json();
      if (data.analysis) {
        const analysis = data.analysis;
        setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, ai_status: "done", analysis } : s) }));
        await supabase.from("sessions").update({ ai_status: "done", updated_at: new Date().toISOString() }).eq("id", selectedSessionId);
        await supabase.from("session_analyses").upsert({ session_id: selectedSessionId, ...analysis, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
      }
    } catch (err) { console.error(err); }
    finally { setAnalyzing(false); }
  }

  async function handleAddAthlete({ name, sport, goal }: { name: string; sport: string; goal: string }) {
    if (!coach?.id) return;
    const { data } = await supabase.from("athletes").insert({ name, sport, goal, notes: "", coach_id: coach.id }).select().single();
    if (data) { setAthletes(prev => [...prev, data]); setSessions(prev => ({ ...prev, [data.id]: [] })); setSelectedAthleteId(data.id); setSelectedSessionId(null); }
  }

  async function handleReorder(newOrder: Athlete[]) {
    setAthletes(prev => {
      const archived = prev.filter(a => a.archived_at);
      return [...newOrder, ...archived];
    });
    await Promise.all(newOrder.map(a => supabase.from("athletes").update({ sort_order: a.sort_order }).eq("id", a.id)));
  }

  async function handleArchiveAthlete() {
    if (!editingAthlete) return;
    const newVal = editingAthlete.archived_at ? null : new Date().toISOString();
    setAthletes(prev => prev.map(a => a.id === editingAthlete.id ? { ...a, archived_at: newVal } : a));
    await supabase.from("athletes").update({ archived_at: newVal }).eq("id", editingAthlete.id);
    if (!newVal && selectedAthleteId === editingAthlete.id) { setSelectedAthleteId(null); setSelectedSessionId(null); }
    setEditingAthlete(null);
  }

  async function handleDeleteAthlete() {
    if (!editingAthlete) return;
    await supabase.from("athletes").delete().eq("id", editingAthlete.id);
    setAthletes(prev => prev.filter(a => a.id !== editingAthlete.id));
    setSessions(prev => { const next = { ...prev }; delete next[editingAthlete.id]; return next; });
    if (selectedAthleteId === editingAthlete.id) { setSelectedAthleteId(null); setSelectedSessionId(null); }
    setEditingAthlete(null);
  }

  async function handleUpdateAnalysisById(sessionId: string, analysis: Analysis) {
    await supabase.from("session_analyses").upsert({ session_id: sessionId, ...analysis, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
    setSessions(prev => {
      const next = { ...prev };
      for (const aid in next) {
        next[aid] = next[aid].map(s => s.id === sessionId ? { ...s, analysis } : s);
      }
      return next;
    });
  }

  async function handleDeleteSession() {
    if (!editingSession || !selectedAthleteId) return;
    await supabase.from("sessions").delete().eq("id", editingSession.id);
    setSessions(prev => ({ ...prev, [selectedAthleteId]: prev[selectedAthleteId].filter(s => s.id !== editingSession.id) }));
    if (selectedSessionId === editingSession.id) setSelectedSessionId(null);
    setEditingSession(null);
  }

  async function handleEditAthlete(updates: Partial<Athlete>) {
    if (!editingAthlete) return;
    setAthletes(prev => prev.map(a => a.id === editingAthlete.id ? { ...a, ...updates } : a));
    await supabase.from("athletes").update(updates).eq("id", editingAthlete.id);
  }

  async function handleEditSession(updates: { title: string; session_date: string }) {
    if (!editingSession || !selectedAthleteId) return;
    setSessions(prev => ({ ...prev, [selectedAthleteId]: prev[selectedAthleteId].map(s => s.id === editingSession.id ? { ...s, ...updates } : s) }));
    await supabase.from("sessions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", editingSession.id);
  }

  async function handleAddSession({ title, date }: { title: string; date: string }) {
    if (!selectedAthleteId || !coach?.id) return;
    const { data } = await supabase.from("sessions").insert({ athlete_id: selectedAthleteId, title, session_date: date, raw_note: "", ai_status: "none", coach_id: coach.id }).select().single();
    if (data) { const newSession = { ...data, analysis: null }; setSessions(prev => ({ ...prev, [selectedAthleteId]: [newSession, ...(prev[selectedAthleteId] || [])] })); setSelectedSessionId(data.id); }
  }

  // スマホ用の画面管理
  const [mobileView, setMobileView] = useState<"athletes" | "sessions" | "detail">("athletes");
  // 右カラムの表示切り替え（dashboard or session）
  const [rightView, setRightView] = useState<"dashboard" | "session">("dashboard");

  function handleSelectAthleteMobile(id: string) {
    handleSelectAthlete(id);
    setRightView("dashboard");
    setMobileView("detail"); // スマホでは選手選択→即ダッシュボード
  }

  function handleSelectSessionMobile(id: string) {
    setSelectedSessionId(id);
    setRightView("session");
    setMobileView("detail");
  }

  function handleBackToSessions() {
    setMobileView("sessions");
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: COLORS.bg, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 28 }}>🏅</div>
      <div style={{ fontSize: 13, color: COLORS.muted }}>データを読み込んでいます...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", color: COLORS.text }}>
      {/* Header */}
      <div style={{ height: 48, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0 }}>
        {/* スマホ用戻るボタン */}
        <div className="mobile-back">
          {mobileView === "sessions" && (
            <button onClick={() => setMobileView("athletes")} style={{ background: "transparent", border: "none", color: COLORS.accent, fontSize: 22, cursor: "pointer", padding: "0 8px 0 0", display: "flex", alignItems: "center" }}>‹</button>
          )}
          {mobileView === "detail" && rightView === "dashboard" && (
            <button onClick={() => setMobileView("athletes")} style={{ background: "transparent", border: "none", color: COLORS.accent, fontSize: 22, cursor: "pointer", padding: "0 8px 0 0", display: "flex", alignItems: "center" }}>‹</button>
          )}
          {mobileView === "detail" && rightView === "session" && (
            <button onClick={() => { setRightView("dashboard"); }} style={{ background: "transparent", border: "none", color: COLORS.accent, fontSize: 22, cursor: "pointer", padding: "0 8px 0 0", display: "flex", alignItems: "center" }}>‹</button>
          )}
        </div>
        <div style={{ fontSize: 18 }}>🏅</div>
        <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.05em" }}>
          {mobileView === "detail" && selectedAthlete ? selectedAthlete.name : "COACHING LOG"}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <a href="/report" title="レポート作成" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 15, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>📄</a>
          <button onClick={() => setShowCoachSettings(true)} title="設定" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</button>
        </div>
      </div>

      {/* PC: 3カラム / スマホ: 1画面 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}
        className={`view-${mobileView}`}
        onTouchStart={e => {
          const touch = e.touches[0];
          (e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
        }}
        onTouchEnd={e => {
          const startX = Number((e.currentTarget as HTMLElement).dataset.touchX || 0);
          const endX = e.changedTouches[0].clientX;
          const diff = endX - startX;
          if (diff > 60) {
            if (mobileView === "detail") setMobileView("sessions");
            else if (mobileView === "sessions") setMobileView("athletes");
          }
        }}
      >
        {/* 左カラム */}
        <div className="col-athletes" style={{ display: "flex" }}>
          <Sidebar athletes={athletes} selectedId={selectedAthleteId}
            onSelect={(id) => { handleSelectAthleteMobile(id); setRightView("dashboard"); }}
            onAdd={() => setShowAddAthlete(true)} onEdit={setEditingAthlete}
            onDetail={(a) => { setSelectedAthleteId(a.id); setRightView("dashboard"); setMobileView("sessions"); }}
            onReorder={handleReorder} onArchive={handleArchiveAthlete} />
        </div>
        {/* 中カラム */}
        <div className="col-sessions" style={{ display: "flex", flex: "none" }}>
          <SessionList athlete={selectedAthlete} sessions={athleteSessions} selectedId={rightView === "session" ? selectedSessionId : null}
            onSelect={(id) => { handleSelectSessionMobile(id); }}
            onAdd={() => setShowAddSession(true)}
            onDetail={(a) => { setSelectedAthleteId(a.id); setRightView("dashboard"); }} />
        </div>
        {/* 右カラム */}
        <div className="col-detail" style={{ display: "flex", flex: 1, minWidth: 0 }}>
          {rightView === "dashboard" && selectedAthlete ? (
            <div style={{ flex: 1, overflowY: "auto", background: COLORS.bg }}>
              <AthleteDetailPanel athlete={selectedAthlete} coachId={coach?.id || ""} onShowSession={() => setRightView("session")} onUpdateAnalysis={handleUpdateAnalysisById} />
            </div>
          ) : (
            <SessionDetail session={selectedSession} athlete={selectedAthlete}
              onUpdateNote={handleUpdateNote} onUpdateAnalysis={handleUpdateAnalysis}
              onAnalyze={handleAnalyze} analyzing={analyzing} onEditSession={setEditingSession}
              onShowDashboard={() => setRightView("dashboard")} />
          )}
        </div>
      </div>

      {showAddAthlete && <AddAthleteModal onClose={() => setShowAddAthlete(false)} onAdd={handleAddAthlete} />}
      {showAddSession && selectedAthlete && <AddSessionModal athleteName={selectedAthlete.name} onClose={() => setShowAddSession(false)} onAdd={handleAddSession} />}
      {editingAthlete && <EditAthleteModal athlete={editingAthlete} onClose={() => setEditingAthlete(null)} onSave={handleEditAthlete} onDelete={handleDeleteAthlete} onArchive={handleArchiveAthlete} />}
      {editingSession && <EditSessionModal session={editingSession} onClose={() => setEditingSession(null)} onSave={handleEditSession} onDelete={handleDeleteSession} />}
      {showCoachSettings && <CoachSettingsModal onClose={() => setShowCoachSettings(false)} coach={coach} onSave={setCoach} />}

      <style>{`
        @media (max-width: 768px) {
          .col-athletes, .col-sessions, .col-detail {
            position: absolute !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            min-width: 100vw !important;
            max-width: 100vw !important;
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
            will-change: transform;
            background: inherit;
          }
          .col-athletes { transform: translateX(0); z-index: 1; }
          .col-sessions { transform: translateX(100vw); z-index: 2; }
          .col-detail   { transform: translateX(100vw); z-index: 3; }
          .view-sessions .col-athletes { transform: translateX(-25vw); }
          .view-sessions .col-sessions { transform: translateX(0); }
          .view-sessions .col-detail   { transform: translateX(100vw); }
          .view-detail .col-athletes   { transform: translateX(-25vw); }
          .view-detail .col-sessions   { transform: translateX(-25vw); }
          .view-detail .col-detail     { transform: translateX(0); }
          .mobile-back { display: flex !important; align-items: center; }
          .edit-btn { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-back { display: none !important; }
          .col-athletes, .col-sessions, .col-detail {
            position: relative !important;
            top: auto !important;
            width: auto !important;
            min-width: auto !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
