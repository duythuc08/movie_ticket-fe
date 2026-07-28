import { z } from "zod";

export const updateProfileSchema = z.object({
  firstname:   z.string().min(1, "Họ không được để trống"),
  lastname:    z.string().min(1, "Tên không được để trống"),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Số điện thoại phải gồm đúng 10 chữ số")
    .optional()
    .or(z.literal("")),
  birthday: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Mật khẩu hiện tại tối thiểu 8 ký tự"),
    newPassword:     z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path:    ["confirmPassword"],
  });
