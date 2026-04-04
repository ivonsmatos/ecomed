"use client"

import { useState, useEffect, useCallback } from "react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"

export function QRCodeDisplay() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expiraEm, setExpiraEm] = useState(300)

  const buscarToken = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/qr/meu-codigo")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setToken(data.token)
      setExpiraEm(300)
    } catch {
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    buscarToken()
  }, [buscarToken])

  // Contador regressivo — renova automaticamente ao expirar
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      setExpiraEm((prev) => {
        if (prev <= 1) {
          buscarToken()
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [token, buscarToken])

  const min = Math.floor(expiraEm / 60)
  const seg = expiraEm % 60

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg" />
        <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <p className="text-sm text-muted-foreground">Erro ao gerar QR Code.</p>
        <Button variant="outline" size="sm" onClick={buscarToken}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <p className="text-sm text-muted-foreground text-center">
        Mostre este QR Code ao parceiro no momento do descarte
      </p>

      <div className="bg-white p-4 rounded-xl border border-border">
        <QRCode value={token} size={192} fgColor="#2D7D46" level="M" />
      </div>

      <p
        className={`text-sm ${expiraEm < 60 ? "text-red-500" : "text-muted-foreground"}`}
      >
        Expira em {min}:{seg.toString().padStart(2, "0")}
      </p>

      <Button variant="outline" size="sm" onClick={buscarToken}>
        Renovar QR Code
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Não compartilhe este QR com outras pessoas.
      </p>
    </div>
  )
}
