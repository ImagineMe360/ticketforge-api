import { z } from 'zod'

export const registerBody = z.object({
  email: z.email().toLowerCase().max(254),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
})

export type RegisterInput = z.infer<typeof registerBody>

export const loginBody = z.object({
  email: z.email().toLowerCase().max(254),
  password: z.string().min(1).max(128),
})

export type LoginInput = z.infer<typeof loginBody>

export const sessionIdParams = z.object({ id: z.uuid() })
