/** fetch 래퍼: AbortController 타임아웃 + 1회 재시도(백오프 300ms) */

type SafeFetchInit = RequestInit & {
  /** ms, 기본 4000 */
  timeoutMs?: number
  /** 타임아웃 후 재시도 횟수, 기본 1 */
  retries?: number
}

export async function safeFetch(
  url: string | URL,
  {
    timeoutMs = 4000,
    retries = 1,
    signal: external,
    ...init
  }: SafeFetchInit = {}
): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)

    if (external?.aborted) {
      clearTimeout(timer)
      throw external.reason ?? new DOMException('Aborted', 'AbortError')
    }
    const onAbort = () => ac.abort(external?.reason)
    external?.addEventListener('abort', onAbort, { once: true })

    try {
      return await fetch(url, { ...init, signal: ac.signal })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        if (external?.aborted) throw external.reason ?? err
        throw new Error('upstream-timeout')
      }
      throw err
    } finally {
      clearTimeout(timer)
      external?.removeEventListener('abort', onAbort)
    }
  }

  for (let i = 0; ; i++) {
    try {
      return await attempt()
    } catch (err) {
      if (i >= retries || (err as Error).message !== 'upstream-timeout') throw err
      await new Promise<void>((r) => setTimeout(r, 300 * (i + 1)))
    }
  }
}
