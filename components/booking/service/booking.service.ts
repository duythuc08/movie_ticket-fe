import type { SeatShowTime, FoodProduct, SelectionResponse } from "@/types";

const BASE_URL = "/api-proxy";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchSeatSelection(showTimeId: number, token: string): Promise<SelectionResponse> {
  const res = await fetch(
    `${BASE_URL}/seatShowTimes/selection/${showTimeId}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Lỗi kết nối API selection");
  const data = await res.json();
  return data.result as SelectionResponse;
}

export async function getFoods(token: string, cinemaId: number): Promise<FoodProduct[]> {
  const res = await fetch(`${BASE_URL}/foods?cinemaId=${cinemaId}`, { headers: authHeaders(token) });
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

export async function createPayment(
  token: string,
  payload: VnpayBookingPayload
): Promise<{ orderId: string; paymentUrl: string; finalPrice: number; discountAmount: number; [key: string]: unknown }> {
  const res = await fetch(`${BASE_URL}/payment/create-vnpay-booking`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.code !== 1000) throw new Error(data.message || "Tạo thanh toán VNPAY thất bại");
  return data.result;
}
