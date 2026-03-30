import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; //

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { session, athlete, analysis } = await req.json();

    const prompt = `あなたはスポーツメンタルコーチングの専門家です。
以下のセッション情報と分析結果をもとに、選手の内面構造を共起ネットワークとして抽出してください。

【選手情報】
名前: ${athlete?.name}
競技: ${athlete?.sport}
目標: ${athlete?.goal}
${athlete?.profile ? `プロフィール: ${athlete.profile}` : ""}

【セッション生メモ】
${session?.raw_note || ""}

【AI分析結果】
要約: ${analysis?.summary || ""}
テーマ: ${analysis?.theme || ""}
感情・メンタル状態: ${analysis?.mental_state || ""}
認知パターン: ${analysis?.cognition || ""}
行動変容点: ${analysis?.behavior || ""}
ACT視点: ${analysis?.act_insight || ""}
NLP視点: ${analysis?.nlp_insight || ""}

## 抽出ルール

### ノード（思考・感情・行動の要素）
- 信念層（belief）：固定した自己認識・繰り返される思い込み。例「自分はミスしたら終わり」
- 半意識層（semi_conscious）：自動起動する思考・感情・身体感覚。例「不安・緊張」「様子を見る」
- 行動層（action）：実際に観察された行動・選択。例「消極的選択」「思い切りプレー」
- ノード数は3〜8個程度
- labelは選手・コーチの言葉に近い自然な表現（10文字以内）

### エッジ（要素間の関係）
- forward（順方向・緑）：AがBを自然に引き起こす関係
- paradox（逆説・赤）：矛盾しているのに共起する関係（同一発話内で確認できる場合のみ）
- suppress（抑圧・黄点線）：AがBを妨げる・抑制する関係

### パフォーマンスモデル候補
セッション中の「〜したい」「〜になりたい」「本当は〜」「〜だったらいい」などの文言から
理想状態のノードを抽出してください。

JSONのみ出力（前置き不要）：
{
  "nodes": [
    {
      "id": "n1",
      "label": "ミスしたら終わり",
      "layer": "belief",
      "freq": 8,
      "source_quote": "ミスしたら終わりって思ってて"
    }
  ],
  "edges": [
    {
      "from": "n1",
      "to": "n2",
      "type": "suppress",
      "strength": "strong",
      "evidence": "ミスへの恐怖が慎重な行動を引き起こしている"
    }
  ],
  "pm_candidates": [
    {
      "id": "pm1",
      "label": "思い切りプレー",
      "layer": "action",
      "source_quote": "本当は思い切りプレーしたい",
      "evidence": "理想の行動として言及"
    }
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const network = JSON.parse(clean);

    return NextResponse.json({ network });
  } catch (error) {
    console.error("Network error:", error);
    return NextResponse.json({ error: "Network generation failed" }, { status: 500 });
  }
}