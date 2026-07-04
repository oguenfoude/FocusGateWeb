let counter = 0

export function nextId(): number {
  counter = (counter + 1) % 1000
  return Date.now() * 1000 + counter
}
