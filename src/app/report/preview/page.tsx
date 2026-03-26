"use client";

import { useEffect, useState } from "react";

export default function ReportPreviewPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reportHtml");
    if (stored) setHtml(stored);
  }, []);

  function handlePrint() {
    window.print();
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "コーチングレポート",
        text: "メンタルコーチングレポートをお送りします。",
      });
    } else {
      window.print();
    }
  }

  if (!html) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📄</div>
        <div>レポートデータがありません</div>
        <a href="/report" style={{ display: "block", marginTop: 16, color: "#4f8ef7" }}>← レポート作成に戻る</a>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}>
      {/* ツールバー */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "#1a1d23", borderBottom: "1px solid #2e3340",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52,
      }} className="no-print">
        <button onClick={() => window.history.back()}
          style={{ background: "transparent", border: "none", color: "#4f8ef7", fontSize: 24, cursor: "pointer", padding: "4px 8px 4px 0", display: "flex", alignItems: "center" }}>
          ‹
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#dde1ea" }}>レポートプレビュー</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handlePrint}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#272b35", color: "#dde1ea", fontSize: 12, cursor: "pointer" }}>
            🖨️ 印刷
          </button>
          <button onClick={handleShare}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#4f8ef7", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ↑ 共有
          </button>
        </div>
      </div>

      {/* レポート本文 */}
      <div style={{ paddingTop: 52 }} dangerouslySetInnerHTML={{ __html: html }} />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          div[style*="paddingTop"] { padding-top: 0 !important; }
        }
      `}</style>
    </div>
  );
}
