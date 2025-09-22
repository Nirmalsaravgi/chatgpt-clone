export type CoreMessage = { role: "system" | "user" | "assistant"; content: string };

// Heuristic token estimator (chars/4). Replace with tokenizer later.
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimToBudget(
  messages: CoreMessage[],
  opts: { maxInputTokens: number; reserveForResponse: number; systemPrompt?: string }
) {
  const { maxInputTokens, reserveForResponse, systemPrompt } = opts;
  const system: CoreMessage | null = systemPrompt ? { role: "system", content: systemPrompt } : null;

  const base: CoreMessage[] = system ? [system, ...messages] : [...messages];

  const budget = Math.max(0, maxInputTokens - reserveForResponse);

  // keep newest-first; drop oldest until within budget
  const reversed = [...base].reverse();
  const kept: CoreMessage[] = [];
  let total = 0;
  for (const msg of reversed) {
    const cost = estimateTokens(msg.content) + 8; // small overhead per message
    if (total + cost > budget) break;
    kept.push(msg);
    total += cost;
  }

  const finalMessages = kept.reverse();
  return { messages: finalMessages };
}


