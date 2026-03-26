export default function PrivacyPage() {
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

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>プライバシーポリシー</h1>
        <p style={{ fontSize: 13, color: "#7a8499", marginBottom: 40 }}>最終更新日：2026年3月26日</p>

        {[
          {
            title: "1. 収集する情報",
            content: "本サービスでは以下の情報を収集します。\n\n【アカウント情報】\n・メールアドレス\n・パスワード（暗号化して保存）\n\n【利用データ】\n・コーチが入力した選手情報（氏名・競技・目標・プロフィール）\n・セッション記録・生メモ\n・AIによる分析結果\n・縦断分析データ"
          },
          {
            title: "2. 情報の利用目的",
            content: "収集した情報は以下の目的で利用します。\n・本サービスの提供・運営\n・ユーザー認証・アカウント管理\n・AI分析機能の提供\n・サービスの改善・新機能開発\n・お問い合わせへの対応"
          },
          {
            title: "3. 第三者への提供",
            content: "当社は以下の場合を除き、ユーザーの個人情報を第三者に提供しません。\n・ユーザーの同意がある場合\n・法令に基づく場合\n・人の生命・身体・財産の保護に必要な場合"
          },
          {
            title: "4. 利用する外部サービス",
            content: "本サービスでは以下の外部サービスを利用しています。\n\n【Supabase】\nデータベース・認証の提供（米国）\nhttps://supabase.com/privacy\n\n【Anthropic Claude API】\nAI分析機能の提供（米国）\nhttps://www.anthropic.com/privacy\n\n【Vercel】\nホスティングサービス（米国）\nhttps://vercel.com/legal/privacy-policy\n\n各サービスのプライバシーポリシーに基づきデータが処理されます。"
          },
          {
            title: "5. データの保存・セキュリティ",
            content: "ユーザーデータはSupabaseのサーバー（米国）に保存されます。Row Level Security（RLS）により、各コーチは自身のデータにのみアクセスできます。通信はSSL/TLSにより暗号化されています。"
          },
          {
            title: "6. データの削除",
            content: "アカウントの削除をご希望の場合は、下記お問い合わせ先までご連絡ください。ご要望に応じてデータを削除します。"
          },
          {
            title: "7. Cookieの使用",
            content: "本サービスでは認証状態の維持のためにCookieを使用しています。ブラウザの設定によりCookieを無効にすることができますが、その場合本サービスが正常に動作しない場合があります。"
          },
          {
            title: "8. プライバシーポリシーの変更",
            content: "当社は必要に応じてプライバシーポリシーを変更することがあります。重要な変更がある場合は本サービス上でお知らせします。"
          },
          {
            title: "お問い合わせ",
            content: "個人情報の取り扱いに関するお問い合わせは以下までご連絡ください。\n株式会社ボットウス\nEmail: info@bottwus.co.jp"
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