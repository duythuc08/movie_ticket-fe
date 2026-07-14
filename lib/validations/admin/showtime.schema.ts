import * as z from "zod";

export const showtimePriceSchema = z.object({
    price: z.number().min(1, "Giá tiền phải lớn hơn 0"),
    seatType: z.string().min(1, "Vui lòng chọn loại ghế")
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
    prices: z.array(showtimePriceSchema).min(1, "Cần thiết lập ít nhất 1 giá vé")
});

export type CreateShowtimeValues = z.infer<typeof createShowtimeSchema>;

export const updateShowtimeSchema = z.object({
    movieId: z.number().min(1, "Vui lòng chọn phim"),
    roomId: z.number().min(1, "Vui lòng chọn phòng chiếu"),
    startTime: z.string().min(1, "Định dạng giờ không hợp lệ")
});

export type UpdateShowtimeValues = z.infer<typeof updateShowtimeSchema>;