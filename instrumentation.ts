// Next.js 15 instrumentation hook — carrega Sentry no servidor + edge runtime.
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Captura erros não tratados em route handlers (Next 15+)
export { captureRequestError as onRequestError } from "@sentry/nextjs"
