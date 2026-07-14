import { z } from "zod";

export const foodFormSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(255, "Tên quá dài"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Giá phải lớn hơn 0"),
  imageUrl: z.string().url("URL ảnh không hợp lệ").or(z.literal("")),
  imageFile: z.any().optional(),
  isCombo: z.boolean(),
  stockQuantity: z.number().int().min(0, "Số lượng không hợp lệ"),
  foodType: z.enum(["COMBO", "POPCORN", "DRINK", "SNACK"]),
  foodStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]),
});

export type FoodFormSchema = z.infer<typeof foodFormSchema>;
