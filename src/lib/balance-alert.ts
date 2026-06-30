export const BALANCE_WARN_THRESHOLD = 45_000 // DZD

export function isNearLimit(balance: number): boolean {
  return balance >= BALANCE_WARN_THRESHOLD
}
