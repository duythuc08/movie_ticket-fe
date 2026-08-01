import { z } from "zod";
import {
  optionalPastDateSchema,
  optionalVietnamPhoneSchema,
  strongPasswordSchema,
} from "@/lib/validations/common";

export const createUserSchema = z.object({
  username:    z.string().email("Username phải là email hợp lệ").min(3),
  password:    strongPasswordSchema,
  firstname:   z.string().max(100, "Họ tối đa 100 ký tự").optional().default(""),
  lastname:    z.string().max(100, "Tên tối đa 100 ký tự").optional().default(""),
  phoneNumber: optionalVietnamPhoneSchema.default(""),
  birthday:    optionalPastDateSchema.default(""),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  password:    strongPasswordSchema.optional().or(z.literal("")),
  firstname:   z.string().max(100, "Họ tối đa 100 ký tự").optional().default(""),
  lastname:    z.string().max(100, "Tên tối đa 100 ký tự").optional().default(""),
  phoneNumber: optionalVietnamPhoneSchema.default(""),
  birthday:    optionalPastDateSchema.default(""),
  roles:       z.array(z.enum(["USER", "ADMIN"] as const)).min(1, "Vui lòng chọn ít nhất 1 vai trò").default(["USER"]),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;
