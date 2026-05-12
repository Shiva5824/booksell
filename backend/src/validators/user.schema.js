import { z } from "zod";

export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional(),
    phone: z.string().optional(),
  }),
});

export default updateUserProfileSchema;
