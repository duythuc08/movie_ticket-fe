import { z } from "zod";

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

  trailerUrl: z.string().url("URL trailer không hợp lệ").or(z.literal("")),

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

  subTitle: z.string().max(100, "Phụ đề tối đa 100 ký tự"),

  ageRating: z.enum(["G", "PG", "PG_13", "R", "NC_17"] as const, {
    error: "Vui lòng chọn phân loại độ tuổi",
  }),

  genreNames: z.array(z.string()).min(1, "Phải chọn ít nhất 1 thể loại"),

  castIds: z.array(z.number()),

  directorIds: z.array(z.number()).min(1, "Phải chọn ít nhất 1 đạo diễn"),

  posterUrl: z.string(),

  posterFile: z.instanceof(File).nullable(),
});

export type MovieFormSchema = z.infer<typeof movieFormSchema>;
