import { z } from "zod"

export const partnerRegistrationSchema = z.object({
  cnpj: z
    .string()
    .regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos numéricos (somente números)"),
  companyName: z.string().min(3, "Razão social muito curta").max(200),
  tradeName: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido (somente dígitos, 10 ou 11)")
    .optional()
    .or(z.literal("")),
})

export type PartnerRegistrationInput = z.infer<typeof partnerRegistrationSchema>
