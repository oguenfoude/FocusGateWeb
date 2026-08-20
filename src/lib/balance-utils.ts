export function getUserBalanceTypeLabelKey(type: number): string {
  return type === 0 ? 'history.credit' : type === 1 ? 'history.debit' : 'common.unknown'
}
