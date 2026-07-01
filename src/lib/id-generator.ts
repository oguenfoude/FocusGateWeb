let counter = 0

export function nextId(): number {
  const now = Date.now()
  counter = (counter + 1) % 10000
  return now * 10000 + counter
}
