export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    let errorMessage = res.statusText
    try {
      const errBody = await res.json()
      if (errBody?.error) errorMessage = errBody.error
    } catch {
    }
    const error = new Error(errorMessage)
    ;(error as Error & { status?: number }).status = res.status
    throw error
  }
  return res.json()
}
