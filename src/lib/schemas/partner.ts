import { z } from "zod"

function validarCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false // todos dígitos iguais

  const calc = (strip: string, weights: number[]) =>
    strip
      .split("")
      .reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const rem1 = calc(cnpj.slice(0, 12), weights1) % 11
  const d1 = rem1 < 2 ? 0 : 11 - rem1
  if (d1 !== parseInt(cnpj[12])) return false

  const rem2 = calc(cnpj.slice(0, 13), weights2) % 11
  const d2 = rem2 < 2 ? 0 : 11 - rem2
  return d2 === parseInt(cnpj[13])
}

export const partnerRegistrationSchema = z.object({
  cnpj: z
    .string()
    .regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos numéricos (somente números)")
    .refine(validarCNPJ, "CNPJ inválido (dígitos verificadores incorretos)"),
  companyName: z.string().min(3, "Razão social muito curta").max(200),
  tradeName: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido (somente dígitos, 10 ou 11)")
    .optional()
    .or(z.literal("")),
})

export type PartnerRegistrationInput = z.infer<typeof partnerRegistrationSchema>
