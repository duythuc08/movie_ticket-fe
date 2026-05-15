import { z } from "zod";

export const bookingRequestSchema = z.object({
  userId:          z.string().min(1, "Thiếu thông tin người dùng"),
  seatShowTimeIds: z.array(z.number()).min(1, "Vui lòng chọn ít nhất 1 ghế"),
  foods: z
    .array(
      z.object({
        foodId:   z.number(),
        quantity: z.number().min(1, "Số lượng tối thiểu là 1"),
      })
    )
    .optional(),
  promotionCode: z.string().optional(),
});

export const foodSelectionSchema = z.object({
  cart: z.record(z.string(), z.number().min(0)),
});
