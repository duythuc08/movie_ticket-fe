import { z } from "zod";

export const bannerFormSchema = z.object({
  imageUrl: z.string().min(1, "URL ảnh không được để trống"),

  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),

  description: z
    .string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .default(""),

  linkUrl: z
    .string()
    .url("URL liên kết không hợp lệ")
    .optional()
    .or(z.literal(""))
    .default(""),

  priority: z
    .number()
    .int()
    .min(0, "Độ ưu tiên tối thiểu là 0")
    .max(100, "Độ ưu tiên tối đa là 100")
    .default(0),

  active: z.boolean().default(true),

  bannerType: z.enum(["MOVIE", "EVENT"] as const, {
    error: "Vui lòng chọn loại banner",
  }),

  movieId: z.number().optional().nullable(),
  eventId: z.number().optional().nullable(),
});

export type BannerFormSchema = z.infer<typeof bannerFormSchema>;
