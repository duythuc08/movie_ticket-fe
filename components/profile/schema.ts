import { z } from "zod";
import {
  optionalPastDateSchema,
  optionalVietnamPhoneSchema,
  strongPasswordSchema,
} from "@/lib/validations/common";

export const updateProfileSchema = z.object({
  firstname:   z.string().min(1, "Họ không được để trống").max(100, "Họ tối đa 100 ký tự"),
  lastname:    z.string().min(1, "Tên không được để trống").max(100, "Tên tối đa 100 ký tự"),
  phoneNumber: optionalVietnamPhoneSchema.default(""),
  birthday:    optionalPastDateSchema.default(""),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword:     strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path:    ["confirmPassword"],
  });
