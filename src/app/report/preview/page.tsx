"use client";

import { useEffect, useState } from "react";

export default function ReportPreviewPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reportHtml");
    if (stored) {
      const blob = new Blob([stored], { type: "text/html;charset=utf-8" });
      setUrl(URL.createObjectURL(blob));
    }
  }, []);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "コーチングレポート", text: "メンタルコーチングレポートをお送りします。" });
    } else {
      window.print();
    }
  }

  if (!url) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📄</div>
        <div>レポートデータがありません</div>
        <a href="/report" style={{ display: "block", marginTop: 16, color: "#4f8ef7" }}>← レポート作成に戻る</a>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ background: "#1a1d23", borderBottom: "1px solid #2e3340", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 52, flexShrink: 0 }}>
        <button onClick={() => window.location.href = "/report"}
          style={{ background: "transparent", border: "none", color: "#4f8ef7", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center" }}>
          ‹
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#dde1ea" }}>レポートプレビュー</div>
        <button onClick={handleShare}
          style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#4f8ef7", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ↑ 共有
        </button>
      </div>
      <iframe src={url} style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} title="レポートプレビュー" />
    </div>
  );
}
