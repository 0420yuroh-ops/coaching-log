"use client";

import { useEffect, useState } from "react";

export default function ReportPreviewPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reportHtml");
    if (stored) setHtml(stored);
  }, []);

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
    <div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
