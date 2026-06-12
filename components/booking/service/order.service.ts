import type { OrderData } from "@/components/profile/types";
import { apiFetch } from "@/lib/fetchApi";

const BASE_URL = "/api-proxy";

export async function getOrderDetail(orderId: string, token: string): Promise<OrderData> {
  const res = await apiFetch(`${BASE_URL}/orders/${orderId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  if (!data.result) throw new Error(data.message || "Không có dữ liệu");
  return data.result as OrderData;
}
