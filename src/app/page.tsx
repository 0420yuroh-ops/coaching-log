"use client";

import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0f1117",
  surface: "#161b27",
  card: "#1c2333",
  border: "#252d3d",
  accent: "#3b82f6",
  accentSoft: "#1d3660",
  text: "#e2e8f0",
  muted: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
};

type Analysis = {
  summary: string;
  theme: string;
  mental_state: string;
  cognition: string;
  behavior: string;
  next_session: string;
  intervention: string;
  act_insight: string;
  nlp_insight: string;
};

type Session = {
  id: string;
  athlete_id: string;
  session_date: string;
  title: string;
  raw_note: string;
  ai_status: "none" | "done";
  analysis: Analysis | null;
};

type Athlete = {
  id: string;
  name: string;
  sport: string;
  goal: string;
  notes: string;
  created_at: string;
  archived_at: string | null;
};

type SessionsMap = Record<string, Session[]>;

const SAMPLE_ATHLETES: Athlete[] = [
  { id: "1", name: "田中 颯太", sport: "バスケットボール", goal: "国体選抜入り", notes: "プレッシャー時に消極的になりやすい", created_at: "2025-01-10", archived_at: null },
  { id: "2", name: "鈴木 莉奈", sport: "水泳", goal: "インターハイ入賞", notes: "自己否定が強い傾向", created_at: "2025-01-15", archived_at: null },
];

const SAMPLE_SESSIONS: SessionsMap = {
  "1": [
    {
      id: "s1", athlete_id: "1", session_date: "2025-03-15", title: "試合前メンタル調整",
      raw_note: "今日は試合2週間前のセッション。最近練習でシュートが決まらないと悩んでいる。ルーティンの話をしたら少し明るくなった。",
      ai_status: "done",
      analysis: {
        summary: "試合前の不安と自信喪失が主テーマ。ルーティン構築の提案で前向きな変化あり。",
        theme: "自信回復・プレッシャー管理",
        mental_state: "不安レベル中〜高。ルーティンの話題では表情が緩みエネルギーが上昇した。",
        cognition: "「シュートが決まらない＝自分はダメだ」という結果と自己価値の直結パターン。",
        behavior: "ルーティンの話題で前のめりになり「やってみます」と自発的なコミットメント。",
        next_session: "1. ルーティン実践の振り返り\n2. チームメイトとの関係性を深掘り\n3. 試合当日のメンタルプランを作成",
        intervention: "ソクラテス式質問でシュート不調の意味付けを問い直し。NLPアンカリングでルーティン設計。",
        act_insight: "不安回避が優勢な状態。プロセスへのコミットメントへのレディネスが高まっている。",
        nlp_insight: "「どうせ」「また」という限定的言語パターンが頻出。サブモダリティのリフレーミングが有効。"
      }
    },
  ],
  "2": [
    {
      id: "s2", athlete_id: "2", session_date: "2025-03-18", title: "初回セッション",
      raw_note: "はじめてのセッション。結果が出ないと「自分はダメだ」と思ってしまうと話してくれた。完璧主義的な傾向がある。",
      ai_status: "done",
      analysis: {
        summary: "完璧主義と自己否定の強いパターン。親の期待が外的ストレス源として機能。",
        theme: "自己受容・完璧主義",
        mental_state: "緊張気味だが話し始めると饒舌になった。「水泳は好き」と言う際には表情が柔らかくなった。",
        cognition: "「結果＝自己価値」という強固な認知の歪み。完璧主義的な「〜すべき」思考が多数。",
        behavior: "初回にも関わらず自己開示が早く信頼関係の形成は良好。",
        next_session: "1. 結果とプロセスを分けて振り返る習慣の導入\n2. 「十分に良い」基準の言語化\n3. 親との関係性・期待の整理",
        intervention: "ラポール形成を最優先。完璧主義パターンの外在化。水泳の好きな部分への質問でリソース状態を引き出し。",
        act_insight: "純粋に泳ぐことへの喜びと結果追求が混同されている状態。脱フュージョンのアプローチが有効。",
        nlp_insight: "「ダメだ」「どうせ」の言語パターンが顕著。ディソシエイトしての観察を導入する余地あり。"
      }
    },
  ],
};

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

function EditableField({ value, onChange, singleLine = false, color }: {
  value: string; onChange: (v: string) => void; singleLine?: boolean; color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function commit() { setEditing(false); if (draft !== value) onChange(draft); }

  const baseStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${color || COLORS.accent}`,
    color: COLORS.text, fontSize: 13, lineHeight: 1.75, outline: "none",
    padding: "2px 0", fontFamily: "inherit", boxSizing: "border-box",
  };

  if (editing) {
    return singleLine ? (
      <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        style={baseStyle} />
    ) : (
      <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        style={{ ...baseStyle, resize: "none", minHeight: 60 }}
        rows={Math.max(2, (draft || "").split("\n").length)} />
    );
  }

  return (
    <div onClick={() => setEditing(true)} title="クリックして編集"
      style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: "text", minHeight: 22, borderRadius: 4, padding: "2px 4px", margin: "0 -4px" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {value || <span style={{ color: COLORS.muted, fontStyle: "italic" }}>クリックして入力...</span>}
    </div>
  );
}

function AnalysisResult({ analysis, onUpdate }: { analysis: Analysis; onUpdate: (a: Analysis) => void }) {
  const [openDeep, setOpenDeep] = useState(false);
  const display = [
    { key: "summary",      label: "セッション要約",     icon: "📋", color: "#3b82f6", single: false },
    { key: "theme",        label: "今回のテーマ",       icon: "🎯", color: "#8b5cf6", single: true  },
    { key: "mental_state", label: "感情・メンタル状態", icon: "💭", color: "#ec4899", single: false },
    { key: "cognition",    label: "認知パターン",       icon: "🧠", color: "#f59e0b", single: false },
    { key: "behavior",     label: "行動変容点",         icon: "🔄", color: "#10b981", single: false },
    { key: "next_session", label: "次回セッション課題", icon: "📅", color: "#06b6d4", single: false },
    { key: "intervention", label: "コーチの介入内容",   icon: "🛠️", color: "#64748b", single: false },
  ] as const;
  const deep = [
    { key: "act_insight", label: "ACT視点（心理的柔軟性）",       icon: "🌿" },
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
        <button onClick={() => setOpenDeep(p => !p)}
          style={{ width: "100%", padding: "12px 16px", background: COLORS.surface, border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

function Sidebar({ athletes, selectedId, onSelect, onAdd }: {
  athletes: Athlete[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void;
}) {
  return (
    <div style={{ width: 220, minWidth: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>Athletes</div>
        <button onClick={onAdd} style={{ width: "100%", padding: "8px 12px", background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>+</span> 選手を追加
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {athletes.filter(a => !a.archived_at).map(a => (
          <div key={a.id} onClick={() => onSelect(a.id)}
            style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: selectedId === a.id ? COLORS.accentSoft : "transparent", border: `1px solid ${selectedId === a.id ? COLORS.accent : "transparent"}`, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{a.name[0]}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{a.sport}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionList({ athlete, sessions, selectedId, onSelect, onAdd }: {
  athlete: Athlete | undefined; sessions: Session[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void;
}) {
  if (!athlete) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.surface, borderRight: `1px solid ${COLORS.border}` }}>
      <div style={{ textAlign: "center", color: COLORS.muted }}><div style={{ fontSize: 32, marginBottom: 8 }}>👈</div><div style={{ fontSize: 13 }}>選手を選択してください</div></div>
    </div>
  );
  return (
    <div style={{ width: 260, minWidth: 260, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{athlete.name}</div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>{athlete.sport} · {athlete.goal}</div>
        <button onClick={onAdd} style={{ width: "100%", padding: "8px 12px", background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>+</span> セッションを追加
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {sessions.length === 0 && <div style={{ textAlign: "center", padding: "32px 16px", color: COLORS.muted, fontSize: 13 }}>セッションがありません</div>}
        {sessions.map(s => (
          <div key={s.id} onClick={() => onSelect(s.id)}
            style={{ padding: "12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: selectedId === s.id ? COLORS.card : "transparent", border: `1px solid ${selectedId === s.id ? COLORS.border : "transparent"}`, transition: "all 0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{s.session_date}</div>
              {s.ai_status === "done" ? (
                <div style={{ fontSize: 10, background: "#0f2a1a", color: COLORS.success, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>AI済</div>
              ) : (
                <div style={{ fontSize: 10, background: COLORS.border, color: COLORS.muted, padding: "2px 6px", borderRadius: 4 }}>未整理</div>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.raw_note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionDetail({ session, athlete, onUpdateNote, onUpdateAnalysis, onAnalyze, analyzing }: {
  session: Session | undefined; athlete: Athlete | undefined; onUpdateNote: (note: string) => void;
  onUpdateAnalysis: (a: Analysis) => void; onAnalyze: (note: string) => void; analyzing: boolean;
}) {
  const [note, setNote] = useState(session?.raw_note || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [activeTab, setActiveTab] = useState<"note" | "result">(session?.ai_status === "done" ? "result" : "note");

  useEffect(() => {
    setNote(session?.raw_note || "");
    setActiveTab(session?.ai_status === "done" ? "result" : "note");
    setSaveStatus("saved");
  }, [session?.id]);

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
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{session.title}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{athlete?.name} · {session.session_date}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, color: saveStatus === "saving" ? COLORS.warning : COLORS.success }}>
              {saveStatus === "saving" ? "保存中..." : "✓ 保存済"}
            </div>
            {session.ai_status !== "done" ? (
              <button onClick={() => { onAnalyze(note); setActiveTab("result"); }} disabled={analyzing || !note.trim()}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: analyzing ? "wait" : "pointer", background: analyzing ? COLORS.border : COLORS.accent, color: analyzing ? COLORS.muted : "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                {analyzing ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> 整理中...</> : <><span>✨</span> AI整理</>}
              </button>
            ) : (
              <button onClick={() => { onAnalyze(note); setActiveTab("result"); }} disabled={analyzing}
                style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, cursor: "pointer", background: "transparent", color: COLORS.muted }}>
                再整理
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {(["note", "result"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: activeTab === tab ? COLORS.accent : "transparent", color: activeTab === tab ? "#fff" : COLORS.muted, transition: "all 0.15s" }}>
              {tab === "note" ? "📝 生メモ" : "✨ 整理結果"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activeTab === "note" && (
          <textarea value={note} onChange={e => { setNote(e.target.value); setSaveStatus("saving"); }}
            placeholder={"セッション中のメモをそのまま入力してください\n\n例）\n今日は試合3日前。昨夜よく眠れなかったと。シュートの調子は戻ってきている。\nでも本番になると緊張してしまうと言っていた。\nルーティンの話をしたら「やってみる」と前向きな反応。..."}
            style={{ width: "100%", height: "calc(100vh - 280px)", minHeight: 320, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.text, fontSize: 14, lineHeight: 1.8, padding: "16px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        )}
        {activeTab === "result" && (
          session.ai_status === "done" && session.analysis ? (
            <AnalysisResult analysis={session.analysis} onUpdate={onUpdateAnalysis} />
          ) : analyzing ? (
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

function AddAthleteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Omit<Athlete, "id" | "created_at" | "archived_at">) => void }) {
  const [name, setName] = useState(""); const [sport, setSport] = useState(""); const [goal, setGoal] = useState("");
  const fields = [{ label: "名前 *", value: name, set: setName, ph: "田中 颯太" }, { label: "競技", value: sport, set: setSport, ph: "バスケットボール" }, { label: "目標", value: goal, set: setGoal, ph: "インターハイ出場" }];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 400 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>選手を追加</div>
        {fields.map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.muted, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => { if (name.trim()) { onAdd({ name, sport, goal, notes: "" }); onClose(); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>追加</button>
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
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, padding: "10px 12px", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
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

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>(SAMPLE_ATHLETES);
  const [sessions, setSessions] = useState<SessionsMap>(SAMPLE_SESSIONS);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>("1");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>("s1");
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  const athleteSessions = selectedAthleteId ? (sessions[selectedAthleteId] || []) : [];
  const selectedSession = athleteSessions.find(s => s.id === selectedSessionId);

  function handleSelectAthlete(id: string) {
    setSelectedAthleteId(id);
    const ss = sessions[id] || [];
    setSelectedSessionId(ss.length > 0 ? ss[0].id : null);
  }

  function handleUpdateNote(note: string) {
    setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, raw_note: note } : s) }));
  }

  function handleUpdateAnalysis(analysis: Analysis) {
    setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, analysis } : s) }));
  }

  async function handleAnalyze(note: string) {
    if (!note.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, athlete: selectedAthlete }),
      });
      const data = await res.json();
      if (data.analysis) {
        setSessions(prev => ({ ...prev, [selectedAthleteId!]: prev[selectedAthleteId!].map(s => s.id === selectedSessionId ? { ...s, ai_status: "done", analysis: data.analysis } : s) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleAddAthlete(data: Omit<Athlete, "id" | "created_at" | "archived_at">) {
    const newAthlete: Athlete = { id: Date.now().toString(), ...data, created_at: new Date().toISOString().split("T")[0], archived_at: null };
    setAthletes(prev => [...prev, newAthlete]);
    setSessions(prev => ({ ...prev, [newAthlete.id]: [] }));
    setSelectedAthleteId(newAthlete.id);
    setSelectedSessionId(null);
  }

  function handleAddSession({ title, date }: { title: string; date: string }) {
    const newSession: Session = { id: Date.now().toString(), athlete_id: selectedAthleteId!, session_date: date, title, raw_note: "", ai_status: "none", analysis: null };
    setSessions(prev => ({ ...prev, [selectedAthleteId!]: [newSession, ...(prev[selectedAthleteId!] || [])] }));
    setSelectedSessionId(newSession.id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", color: COLORS.text }}>
      <div style={{ height: 48, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 18 }}>🏅</div>
        <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.05em" }}>COACHING LOG</div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginLeft: 4, paddingLeft: 12, borderLeft: `1px solid ${COLORS.border}` }}>スポーツメンタルコーチング · セッションログ管理</div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.muted }}>MVP v0.1</div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar athletes={athletes} selectedId={selectedAthleteId} onSelect={handleSelectAthlete} onAdd={() => setShowAddAthlete(true)} />
        <SessionList athlete={selectedAthlete} sessions={athleteSessions} selectedId={selectedSessionId} onSelect={setSelectedSessionId} onAdd={() => setShowAddSession(true)} />
        <SessionDetail session={selectedSession} athlete={selectedAthlete} onUpdateNote={handleUpdateNote} onUpdateAnalysis={handleUpdateAnalysis} onAnalyze={handleAnalyze} analyzing={analyzing} />
      </div>
      {showAddAthlete && <AddAthleteModal onClose={() => setShowAddAthlete(false)} onAdd={handleAddAthlete} />}
      {showAddSession && selectedAthlete && <AddSessionModal athleteName={selectedAthlete.name} onClose={() => setShowAddSession(false)} onAdd={handleAddSession} />}
    </div>
  );
}
