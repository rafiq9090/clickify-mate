export class ProviderApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ProviderApiError'
  }
}

export async function requestProviderJson<T>(
  url: string,
  init: RequestInit,
  provider: string
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(15_000)
    })
  } catch (error: any) {
    throw new ProviderApiError(`${provider} is temporarily unreachable: ${error?.message || 'network error'}`)
  }

  const responseText = await response.text()
  let payload: any = {}
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = { message: responseText.slice(0, 500) }
    }
  }

  if (!response.ok) {
    const providerMessage = payload?.statusMessage || payload?.message || payload?.error || `HTTP ${response.status}`
    throw new ProviderApiError(`${provider} rejected the request: ${providerMessage}`, response.status, payload?.statusCode)
  }

  return payload as T
}
