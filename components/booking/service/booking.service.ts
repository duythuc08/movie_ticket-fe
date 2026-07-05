import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/fetchApi";
import type { FoodProduct, SelectionResponse, UserVoucher } from "@/types";

const BASE_URL = "/api-proxy";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchSeatSelection(showTimeId: number, token: string): Promise<SelectionResponse> {
  const res = await apiFetch(
    `${BASE_URL}/seatShowTimes/selection/${showTimeId}`,
    { headers: authHeaders(token), cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Lỗi kết nối API selection"));
  return data.result as SelectionResponse;
}

export async function getFoods(token: string, cinemaId: number): Promise<FoodProduct[]> {
  const res = await apiFetch(`${BASE_URL}/foods?cinemaId=${cinemaId}`, { headers: authHeaders(token) });
  const data = await res.json();
  return ((data.result ?? []) as Record<string, unknown>[]).map((item) => ({
    id: item.foodId as number,
    name: item.name as string,
    desc: item.description as string,
    price: item.price as number,
    img: item.imageUrl as string,
    stock: item.stockQuantity as number,
    isCombo: item.isCombo as boolean,
  }));
}

export interface VnpayBookingPayload {
  userId: string;
  seatShowTimeIds: (number | undefined)[];
  foods: { foodId: number; quantity: number }[];
  promotionCode?: string;
}

export async function getApplicableVouchers(
  token: string,
  movieId?: number,
  totalAmount?: number,
): Promise<UserVoucher[]> {
  const params = new URLSearchParams();
  if (movieId)     params.set("movieId",     String(movieId));
  if (totalAmount != null) params.set("totalAmount", String(totalAmount));

  const res = await apiFetch(`${BASE_URL}/users/vouchers/applicable?${params}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Không thể tải voucher"));
  return data.result ?? [];
}

export interface InitiateBookingPayload {
  userId: string;
  seatShowTimeIds: number[];
}

export interface InitiateBookingResult {
  orderId: number;
  totalTicketPrice: number;
  expiredTime: string;
  bookingTime: string;
  showTimeInfo: Record<string, unknown>;
  tickets: { orderTicketId: number; seatName: string; price: number; seatType: string }[];
}

export async function initiateBooking(
  token: string,
  payload: InitiateBookingPayload
): Promise<InitiateBookingResult> {
  const res = await apiFetch(`${BASE_URL}/bookings/initiate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Không thể khóa ghế"));
  return data.result as InitiateBookingResult;
}

export async function releaseBooking(token: string, orderId: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/bookings/${orderId}/release`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Không thể thả ghế"));
}

export async function addFoodsToBooking(
  token: string,
  orderId: number,
  foods: { foodId: number; quantity: number }[]
): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/bookings/${orderId}/foods`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ foods }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Không thể cập nhật đồ ăn"));
}

export async function checkoutBooking(
  token: string,
  orderId: number,
  promotionCode?: string,
  paymentMethod: "VNPAY" | "MOMO" = "VNPAY"
): Promise<{ paymentUrl: string; finalPrice: number; discountAmount: number; memberDiscountAmount: number }> {
  const res = await apiFetch(`${BASE_URL}/bookings/${orderId}/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ promotionCode: promotionCode ?? null, paymentType: paymentMethod }),
  });
  const data = await res.json();
  if (data.code !== 1000) throw new Error(getErrorMessage(data?.code, data?.message || "Checkout thất bại"));
  return data.result;
}

export async function createPayment(
  token: string,
  payload: VnpayBookingPayload
): Promise<{ orderId: string; paymentUrl: string; finalPrice: number; discountAmount: number; [key: string]: unknown }> {
  const res = await apiFetch(`${BASE_URL}/payment/create-vnpay-booking`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.code !== 1000) throw new Error(getErrorMessage(data?.code, data?.message || "Tạo thanh toán VNPAY thất bại"));
  return data.result;
}
