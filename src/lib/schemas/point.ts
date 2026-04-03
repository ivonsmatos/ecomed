import { z } from "zod"

export const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opens: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  closes: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  closed: z.boolean(),
})

export const createPointSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(100),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  zipCode: z.string().regex(/^\d{8}$/, "CEP inválido — somente 8 dígitos"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  residueTypes: z.array(z.string()).min(1, "Selecione pelo menos 1 tipo de resíduo"),
  schedules: z.array(scheduleSchema).optional(),
})

export const updatePointSchema = createPointSchema.partial()

export type CreatePointInput = z.infer<typeof createPointSchema>
export type UpdatePointInput = z.infer<typeof updatePointSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema>
