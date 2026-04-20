import webpush from "web-push"
import { prisma } from "@/lib/db/prisma"

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidEmail = process.env.VAPID_EMAIL || "contato@ecomed.eco.br"

let vapidConfigured = false
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate)
  vapidConfigured = true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

/**
 * Envia push para todas as inscricoes do usuario.
 * Remove automaticamente subscriptions invalidas (404/410).
 * Nao lanca: falhas sao logadas para nao quebrar o fluxo principal.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number; errors: number }> {
  if (!vapidConfigured) {
    return { sent: 0, removed: 0, errors: 0 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) {
    return { sent: 0, removed: 0, errors: 0 }
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-72.png",
    tag: payload.tag,
  })

  let sent = 0
  let removed = 0
  let errors = 0
  const deadEndpoints: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          deadEndpoints.push(sub.endpoint)
        } else {
          errors++
          console.error("[push] erro ao enviar:", status, (err as Error)?.message)
        }
      }
    }),
  )

  if (deadEndpoints.length > 0) {
    const result = await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: deadEndpoints } },
    })
    removed = result.count
  }

  return { sent, removed, errors }
}
