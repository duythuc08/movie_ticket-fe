import { z } from "zod";

export const pricePolicySchema = z.object({
  cinemaId: z.number({ message: "Vui lòng chọn rạp" }).positive("Vui lòng chọn rạp"),
  name: z.string().min(1, "Tên chính sách không được bỏ trống").max(200),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().min(1, "Ngày hiệu lực từ là bắt buộc"),
  effectiveTo: z.string().optional().default(""),
}).refine(
  (d) => !d.effectiveTo || d.effectiveTo >= d.effectiveFrom,
  { message: "Hiệu lực đến phải sau hoặc bằng hiệu lực từ", path: ["effectiveTo"] }
);

export type PricePolicyValues = z.infer<typeof pricePolicySchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, "Tên kỳ nghỉ không được bỏ trống").max(200),
  dateFrom: z.string().min(1, "Từ ngày là bắt buộc"),
  dateTo: z.string().min(1, "Đến ngày là bắt buộc"),
}).refine(
  (d) => d.dateTo >= d.dateFrom,
  { message: "Đến ngày phải sau hoặc bằng từ ngày", path: ["dateTo"] }
);

export type HolidayValues = z.infer<typeof holidaySchema>;

const priceRuleRowSchema = z.object({
  roomType: z.enum(["TWO_D", "THREE_D", "IMAX", "PREMIUM"]),
  seatType: z.enum(["STANDARD", "VIP", "COUPLE"]),
  ruleType: z.enum(["WEEKDAY_LIST", "HOLIDAY", "DEFAULT"]),
  startHour: z.string().optional().default(""),
  endHour: z.string().optional().default(""),
  basePrice: z.number().positive("Giá phải lớn hơn 0"),
  weekdays: z.array(z.enum(
    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
  )).default([]),
  holidayIds: z.array(z.number()).default([]),
}).refine(
  (d) => d.ruleType !== "WEEKDAY_LIST" || d.weekdays.length > 0,
  { message: "Chọn ít nhất 1 thứ trong tuần", path: ["weekdays"] }
).refine(
  (d) => d.ruleType !== "HOLIDAY" || d.holidayIds.length > 0,
  { message: "Chọn ít nhất 1 kỳ nghỉ", path: ["holidayIds"] }
).refine(
  (d) => !d.startHour || !d.endHour || d.endHour > d.startHour,
  { message: "Giờ kết thúc phải sau giờ bắt đầu", path: ["endHour"] }
);

export const pricePolicyRuleBulkSchema = z.object({
  rules: z.array(priceRuleRowSchema).min(1, "Cần ít nhất 1 rule"),
});

export type PricePolicyRuleBulkValues = z.infer<typeof pricePolicyRuleBulkSchema>;
export type PriceRuleRowValues = z.infer<typeof priceRuleRowSchema>;
