import { z } from "zod";

export const updateProfileSchema = z.object({
  firstname:   z.string().optional().default(""),
  lastname:    z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  birthday:    z.string().optional().default(""),
  password:    z.string().min(8, "Tối thiểu 8 ký tự").optional().or(z.literal("")),
});

export type UpdateProfileValues = z.input<typeof updateProfileSchema>;
