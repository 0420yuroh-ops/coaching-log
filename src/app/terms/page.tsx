export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#1a1d23", color: "#dde1ea", fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ padding: "20px 0 16px", borderBottom: "1px solid #2e3340", marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 20, textDecoration: "none" }}>🏅</a>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.05em" }}>COACHING LOG</span>
          </div>
          <a href="/" style={{ fontSize: 12, color: "#7a8499", textDecoration: "none" }}>← 戻る</a>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>利用規約</h1>
        <p style={{ fontSize: 13, color: "#7a8499", marginBottom: 40 }}>最終更新日：2026年3月26日</p>

        {[
          {
            title: "第1条（適用）",
            content: "本規約は、株式会社ボットウス（以下「当社」）が提供するCoaching Log（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。"
          },
          {
            title: "第2条（クローズドベータについて）",
            content: "現在、本サービスはクローズドベータ版として提供されています。当社が承認したユーザーのみが利用できます。ベータ期間中は機能の追加・変更・削除が行われる場合があります。また、事前の通知なくサービスを停止する場合があります。"
          },
          {
            title: "第3条（禁止事項）",
            content: "ユーザーは以下の行為を行ってはなりません。\n・法令または公序良俗に違反する行為\n・本サービスの運営を妨害する行為\n・他のユーザーまたは第三者の権利を侵害する行為\n・アカウントを第三者に譲渡・貸与する行為\n・本サービスを商業目的で無断利用する行為"
          },
          {
            title: "第4条（データの取り扱い）",
            content: "ユーザーが本サービスに入力したデータはSupabase（米国）のサーバーに保存されます。当社はユーザーのデータを本サービスの提供・改善目的以外に使用しません。詳細はプライバシーポリシーをご確認ください。"
          },
          {
            title: "第5条（免責事項）",
            content: "当社は本サービスの完全性・正確性・有用性等について保証しません。本サービスの利用に関連してユーザーに生じた損害について、当社の故意または重大な過失による場合を除き、責任を負いません。"
          },
          {
            title: "第6条（サービスの変更・終了）",
            content: "当社は、ユーザーへの事前通知をもって本サービスの内容を変更し、または提供を終了することができます。サービス終了の際はデータのエクスポート手段を提供するよう努めます。"
          },
          {
            title: "第7条（規約の変更）",
            content: "当社は必要に応じて本規約を変更することができます。変更後の規約は本サービス上に掲示した時点から効力を生じます。"
          },
          {
            title: "第8条（準拠法・管轄）",
            content: "本規約の解釈は日本法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。"
          },
          {
            title: "お問い合わせ",
            content: "利用規約に関するお問い合わせは以下までご連絡ください。\n株式会社ボットウス\nEmail: info@bottwus.co.jp"
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#dde1ea", marginBottom: 12 }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: "#a0a8bb", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}