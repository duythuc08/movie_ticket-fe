import { z } from "zod";

export const personFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự"),
  avatarUrl: z.union([z.string(), z.instanceof(File), z.null()]).optional(),
  movieRole: z
    .array(z.enum(["DIRECTOR", "ACTOR"] as const))
    .min(1, "Vui lòng chọn ít nhất một vai trò"),
});

export type PersonFormSchema = z.infer<typeof personFormSchema>;

export const quickAddPersonSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự"),
  movieRole: z.enum(["DIRECTOR", "ACTOR"] as const, {
    error: "Vui lòng chọn vai trò",
  }),
  avatarUrl: z.string().url().optional().or(z.literal("")).default(""),
});

export type QuickAddPersonSchema = z.infer<typeof quickAddPersonSchema>;
