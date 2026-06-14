import type { SeatShowTime, FoodProduct, SelectionResponse, UserVoucher } from "@/types";
import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/fetchApi";

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
  totalAmount: number,
  movieId?: number,
): Promise<UserVoucher[]> {
  const params = new URLSearchParams();
  if (totalAmount) params.set("totalAmount", String(totalAmount));
  if (movieId)     params.set("movieId",     String(movieId));

  const res = await apiFetch(`${BASE_URL}/users/vouchers/applicable?${params}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getErrorMessage(data?.code, data?.message || "Không thể tải voucher"));
  return data.result ?? [];
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
