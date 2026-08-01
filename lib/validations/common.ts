import { z } from "zod";

export const VIETNAM_PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

export const vietnamPhoneMessage = "Số điện thoại không hợp lệ (VD: 0901234567)";

export const requiredVietnamPhoneSchema = z
  .string()
  .trim()
  .min(1, "Số điện thoại không được để trống")
  .regex(VIETNAM_PHONE_REGEX, vietnamPhoneMessage);

export const optionalVietnamPhoneSchema = z
  .string()
  .trim()
  .regex(VIETNAM_PHONE_REGEX, vietnamPhoneMessage)
  .optional()
  .or(z.literal(""));

export const strongPasswordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .regex(/[a-z]/, "Mật khẩu phải có chữ thường")
  .regex(/[A-Z]/, "Mật khẩu phải có chữ hoa")
  .regex(/[^a-zA-Z0-9]/, "Mật khẩu phải có ký tự đặc biệt");

function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isPastDateString(value: string): boolean {
  if (!isValidDateString(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export const requiredPastDateSchema = z
  .string()
  .min(1, "Vui lòng chọn ngày")
  .refine(isValidDateString, "Ngày không hợp lệ")
  .refine(isPastDateString, "Ngày không được là hôm nay hoặc trong tương lai");

export const optionalPastDateSchema = z
  .string()
  .refine((value) => value === "" || isValidDateString(value), "Ngày không hợp lệ")
  .refine((value) => value === "" || isPastDateString(value), "Ngày không được là hôm nay hoặc trong tương lai")
  .optional()
  .or(z.literal(""));
