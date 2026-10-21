import type { Locale } from "@/lib/i18n";

// サイト内部では分析しない——ここはユーザーがChatGPTへ貼り付けるテキストを1箇所で管理するだけ。
// 言語設定(ja/en)に応じてコピーされるPrompt自体も切り替える。
// 変更する場合はこのファイルを編集する（将来DB化する場合もこのexportの形を保てば差し替えやすい）。

export const ANALYSIS_PROMPT_JA = `あなたはFX・CFDチャートの値動きを、
後から検証可能な形で言語化するトレード分析者です。

これから、

① エントリーした時点のチャート

② その後、利確・損切り・決済前後まで進んだチャート

を送ります。


目的は、

「売買シグナルを出すこと」

ではありません。


このトレードで、

・エントリー時点ではどのような相場構造だったか

・価格はどの重要な場所にいたか

・なぜその場所で値動きが発生した可能性があるか

・Entry後にどのような構造変化が起きたか

・Entry時点のシナリオがどこで成立・失敗・無効化されたか

・この値動きを再利用可能なPatternとしてどう表現できるか

を、

後から見返して学習できる文章にすることです。


重要：

結果を知った状態から、

「最初から分かっていた」

ような分析をしないでください。


ENTRY時点で確認できた情報と、

AFTERで初めて確認できた情報を、

明確に分離してください。


画像から確認できないことを、

事実として断定しないでください。


推測する場合は、

「可能性」

「考えられる」

と明示してください。


以下の形式で回答してください。


【1. MARKET CONTEXT】
Entry時点の大きな相場環境。

【2. ENTRY LOCATION】
Entryした場所について。なぜその場所が重要だった可能性があるか。

【3. ENTRY時点で確認できたこと】
Entry Chartだけを見た時点で、実際に確認できた値動きを説明。後から分かった情報を混ぜない。

【4. ENTRY REASON】
このEntryに合理性があったとすれば、どの条件が根拠になっていたか。

【5. AFTER PRICE ACTION】
Entry後、価格がどのように動いたかを、State Sequenceとして順番に整理。

【6. WHY IT MOVED】
なぜその場所から、その値動きが発生した可能性があるか。画像から合理的に確認できる要素だけを使う。

【7. INVALIDATION】
Entry時点のシナリオが、どの条件で無効になるべきだったか。実際のAfter Chartで無効化された場合はどこだったか。

【8. RESULT】
SUCCESS / FAILURE / BREAKEVEN / INVALIDATED / NO TRADE のうち最も近いもの。

【9. PATTERN】
この値動きを、再利用可能なPatternとして短い名前で表現。既存Patternへ無理に当てはめず、画像から確認できる値動きを優先。

【10. LESSON】
次回似た相場を見た時に確認すべきことを、3〜5個の具体的なチェック項目として。

【11. DO NOT OVERLEARN】
この1Caseだけでは一般化できないことも説明。「このPatternなら必ず上がる/下がる」という結論は禁止。

【12. SHORT SUMMARY】
最後に、このCaseを3〜5行で非常に簡潔にまとめる。

文章は、後からFX Pattern Memoryへ保存して読み返す前提で、簡潔・客観的・構造的にしてください。`;

export const ANALYSIS_PROMPT_EN = `You are a trading analyst who verbalizes FX/CFD chart price action in a way that can be reviewed and verified later.

I will send you:

1) the chart at the moment of entry

2) the chart afterward, up through take-profit / stop-loss / exit

The goal is NOT to issue a buy/sell signal.

For this trade, write something that can be studied later, covering:

- What was the market structure at the time of entry?
- Where was price relative to key levels?
- Why might price have reacted at that location?
- What structural changes happened after entry?
- At what point did the entry-time scenario get confirmed, fail, or get invalidated?
- How can this price action be expressed as a reusable Pattern?

Important: do not write the analysis as if you "knew it all along" with the benefit of hindsight.
Clearly separate what was knowable at ENTRY time from what only became visible in the AFTER chart.
Do not assert as fact anything that cannot be confirmed from the images. When speculating, say "possibly" or "it's conceivable that".

Answer using this structure:

【1. MARKET CONTEXT】
The broader market environment at entry time.

【2. ENTRY LOCATION】
Where the entry happened, and why that location may have mattered.

【3. WHAT WAS VISIBLE AT ENTRY】
Only what could actually be confirmed from the Entry Chart alone. Don't mix in hindsight.

【4. ENTRY REASON】
If this entry had a rationale, what conditions supported it?

【5. AFTER PRICE ACTION】
How price moved after entry, organized as a state sequence.

【6. WHY IT MOVED】
Why price may have moved that way from that location, using only elements reasonably confirmable from the images.

【7. INVALIDATION】
Under what condition should the entry-time scenario have been considered invalid? Where did that actually happen in the After chart, if it did?

【8. RESULT】
The closest fit among: SUCCESS / FAILURE / BREAKEVEN / INVALIDATED / NO TRADE.

【9. PATTERN】
Express this price action as a short, reusable Pattern name. Prefer what's visible in the images over forcing it into an existing pattern.

【10. LESSON】
3-5 concrete checklist items to look for next time a similar setup appears.

【11. DO NOT OVERLEARN】
Explain what should NOT be generalized from this single case. Never conclude "this pattern always goes up/down".

【12. SHORT SUMMARY】
A very concise 3-5 line summary of this case.

Write it assuming it will be saved and re-read later in FX Pattern Memory: concise, objective, and structured.`;

export function getAnalysisPrompt(locale: Locale) {
  return locale === "en" ? ANALYSIS_PROMPT_EN : ANALYSIS_PROMPT_JA;
}
