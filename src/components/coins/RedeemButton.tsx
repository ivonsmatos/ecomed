"use client"

import { useState } from "react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface RedeemButtonProps {
  rewardId: string
  disabled: boolean
  label: string
}

export function RedeemButton({ rewardId, disabled, label }: RedeemButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = async () => {
    if (disabled || loading || done) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao resgatar.")
        return
      }

      setDone(true)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-xs font-medium text-eco-green bg-eco-teal/10 rounded-full px-3 py-1.5 border border-eco-teal/20">
        ✓ Resgatado
      </span>
    )
  }

  return (
    <div className="space-y-1 text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({ size: "sm", variant: disabled ? "outline" : "default" }),
          "text-xs",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {loading ? "Aguarde..." : label}
      </button>
      {error && <p className="text-xs text-red-500 max-w-30">{error}</p>}
    </div>
  )
}
