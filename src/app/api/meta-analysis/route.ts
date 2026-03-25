import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { athlete, sessions } = await req.json();

    const sessionText = sessions.map((s: {
      session_date: string; title: string;
      analysis: {
        summary: string; theme: string; mental_state: string; cognition: string;
        behavior: string; next_session: string; intervention: string;
        act_insight: string; nlp_insight: string;
      } | null;
    }, i: number) => `
【セッション${i + 1}】${s.session_date} - ${s.title}
要約: ${s.analysis?.summary || "未整理"}
テーマ: ${s.analysis?.theme || ""}
感情・メンタル状態: ${s.analysis?.mental_state || ""}
認知パターン: ${s.analysis?.cognition || ""}
行動変容点: ${s.analysis?.behavior || ""}
次回課題: ${s.analysis?.next_session || ""}
ACT視点: ${s.analysis?.act_insight || ""}
NLP視点: ${s.analysis?.nlp_insight || ""}
`).join("\n");

    const prompt = `あなたはスポーツメンタルコーチングの専門家です。
以下の選手の複数セッションデータを読み込み、コーチ視点でメタ的な縦断分析を行ってください。

【選手情報】
名前: ${athlete.name}
競技: ${athlete.sport}
目標: ${athlete.goal}
${athlete.profile ? `プロフィール: ${athlete.profile}` : ""}

【セッションデータ（時系列順）】
${sessionText}

コーチが次のアクションを決めるために役立つ洞察を生成してください。
JSONのみ出力（前置き不要）：
{
  "cognition_change": "認知パターンの変化（初期と現在の比較・どう変わったか・変わっていないか）",
  "emotion_trend": "感情・メンタル状態の推移（安定度・波のパターン・改善傾向や懸念点）",
  "recurring_themes": "繰り返されるテーマ・課題（何度も出てくるキーワードや状況・その意味）",
  "growth_points": "成長・変化のポイント（具体的にどこが変わったか・コーチングが効いた場面）",
  "next_phase": "次のフェーズへの示唆（今後のコーチングで重点を置くべきこと・アプローチの変更提案）"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const meta = JSON.parse(clean);

    return NextResponse.json({ meta });
  } catch (error) {
    console.error("Meta analysis error:", error);
    return NextResponse.json({ error: "Meta analysis failed" }, { status: 500 });
  }
}