import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    college: z.string().max(120).optional().or(z.literal("")),
    avatar: z.string().url().optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal(""))
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
