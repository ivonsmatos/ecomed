import { describe, expect, it } from "vitest"
import { CONSENT_VERSION, createConsent, parseConsent } from "@/lib/consent"

describe("consentimento", () => {
  it("versiona a decisão e mantém cookies necessários", () => {
    const consent = createConsent(false)
    expect(consent).toMatchObject({
      necessary: true,
      analytics: false,
      marketing: false,
      version: CONSENT_VERSION,
    })
  })

  it("pede nova decisão para formatos e versões antigas", () => {
    expect(parseConsent("accepted")).toBeNull()
    expect(parseConsent(JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      updatedAt: new Date().toISOString(),
      version: "antiga",
    }))).toBeNull()
  })
})
