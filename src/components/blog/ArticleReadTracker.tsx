"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

interface ArticleReadTrackerProps {
  articleSlug: string
}

/**
 * Componente invisível que rastreia leitura de artigos.
 * Envia POST /api/coins/article-read quando o usuário:
 *   - Leu por ≥ 120 segundos
 *   - E rolou ≥ 90% da página
 * Dispara apenas uma vez por sessão por artigo.
 */
export function ArticleReadTracker({ articleSlug }: ArticleReadTrackerProps) {
  const secondsRef = useRef(0)
  const scrollPctRef = useRef(0)
  const creditedRef = useRef(false)

  useEffect(() => {
    if (creditedRef.current) return

    // Rastrear scroll
    function onScroll() {
      const el = document.documentElement
      const scrolled = el.scrollTop + el.clientHeight
      const total = el.scrollHeight
      scrollPctRef.current = total > 0 ? Math.round((scrolled / total) * 100) : 0
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll() // calcular estado inicial

    // Contar segundos
    const timer = setInterval(() => {
      if (creditedRef.current) return
      secondsRef.current += 1

      if (secondsRef.current >= 120 && scrollPctRef.current >= 90) {
        creditedRef.current = true
        clearInterval(timer)

        fetch("/api/coins/article-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleSlug,
            secondsRead: secondsRef.current,
            scrollPct: scrollPctRef.current,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok) {
              toast.success("+2 EcoCoins por ler o artigo completo!", {
                icon: "🌱",
                duration: 4000,
              })
            }
          })
          .catch(() => {
            // Falha silenciosa — não interrompe a experiência de leitura
          })
      }
    }, 1000)

    return () => {
      clearInterval(timer)
      window.removeEventListener("scroll", onScroll)
    }
  }, [articleSlug])

  return null
}
