import crypto from "crypto"

const QR_VERSION = 1
const CITIZEN_TTL_SECONDS = 5 * 60
const POINT_TTL_SECONDS = Number(process.env.QR_POINT_TOKEN_TTL_SECONDS ?? 30 * 24 * 60 * 60)

function getSecret(): string {
  const secret = process.env.QR_HMAC_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("QR_HMAC_SECRET deve estar configurado com pelo menos 32 caracteres")
  }
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

function signaturesMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  )
}

function encode<T extends object>(payload: T): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${body}.${sign(body)}`
}

function decode<T>(token: string): T | null {
  const [body, signature, extra] = token.split(".")
  if (!body || !signature || extra || !signaturesMatch(signature, sign(body))) return null
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

export function assertQrSecretConfigured(): void {
  getSecret()
}

type CitizenQrPayload = {
  kind: "citizen"
  userId: string
  issuedAt: number
  nonce: string
  version: number
}

export function gerarTokenQR(userId: string): string {
  return encode<CitizenQrPayload>({
    kind: "citizen",
    userId,
    issuedAt: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID(),
    version: QR_VERSION,
  })
}

export function validarTokenQR(token: string): { userId: string; nonce: string } | null {
  const payload = decode<CitizenQrPayload>(token)
  if (
    !payload ||
    payload.kind !== "citizen" ||
    payload.version !== QR_VERSION ||
    !payload.userId ||
    !payload.nonce ||
    Math.floor(Date.now() / 1000) - payload.issuedAt > CITIZEN_TTL_SECONDS
  ) {
    return null
  }
  return { userId: payload.userId, nonce: payload.nonce }
}

export type PointQrPayload = {
  kind: "point"
  pointId: string
  issuedAt: number
  nonce: string
  version: number
}

export function gerarTokenPonto(pointId: string): string {
  return encode<PointQrPayload>({
    kind: "point",
    pointId,
    issuedAt: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID(),
    version: QR_VERSION,
  })
}

export function validarTokenPonto(token: string): PointQrPayload | null {
  const payload = decode<PointQrPayload>(token)
  const age = payload ? Math.floor(Date.now() / 1000) - payload.issuedAt : Infinity
  if (
    !payload ||
    payload.kind !== "point" ||
    payload.version !== QR_VERSION ||
    !payload.pointId ||
    !payload.nonce ||
    age < 0 ||
    age > POINT_TTL_SECONDS
  ) {
    return null
  }
  return payload
}
