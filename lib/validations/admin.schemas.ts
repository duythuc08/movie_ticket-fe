import { z } from "zod";

export const genreFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tên thể loại không được để trống")
    .max(100, "Tên thể loại tối đa 100 ký tự"),
  description: z
    .string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .default(""),
});

export type GenreFormSchema = z.infer<typeof genreFormSchema>;

export const personFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự"),
  avatarUrl: z
    .string()
    .url("URL ảnh đại diện không hợp lệ")
    .optional()
    .or(z.literal(""))
    .default(""),
  movieRole: z.enum(["DIRECTOR", "ACTOR"] as const, {
    error: "Vui lòng chọn vai trò",
  }),
});

export type PersonFormSchema = z.infer<typeof personFormSchema>;

export const movieFormSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề phim không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),

  description: z
    .string()
    .min(10, "Mô tả phải có ít nhất 10 ký tự")
    .max(5000, "Mô tả tối đa 5000 ký tự"),

  duration: z
    .number({ error: "Thời lượng phải là số" })
    .int("Thời lượng phải là số nguyên")
    .min(1, "Thời lượng phải lớn hơn 0 phút")
    .max(600, "Thời lượng tối đa 600 phút"),

  trailerUrl: z
    .string()
    .url("URL trailer không hợp lệ")
    .optional()
    .or(z.literal(""))
    .default(""),

  releaseDate: z
    .string()
    .min(1, "Ngày ra mắt không được để trống")
    .refine((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }, "Ngày ra mắt không hợp lệ"),

  language: z
    .string()
    .min(1, "Ngôn ngữ không được để trống")
    .max(50, "Tên ngôn ngữ tối đa 50 ký tự"),

  subTitle: z
    .string()
    .max(100, "Phụ đề tối đa 100 ký tự")
    .optional()
    .default(""),

  ageRating: z.enum(["G", "PG", "PG_13", "R", "NC_17"], {
    error: "Vui lòng chọn phân loại độ tuổi",
  }),

  genreNames: z
    .array(z.string())
    .min(1, "Phải chọn ít nhất 1 thể loại"),

  castIds: z
    .array(z.number())
    .optional()
    .default([]),

  directorIds: z
    .array(z.number())
    .min(1, "Phải chọn ít nhất 1 đạo diễn"),

  posterUrl: z
    .string()
    .optional()
    .default(""),

  posterFile: z
    .instanceof(File)
    .optional()
    .nullable()
    .default(null),
});

export type MovieFormSchema = z.infer<typeof movieFormSchema>;

export const bannerFormSchema = z.object({
  imageUrl: z
    .string()
    .min(1, "URL ảnh không được để trống"),

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

  bannerType: z.enum(["MOVIE", "EVENT"], {
    error: "Vui lòng chọn loại banner",
  }),

  movieId: z.number().optional().nullable(),
  eventId: z.number().optional().nullable(),
});

export type BannerFormSchema = z.infer<typeof bannerFormSchema>;

export const quickAddGenreSchema = z.object({
  name: z
    .string()
    .min(1, "Tên thể loại không được để trống")
    .max(100, "Tên thể loại tối đa 100 ký tự"),
  description: z.string().max(500).optional().default(""),
});

export type QuickAddGenreSchema = z.infer<typeof quickAddGenreSchema>;

export const quickAddPersonSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự"),
  movieRole: z.enum(["DIRECTOR", "ACTOR"], {
    error: "Vui lòng chọn vai trò",
  }),
  avatarUrl: z.string().url().optional().or(z.literal("")).default(""),
});

export type QuickAddPersonSchema = z.infer<typeof quickAddPersonSchema>;