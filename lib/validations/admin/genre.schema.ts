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

export const quickAddGenreSchema = z.object({
  name: z
    .string()
    .min(1, "Tên thể loại không được để trống")
    .max(100, "Tên thể loại tối đa 100 ký tự"),
  description: z.string().max(500).optional().default(""),
});

export type QuickAddGenreSchema = z.infer<typeof quickAddGenreSchema>;
