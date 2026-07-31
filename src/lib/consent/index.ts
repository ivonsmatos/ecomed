export const CONSENT_STORAGE_KEY = "ecomed_cookie_consent"
export const CONSENT_VERSION = "2026-07"
export const CONSENT_EVENT = "ecomed:consent-changed"

export type ConsentState = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
  version: string
}

export function createConsent(analytics: boolean): ConsentState {
  return {
    necessary: true,
    analytics,
    marketing: false,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
}

export function parseConsent(value: string | null): ConsentState | null {
  if (!value) return null

  // Migração conservadora do formato antigo: exige nova decisão.
  if (value === "accepted" || value === "rejected") return null

  try {
    const parsed = JSON.parse(value) as Partial<ConsentState>
    if (
      parsed.necessary !== true ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null
    }
    return parsed as ConsentState
  } catch {
    return null
  }
}

export function clearAnalyticsCookies(): void {
  for (const name of document.cookie.split(";").map((part) => part.split("=")[0]?.trim())) {
    if (name && (name === "_ga" || name.startsWith("_ga_") || name.startsWith("_gid"))) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.ecomed.eco.br; SameSite=Lax`
    }
  }
}
