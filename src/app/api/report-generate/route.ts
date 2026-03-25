import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { athlete, sessions } = await req.json();

    const sessionText = sessions.map((s: {
      session_date: string;
      summary: string;
      mental_state: string;
      next_session: string;
    }, i: number) => `セッション${i + 1}（${s.session_date}）
要約：${s.summary}
感情状態：${s.mental_state}
次回課題：${s.next_session}`).join("\n\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `あなたはスポーツメンタルコーチングの専門家です。
コーチが記録した複数セッションの分析データをもとに、アスリート本人に渡す統合レポートを作成してください。

ルール：
・文体は「あなたは〜」という二人称で統一する
・読み手は高校生〜社会人アスリート。過度に幼い表現や励ましすぎる表現は避ける
・専門用語（認知パターン・介入・ACTなど）は使わない
・複数セッションを通じた変化・成長・課題を統合して語る（セッションごとに分けない）
・事実に基づき、根拠のある前向きな表現にする
・出力は必ずJSON形式のみ。前置き・説明文は一切含めない`,
      messages: [{
        role: "user",
        content: `以下の${sessions.length}回分のセッションデータをもとに、統合レポートを作成してください。

選手名：${athlete.name}（${athlete.sport}）
目標：${athlete.goal}

${sessionText}

以下のJSON形式で出力してください：
{
  "report_title": "レポートのタイトル（簡潔に・15文字以内）",
  "intro_message": "この期間全体を俯瞰した導入文（3〜4文。成長の文脈を示す）",
  "progress_summary": "この期間を通じた変化・成長の概要（3〜5文。具体的に）",
  "current_strength": "現在発揮できている強み（2〜3文）",
  "next_focus": "今後取り組むべきこと（2〜3文。具体的な行動レベルで）",
  "closing_message": "締めのメッセージ（2〜3文。過度な激励にならず、落ち着いたトーンで）"
}`
      }],
    });

    const text = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let report;
    try {
      report = JSON.parse(clean);
    } catch {
      const retry = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "JSONのみを返してください。前置き・説明文は一切含めないでください。",
        messages: [{ role: "user", content: `以下をJSON形式に修正してください：${clean}` }],
      });
      const retryText = retry.content.map((c) => (c.type === "text" ? c.text : "")).join("");
      report = JSON.parse(retryText.replace(/```json|```/g, "").trim());
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report generate error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}