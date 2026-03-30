import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { note, athlete } = await req.json();

    const prompt = `あなたはスポーツメンタルコーチング専門のAIアシスタントです。
ACT（アクセプタンス＆コミットメントセラピー）とNLPの視点を持ち、スポーツ選手のメンタルサポートに精通しています。

以下のコーチングセッションメモを分析し、コーチが次回以降のセッションで活用できる高品質なログを生成してください。

【選手情報】
名前: ${athlete?.name}
競技: ${athlete?.sport}
目標: ${athlete?.goal}
特記事項: ${athlete?.notes}
${athlete?.profile ? `\n【選手プロフィール】\n${athlete.profile}` : ""}

【コーチングセッションメモ（生メモ）】
${note}

JSONのみ出力してください（前置き・説明不要）：
{
  "summary": "セッション全体の本質を1〜2文で。何が起き、どう動いたか",
  "theme": "今回のセッションの核心テーマ（15文字以内）",
  "mental_state": "選手の感情・メンタル状態の詳細。何を感じていたか、エネルギーレベル、安定度",
  "cognition": "観察された認知パターン。自動思考・ビリーフ・思考の歪み・自己対話の傾向",
  "behavior": "行動面での変容・気づき・新しい試み。セッション中の反応の変化も含む",
  "next_session": "次回セッションで扱うべき課題・確認事項・深掘りポイント（番号付きリスト）",
  "intervention": "今回コーチが行った主な介入・アプローチの記録（手法名も含めて）",
  "act_insight": "ACT視点：心理的柔軟性の状態、価値観との乖離、受容・回避パターン、コミットメントの質",
  "nlp_insight": "NLP視点：ビリーフシステム、言語パターン、リソース状態、アンカー・サブモダリティの観察"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}