import { z } from "zod";
import {
  optionalPastDateSchema,
  optionalVietnamPhoneSchema,
  strongPasswordSchema,
} from "@/lib/validations/common";

export const updateProfileSchema = z.object({
  firstname:   z.string().max(100, "Họ tối đa 100 ký tự").optional().default(""),
  lastname:    z.string().max(100, "Tên tối đa 100 ký tự").optional().default(""),
  phoneNumber: optionalVietnamPhoneSchema.default(""),
  birthday:    optionalPastDateSchema.default(""),
  password:    strongPasswordSchema.optional().or(z.literal("")),
});

export type UpdateProfileValues = z.input<typeof updateProfileSchema>;
