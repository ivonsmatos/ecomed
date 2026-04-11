import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.AUTH_SECRET ?? "ecomed-shuffle-fallback"

/**
 * Fisher-Yates shuffle das alternativas de uma questão.
 * Retorna as alternativas embaralhadas e o mapa de índices:
 *   map[shuffledIdx] = originalIdx
 */
export function shuffleOptions(options: string[]): { shuffled: string[]; map: number[] } {
  const map = options.map((_, i) => i)
  for (let i = map.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[map[i], map[j]] = [map[j], map[i]]
  }
  return { shuffled: map.map((origIdx) => options[origIdx]), map }
}

/**
 * Assina os mapas de embaralhamento de todas as questões com HMAC-SHA256.
 * Retorna um token base64url.payload.sig que pode ser verificado no submit.
 */
export function signShuffleMaps(quizId: string, maps: number[][]): string {
  const payload = JSON.stringify({ quizId, maps })
  const b64 = Buffer.from(payload).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(b64).digest("base64url")
  return `${b64}.${sig}`
}

/**
 * Verifica a assinatura do token e retorna os mapas de embaralhamento.
 * Retorna null se o token for inválido, adulterado ou referir quizId errado.
 */
export function verifyShuffleMaps(token: string, quizId: string): number[][] | null {
  const dot = token.lastIndexOf(".")
  if (dot < 0) return null

  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expected = createHmac("sha256", SECRET).update(b64).digest("base64url")
  const expBuf = Buffer.from(expected, "ascii")
  const sigBuf = Buffer.from(sig, "ascii")

  if (expBuf.length !== sigBuf.length) return null
  if (!timingSafeEqual(expBuf, sigBuf)) return null

  try {
    const parsed = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as {
      quizId: string
      maps: number[][]
    }
    if (parsed.quizId !== quizId) return null
    return parsed.maps
  } catch {
    return null
  }
}
