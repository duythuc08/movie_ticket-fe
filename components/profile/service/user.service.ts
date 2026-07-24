import type { UserInfo, MembershipTier, Order } from "@/types";
import { getErrorMessage } from "@/lib/errors";
import { apiFetch, parseJsonSafe } from "@/lib/fetchApi";

const BASE_URL = "/api-proxy";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchMyInfo(token: string): Promise<UserInfo> {
  const res = await apiFetch(`${BASE_URL}/users/myInfo`, { headers: authHeaders(token) });
  const data = await parseJsonSafe(res);
  if (!res.ok || !data) throw new Error(data ? getErrorMessage(data.code, data.message || "Không lấy được thông tin người dùng") : "Lỗi máy chủ");
  return data.result as UserInfo;
}

export async function updateMyInfo(
  token: string,
  payload: { firstname: string; lastname: string; phoneNumber: string; birthday: string }
): Promise<UserInfo> {
  const body: Record<string, string> = {
    firstname:   payload.firstname,
    lastname:    payload.lastname,
    phoneNumber: payload.phoneNumber,
  };
  // Chỉ gửi birthday khi có giá trị hợp lệ — tránh BE parse lỗi LocalDate
  if (payload.birthday) {
    body.birthday = payload.birthday;
  }

  const res = await apiFetch(`${BASE_URL}/users/myInfo`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok || !data) throw new Error(data ? getErrorMessage(data.code, data.message || "Cập nhật thông tin thất bại") : "Lỗi máy chủ");
  return data.result as UserInfo;
}

export async function fetchAllMembershipTiers(token: string): Promise<MembershipTier[]> {
  const res = await apiFetch(`${BASE_URL}/membership-tiers/getAllMembershipTiers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data ? getErrorMessage(data.code, data.message || "Không lấy được danh sách hạng thành viên") : "Lỗi máy chủ");
  if (!data?.result) return [];
  return (data.result as MembershipTier[]).sort(
    (a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0)
  );
}

export async function fetchMembershipTierByName(token: string, tierName: string): Promise<MembershipTier | null> {
  try {
    const res = await apiFetch(`${BASE_URL}/membership-tiers/getMembershipTier/${tierName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseJsonSafe(res);
    if (res.ok && data?.result) return data.result as MembershipTier;
    return null;
  } catch {
    return null;
  }
}

export async function fetchOrdersByUser(token: string, userId: string): Promise<Order[]> {
  const res = await apiFetch(`${BASE_URL}/orders/user/${userId}`, { headers: authHeaders(token) });
  const data = await parseJsonSafe(res);
  if (!res.ok || !data) throw new Error(data ? getErrorMessage(data.code, data.message || "Không lấy được danh sách đơn hàng") : "Lỗi máy chủ");
  return data.result as Order[];
}

export async function retryPaymentUrl(token: string, orderId: string, method: "VNPAY" | "MOMO"): Promise<string> {
  const res = await apiFetch(`${BASE_URL}/payment/retry?orderId=${orderId}&method=${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.result) throw new Error(data ? getErrorMessage(data.code, data.message || "Không thể lấy link thanh toán") : "Lỗi máy chủ");
  return data.result as string;
}
