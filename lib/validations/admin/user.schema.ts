import { z } from "zod";

export const createUserSchema = z.object({
  username:    z.string().email("Username phải là email hợp lệ").min(3),
  password:    z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  firstname:   z.string().optional().default(""),
  lastname:    z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  birthday:    z.string().optional().default(""),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  password:    z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").optional().or(z.literal("")),
  firstname:   z.string().optional().default(""),
  lastname:    z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  birthday:    z.string().optional().default(""),
  roles:       z.array(z.string()).default(["USER"]),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;
