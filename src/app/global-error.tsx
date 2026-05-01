"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

// global-error.tsx captura erros de rendering do React App Router e reporta ao Sentry.
// Substituído pelo layout raiz em caso de erro catastrófico (inclui <html> e <body>).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#f0fdf4",
          color: "#1a3a2a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="EcoMed" width={72} height={72} style={{ borderRadius: 16 }} />
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Algo deu errado</h1>
        <p style={{ color: "#4b7a5e", margin: 0 }}>
          Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.6rem",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
