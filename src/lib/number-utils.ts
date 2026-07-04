/**
 * Safely convert any value (including MongoDB Decimal128) to a JavaScript number.
 * Handles: number, string, Decimal128, null, undefined.
 */
export function toNum(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') return parseFloat(v) || 0
  // Decimal128 and other BSON objects — use .toString() then parse
  if (typeof v === 'object' && typeof (v as { toString(): string }).toString === 'function') {
    const s = (v as { toString(): string }).toString()
    return parseFloat(s) || 0
  }
  return 0
}

/**
 * Safely convert to number, returning null instead of 0 when the input is null/undefined.
 */
export function toNumOrNull(v: unknown): number | null {
  if (v == null) return null
  return toNum(v)
}
