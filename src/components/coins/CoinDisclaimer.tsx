"use client"

import { Info } from "lucide-react"
import Link from "next/link"

/**
 * Aviso legal resumido sobre EcoMed Coins.
 * Deve aparecer em todas as telas relacionadas a Coins (perfil, recompensas).
 */
export function CoinDisclaimer() {
  return (
    <details className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 text-sm group">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-amber-800 dark:text-amber-300 select-none">
        <Info className="size-4 shrink-0" />
        <span className="flex-1 font-medium">
          EcoMed Coins não possuem valor monetário
        </span>
        {/* seta via CSS — gira quando `details` está aberto */}
        <svg
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="px-4 pb-4 space-y-2 text-amber-900 dark:text-amber-200">
        <p>
          Os <strong>EcoMed Coins</strong> são pontos virtuais de uso exclusivo na
          plataforma EcoMed. <strong>Não</strong> são moeda digital, criptomoeda
          ou ativo financeiro e <strong>não podem</strong> ser convertidos em
          dinheiro nem transferidos entre usuários.
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Resgates são irreversíveis — Coins gastos não são devolvidos.</li>
          <li>Em caso de exclusão de conta, os Coins acumulados são perdidos.</li>
          <li>Acúmulo artificial (bots, múltiplas contas) resulta em sanções.</li>
          <li>Regras e valores podem ser alterados com aviso prévio de 7 dias.</li>
        </ul>
        <Link
          href="/termos#ecocoins"
          className="inline-block text-xs font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2"
        >
          Leia as regras completas nos Termos de Uso →
        </Link>
      </div>
    </details>
  )
}
