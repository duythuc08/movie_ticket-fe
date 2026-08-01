import { z } from "zod";
import {
  requiredPastDateSchema,
  requiredVietnamPhoneSchema,
  strongPasswordSchema,
} from "@/lib/validations/common";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const registerSchema = z
  .object({
    firstname: z.string().min(1, "Vui lòng nhập họ"),
    lastname: z.string().min(1, "Vui lòng nhập tên"),
    phoneNumber: requiredVietnamPhoneSchema,
    birthday: requiredPastDateSchema,
    email: z.string().email("Email không hợp lệ"),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .length(6, "Mã OTP gồm 6 ký tự")
    .regex(/^[0-9]+$/, "Mã OTP chỉ gồm chữ số"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
