export const BALANCE_SOURCE_LABELS: Record<number, string> = {
  0: 'USSD Check',
  1: 'SMS Credit',
  2: 'Settlement',
  3: 'Manual',
  4: 'Withdrawal',
}

export const USER_BALANCE_TYPE_LABELS: Record<number, string> = {
  0: 'Credit',
  1: 'Withdrawal',
}

export function getBalanceSourceLabel(source: number): string {
  return BALANCE_SOURCE_LABELS[source] ?? 'Unknown'
}

export function getUserBalanceTypeLabel(type: number): string {
  return USER_BALANCE_TYPE_LABELS[type] ?? 'Unknown'
}

export function formatBalance(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${formatBalance(delta)}`
}
