import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { session, athlete, analysis } = await req.json();

    const prompt = `あなたはスポーツメンタルコーチのアシスタントです。
以下のコーチング内部分析をもとに、アスリート本人に渡すセッションレポートを作成してください。

【重要な注意】
- 読み手はアスリート本人です
- 分析的・診断的な言葉は使わない
- 前向きで自己効力感が高まる言葉を使う
- ACT・NLPの専門用語は使わない
- 「〜という傾向がある」ではなく「〜に気づき始めている」のような表現にする
- チャレンジは1つだけ、具体的な行動で

【選手情報】
名前: ${athlete?.name}
競技: ${athlete?.sport}
目標: ${athlete?.goal}
${athlete?.profile ? `プロフィール: ${athlete.profile}` : ""}

【セッション情報】
日付: ${session?.session_date}
テーマ: ${analysis?.theme}

【内部分析（コーチ用・アスリートには見せない）】
感情・メンタル状態: ${analysis?.mental_state}
認知パターン: ${analysis?.cognition}
行動変容点: ${analysis?.behavior}
次回セッション課題: ${analysis?.next_session}
ACT視点: ${analysis?.act_insight}
NLP視点: ${analysis?.nlp_insight}

JSONのみ出力してください（前置き不要）：
{
  "theme": "今回のテーマ（アスリート向けの言葉で・15文字以内）",
  "insight": "今日の気づき（2〜3文。「あなたは〜」という語りかける形式で）",
  "strength": "あなたの強み（このセッションで見えた強みを2〜3文で）",
  "challenge": "次回までのチャレンジ（具体的な行動を1つ、1〜2文で）",
  "message": "コーチからひとこと（温かく背中を押す2文）"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(clean);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}