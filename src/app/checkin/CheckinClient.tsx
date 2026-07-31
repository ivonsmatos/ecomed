"use client"

import { useState } from "react"
import { MapPin, CheckCircle, Coins, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Point {
  id: string
  name: string
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  residueTypes: string[]
}

interface CheckinResult {
  ok: boolean
  coinsEarned: number
  hasGps: boolean
  newBalance: number
  levelUp?: string | null
  bonuses: { newPoint: boolean; firstInMonth: boolean }
  pointName: string
  novosSelosDescarte: string[]
}

const NIVEL_LABEL: Record<string, string> = {
  SEMENTE: "Semente 🌱",
  BROTO: "Broto 🌿",
  ARVORE: "Árvore 🌳",
  GUARDIAO: "Guardião 🛡️",
  LENDA_ECO: "Lenda Eco ⭐",
}

export function CheckinClient({ point, token }: { point: Point; token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleCheckin() {
    setStatus("loading")
    setErrorMsg("")

    let lat: number | undefined
    let lng: number | undefined

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 30_000,
        })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {
      // GPS negado — prossegue sem bônus
    }

    try {
      const res = await fetch("/api/checkin/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lat, lng }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "DUPLICATE_CHECKIN") {
          setErrorMsg("Você já registrou um descarte aqui hoje. Volte amanhã! 🌱")
        } else {
          setErrorMsg(data.error ?? "Erro ao registrar. Tente novamente.")
        }
        setStatus("error")
        return
      }

      setResult(data as CheckinResult)
      setStatus("success")
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.")
      setStatus("error")
    }
  }

  if (status === "success" && result) {
    return (
      <Card className="w-full max-w-sm text-center shadow-lg">
        <CardContent className="pt-8 pb-6 space-y-4">
          <CheckCircle className="mx-auto size-16 text-green-500" />
          <h2 className="text-2xl font-bold">Descarte registrado!</h2>
          <p className="text-muted-foreground text-sm">
            Obrigado por descartar corretamente em{" "}
            <span className="font-medium">{result.pointName}</span>.
          </p>

          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 p-4">
            <Coins className="size-6 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">
              +{result.coinsEarned} EcoCoins
            </span>
          </div>

          {result.hasGps && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              Bônus GPS confirmado ✓
            </Badge>
          )}

          {result.bonuses.newPoint && (
            <p className="text-sm text-blue-600">🎉 Primeiro descarte neste ponto! Bônus creditado.</p>
          )}
          {result.bonuses.firstInMonth && (
            <p className="text-sm text-purple-600">🔥 Retorno ao descarte! Bônus de reengajamento creditado.</p>
          )}
          {result.levelUp && (
            <p className="text-sm font-semibold text-green-700">
              ⭐ Você subiu para {NIVEL_LABEL[result.levelUp] ?? result.levelUp}!
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Saldo atual: <span className="font-semibold">{result.newBalance} EcoCoins</span>
          </p>

          <a href="/app" className={buttonVariants({ className: "w-full mt-2" })}>
            Ver minha carteira
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <MapPin className="size-6 text-green-600" />
        </div>
        <CardTitle className="text-xl">Registrar descarte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-1">
          <p className="font-semibold">{point.name}</p>
          <p className="text-sm text-muted-foreground">{point.address}</p>
          <p className="text-sm text-muted-foreground">
            {point.city} — {point.state}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-200">Como funciona:</p>
          <ul className="text-amber-700 dark:text-amber-300 space-y-0.5 text-xs list-disc list-inside">
            <li>Entregue seus medicamentos vencidos no balcão</li>
            <li>Clique em &quot;Confirmar&quot; — usaremos seu GPS para garantir que você está aqui</li>
            <li>
              Ganhe <strong>15 EcoCoins com GPS</strong> ou 10 sem
            </li>
            <li>Limite: 1 descarte por dia neste ponto</li>
          </ul>
        </div>

        {status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckin}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Registrando…
            </>
          ) : (
            "Confirmar descarte"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ao confirmar, você declara que está entregando medicamentos vencidos ou sem uso neste
          ponto de coleta.
        </p>
      </CardContent>
    </Card>
  )
}
