import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

export function validateCNPJAlgorithm(cnpj: string): boolean {
  const stripped = cnpj.replace(/\D/g, "")
  if (stripped.length !== 14) return false
  if (/^(\d)\1+$/.test(stripped)) return false

  const calc = (seq: number[]) =>
    seq.reduce((acc, n, i) => acc + n * (seq.length + 1 - i), 0)

  const digits = stripped.split("").map(Number)
  const d1 = digits.slice(0, 12)
  const r1 = calc(d1) % 11
  const v1 = r1 < 2 ? 0 : 11 - r1
  if (digits[12] !== v1) return false

  const d2 = digits.slice(0, 13)
  const r2 = calc(d2) % 11
  const v2 = r2 < 2 ? 0 : 11 - r2
  return digits[13] === v2
}

export function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, "")
  if (p.length === 11) return p.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
  if (p.length === 10) return p.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
  return phone
}

