import * as z from "zod";

export const showtimePriceSchema = z.object({
  price: z.number(),
  seatType: z.string(),
});

export const createShowtimeSchema = z.object({
  movieId: z.number().min(1, "Vui lòng chọn phim"),
  roomId: z.number().min(1, "Vui lòng chọn phòng chiếu"),
  startTimes: z.array(
    z.string().min(1, "Định dạng giờ không hợp lệ").refine(
      (v) => !v || new Date(v) > new Date(),
      "Giờ chiếu phải ở tương lai"
    )
  ).min(1, "Cần ít nhất 1 giờ chiếu"),
  usePricePolicy: z.boolean().default(true),
  prices: z.array(showtimePriceSchema).default([]),
}).refine(
  (d) => d.usePricePolicy || d.prices.length > 0,
  { message: "Cần thiết lập ít nhất 1 giá vé", path: ["prices"] }
).refine(
  (d) => d.usePricePolicy || d.prices.every((p) => p.price > 0),
  { message: "Giá tiền phải lớn hơn 0", path: ["prices"] }
).refine(
  (d) => d.usePricePolicy || d.prices.every((p) => p.seatType && p.seatType.length > 0),
  { message: "Vui lòng chọn loại ghế", path: ["prices"] }
);

export type CreateShowtimeValues = z.infer<typeof createShowtimeSchema>;

export const updateShowtimeSchema = z.object({
  movieId: z.number().min(1, "Vui lòng chọn phim"),
  roomId: z.number().min(1, "Vui lòng chọn phòng chiếu"),
  startTime: z.string().min(1, "Định dạng giờ không hợp lệ"),
});

export type UpdateShowtimeValues = z.infer<typeof updateShowtimeSchema>;
