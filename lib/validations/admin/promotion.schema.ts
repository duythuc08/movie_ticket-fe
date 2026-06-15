import { z } from "zod";

const nullablePositiveInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().positive("Phải lớn hơn 0").nullable()
);

const nullablePositiveNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().positive("Phải lớn hơn 0").nullable()
);

export const promotionSchema = z.object({
  code:             z.string().min(1, "Mã không được bỏ trống").max(50),
  name:             z.string().min(1, "Tên không được bỏ trống").max(200),
  description:      z.string().optional().default(""),
  type:             z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue:    z.number().positive("Phải lớn hơn 0"),
  minOrderValue:    nullablePositiveNumber,
  maxDiscountAmount: nullablePositiveNumber,
  useLimit:         nullablePositiveInt,
  startTime:        z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  endTime:          z.string().min(1, "Ngày kết thúc là bắt buộc"),
  applicableMovieIds: z.array(z.number()).default([]),
  dayOfWeek:        z.array(
    z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"])
  ).default([]),
  isPublic:         z.boolean().default(true),
}).refine(
  (d) => !d.startTime || !d.endTime || new Date(d.endTime) > new Date(d.startTime),
  { message: "Ngày kết thúc phải sau ngày bắt đầu", path: ["endTime"] }
).refine(
  (d) => d.type !== "PERCENTAGE" || (d.discountValue > 0 && d.discountValue <= 100),
  { message: "Giảm theo % phải từ 1–100", path: ["discountValue"] }
);

export type PromotionValues = z.infer<typeof promotionSchema>;

export const eventSchema = z.object({
  title:       z.string().min(1, "Tiêu đề không được bỏ trống").max(200),
  description: z.string().optional().default(""),
  posterUrl:   z.any().nullable().optional(),
  startTime:   z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  endTime:     z.string().min(1, "Ngày kết thúc là bắt buộc"),
  eventType:   z.enum(["PREMIERE", "FESTIVAL", "SPECIAL_SCREENING", "PROMOTION"]),
  movieId:     z.number().nullable().optional(),
}).refine(
  (d) => !d.startTime || !d.endTime || new Date(d.endTime) > new Date(d.startTime),
  { message: "Ngày kết thúc phải sau ngày bắt đầu", path: ["endTime"] }
);

export type EventValues = z.infer<typeof eventSchema>;
