const hits = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `${prefix}:${ip}`
}

export function checkRateLimit(
  request: Request,
  prefix: string,
  limit: number,
  windowMs: number
): boolean {
  const key = getRateLimitKey(request, prefix)
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= limit
}

const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key)
  }
}, 60_000)

if (typeof globalThis !== 'undefined') {
  ;(globalThis as Record<string, unknown>).__rateLimitCleanup = cleanupInterval
}
