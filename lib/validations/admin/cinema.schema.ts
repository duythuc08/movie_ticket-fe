import { z } from "zod";

export const cinemaFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tên rạp không được để trống")
    .max(200, "Tên rạp tối đa 200 ký tự"),
  address: z
    .string()
    .min(1, "Địa chỉ không được để trống")
    .max(500, "Địa chỉ tối đa 500 ký tự"),
  phoneNumber: z
    .string()
    .min(1, "Số điện thoại không được để trống")
    .regex(/^(0[35789])[0-9]{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567)"),
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  cinemaStatus: z.enum(["OPERATIONAL", "TEMPORARILY_CLOSED"] as const, {
    error: "Vui lòng chọn trạng thái rạp",
  }),
});

export type CinemaFormSchema = z.infer<typeof cinemaFormSchema>;

export const roomFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tên phòng không được để trống")
    .max(100, "Tên phòng tối đa 100 ký tự"),
  capacity: z
    .number({ error: "Sức chứa phải là số" })
    .int("Sức chứa phải là số nguyên")
    .min(0, "Sức chứa phải từ 0")
    .max(1000, "Sức chứa tối đa 1000 ghế"),
  cinemaId: z
    .number({ error: "Vui lòng chọn rạp" })
    .int()
    .positive("ID rạp không hợp lệ"),
  roomType: z.enum(["TWO_D", "THREE_D", "IMAX", "PREMIUM"] as const, {
    error: "Vui lòng chọn loại phòng",
  }),
  roomStatus: z.enum(["OPERATIONAL", "MAINTENANCE", "CLEANING"] as const, {
    error: "Vui lòng chọn trạng thái phòng",
  }),
  rowCount: z.preprocess(
    (val) => val === "" || Number.isNaN(val) ? undefined : Number(val),
    z.number({ error: "Số hàng phải là số" })
      .int()
      .min(1, "Phải có ít nhất 1 hàng")
      .max(30, "Tối đa 30 hàng")
      .optional()
  ),
  columnCount: z.preprocess(
    (val) => val === "" || Number.isNaN(val) ? undefined : Number(val),
    z.number({ error: "Số cột phải là số" })
      .int()
      .min(1, "Phải có ít nhất 1 cột")
      .max(30, "Tối đa 30 cột")
      .optional()
  ),
});

export type RoomFormSchema = z.infer<typeof roomFormSchema>;

export const seatSetupDimensionSchema = z.object({
  rows: z
    .number({ error: "Số hàng phải là số" })
    .int()
    .min(1, "Phải có ít nhất 1 hàng")
    .max(30, "Tối đa 30 hàng"),
  cols: z
    .number({ error: "Số cột phải là số" })
    .int()
    .min(1, "Phải có ít nhất 1 cột")
    .max(30, "Tối đa 30 cột"),
});

export type SeatSetupDimensionSchema = z.infer<typeof seatSetupDimensionSchema>;
