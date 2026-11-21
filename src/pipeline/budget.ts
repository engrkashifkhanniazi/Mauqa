// Prices in USD per million tokens. VERIFY against Anthropic pricing before enabling AI; override via env.
export const PRICES: Record<string, { in: number; out: number }> = {
  "claude-haiku-5-5": { in: Number(process.env.PRICE_HAIKU_IN ?? 1), out: Number(process.env.PRICE_HAIKU_OUT ?? 5) },
  "claude-sonnet-5-5": { in: Number(process.env.PRICE_SONNET_IN ?? 3), out: Number(process.env.PRICE_SONNET_OUT ?? 15) },
};
export const costUsd = (model: string, tin: number, tout: number) => { const p = PRICES[model]; return p ? (tin * p.in + tout * p.out) / 1e6 : Infinity; };
export function withinBudget(spentThisMonth: number, budget = Number(process.env.CLAUDE_MONTHLY_BUDGET_USD ?? 0), nextEstimate = 0) {
  return budget > 0 && spentThisMonth + nextEstimate < budget;
}
