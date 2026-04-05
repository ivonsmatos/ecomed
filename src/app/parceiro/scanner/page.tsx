"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

type CheckinResult = {
  ok: boolean
  coinsEarned: number
  userName: string
  pointName: string
  levelUp?: string | null
}

export default function ScannerPage() {
  const { data: session } = useSession()
  const [pointId, setPointId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [resultado, setResultado] = useState<CheckinResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  // Buscar ponto aprovado do parceiro logado
  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/parceiro/meu-ponto")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPointId(data?.id ?? null))
  }, [session])

  const pararScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
    } catch {
      // ignorar erros de limpeza
    }
    setScanning(false)
  }

  const iniciarScanner = async () => {
    setResultado(null)
    setErro(null)
    setScanning(true)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decoded: string) => {
          await pararScanner()
          await processarCheckin(decoded)
        },
        () => {}, // erros de frame — ignorar
      )
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique as permissões.")
      setScanning(false)
    }
  }

  const processarCheckin = async (token: string) => {
    if (!pointId) {
      setErro("Nenhum ponto aprovado associado a esta conta.")
      return
    }

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pointId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(
          data.code === "DUPLICATE_CHECKIN"
            ? "Este usuário já fez check-in neste ponto hoje."
            : data.error ?? "Erro ao processar check-in.",
        )
        return
      }

      setResultado(data)

      // Confetti animado ao creditar coins
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#2D7D46", "#4CAF73", "#F5A623"],
        origin: { y: 0.6 },
      })
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    }
  }

  // Limpar scanner ao sair da página
  useEffect(() => () => { pararScanner() }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <h1 className="text-xl font-medium">Scanner de Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aponte a câmera para o QR Code do cidadão
        </p>
        {!pointId && (
          <p className="text-xs text-amber-600 mt-2">
            Nenhum ponto aprovado encontrado. Verifique o painel.
          </p>
        )}
      </div>

      <div
        id="qr-reader"
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ minHeight: scanning ? 300 : 0 }}
      />

      {resultado && (
        <div className="w-full max-w-sm bg-eco-teal/10 border border-eco-teal/20 rounded-xl p-5 text-center">
          <p className="text-eco-teal-dark font-medium text-lg">Check-in registrado!</p>
          <p className="text-eco-green mt-1 font-medium">{resultado.userName}</p>
          <p className="text-eco-green text-sm mt-1">
            +{resultado.coinsEarned} EcoCoins creditados
          </p>
          {resultado.levelUp && (
            <p className="text-amber-600 text-sm mt-2 font-medium">
              Subiu para o nível {resultado.levelUp}!
            </p>
          )}
          <p className="text-muted-foreground text-xs mt-2">{resultado.pointName}</p>
        </div>
      )}

      {erro && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!scanning ? (
          <Button
            onClick={iniciarScanner}
            disabled={!pointId}
            className="bg-primary text-white"
          >
            Escanear QR Code
          </Button>
        ) : (
          <Button variant="outline" onClick={pararScanner}>
            Parar scanner
          </Button>
        )}
        {(resultado || erro) && (
          <Button variant="outline" onClick={iniciarScanner}>
            Novo scan
          </Button>
        )}
      </div>
    </div>
  )
}
