import crypto from "crypto"

function getSecret(): string {
  const _secret = process.env.QR_HMAC_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!_secret) {
    throw new Error(
      "QR_HMAC_SECRET ou NEXTAUTH_SECRET deve estar definido. " +
      "Defina uma das variáveis de ambiente."
    )
  }
  return _secret
}

/**
 * Gera um token HMAC assinado para o QR Code do cidadão.
 * Formato: userId:timestamp:hmac (16 chars do sha256)
 * Válido por 5 minutos.
 */
export function gerarTokenQR(userId: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${userId}:${ts}`
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 32)
  return `${payload}:${hmac}`
}

/**
 * Valida o token e retorna o userId se válido.
 * Retorna null se expirado (>5min) ou assinatura inválida.
 */
export function validarTokenQR(token: string): { userId: string } | null {
  const parts = token.split(":")
  if (parts.length !== 3) return null

  const [userId, tsStr, hmacRecebido] = parts
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts)) return null

  const agora = Math.floor(Date.now() / 1000)
  if (agora - ts > 300) return null // expirado após 5 minutos

  const payload = `${userId}:${tsStr}`
  const hmacEsperado = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 32)

  // Comparação segura contra timing attacks
  if (
    hmacRecebido.length !== hmacEsperado.length ||
    !crypto.timingSafeEqual(
      Buffer.from(hmacRecebido, "hex"),
      Buffer.from(hmacEsperado, "hex"),
    )
  ) {
    return null
  }

  return { userId }
}
