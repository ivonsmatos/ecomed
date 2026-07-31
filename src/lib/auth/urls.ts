export function buildLoginUrl(callbackUrl: string): string {
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    throw new Error("callbackUrl deve ser um caminho interno")
  }

  return `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`
}
