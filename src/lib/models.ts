export type GoogleModelId =
  | "models/gemini-2.5-flash-lite"
  | "models/gemini-2.5-flash"
  | "models/gemini-1.5-pro-002"
  | "models/gemini-1.5-flash-002";

export const MODEL_DEFAULT: GoogleModelId = "models/gemini-2.5-flash-lite";

export const MODEL_MAP: Record<string, GoogleModelId> = {
  default: MODEL_DEFAULT,
  fast: "models/gemini-2.5-flash-lite",
  vision: "models/gemini-2.5-flash",
  pro: "models/gemini-1.5-pro-002",
};

export function resolveModel(input?: string | null): GoogleModelId {
  if (!input) return MODEL_DEFAULT;
  if (MODEL_MAP[input]) return MODEL_MAP[input];
  // allow passing full id
  if (input.startsWith("models/")) return input as GoogleModelId;
  return MODEL_DEFAULT;
}

export function getBudgets(model: GoogleModelId) {
  // simple, conservative budgets; gemini window is large, but keep reserve
  switch (model) {
    case "models/gemini-2.5-flash-lite":
      return { maxInputTokens: 160000, reserveForResponse: 2048 };
    case "models/gemini-2.5-flash":
      return { maxInputTokens: 160000, reserveForResponse: 2048 };
    case "models/gemini-1.5-flash-002":
      return { maxInputTokens: 120000, reserveForResponse: 2048 };
    default:
      return { maxInputTokens: 240000, reserveForResponse: 4096 };
  }
}


