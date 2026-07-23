export const USER_BALANCE_TYPE_LABELS: Record<number, string> = {
  0: 'Credit',
  1: 'Withdrawal',
}

export function getUserBalanceTypeLabelKey(type: number): string {
  return type === 0 ? 'history.credit' : type === 1 ? 'history.debit' : 'common.unknown'
}
