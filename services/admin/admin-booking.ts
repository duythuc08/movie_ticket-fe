import { adminGet, adminPost } from "./adminApiClient";
import type { Order, AdminOrderSummaryResponse, AdminOrderStatsResponse } from "@/types";

import type { ApiPagedResult } from "@/types/admin.type";

export const adminBookingService = {
  getAdminOrders: async (
    token: string,
    page: number,
    size: number,
    status?: string,
    search?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<ApiPagedResult<AdminOrderSummaryResponse>> => {
    let filter = "";
    if (status && status !== "ALL") {
      filter += `orderStatus:'${status}'`;
    }
    if (search) {
      if (filter) filter += " and ";
      filter += `(orderId:'${search}' or fullName~~'*${search}*')`;
    }
    if (fromDate) {
      if (filter) filter += " and ";
      filter += `bookingTime>='${fromDate}T00:00:00'`;
    }
    if (toDate) {
      if (filter) filter += " and ";
      filter += `bookingTime<='${toDate}T23:59:59'`;
    }

    return adminGet<ApiPagedResult<AdminOrderSummaryResponse>>(token, "/admin/orders", {
      page,
      size,
      ...(filter ? { filter } : {}),
    });
  },

  getAdminOrderDetail: async (token: string, orderId: number): Promise<Order> => {
    return adminGet<Order>(token, `/admin/orders/${orderId}`);
  },

  checkinOrder: async (token: string, orderId: number, qrCode: string): Promise<string> => {
    return adminPost<string>(token, `/admin/orders/${orderId}/checkin?qrCode=${encodeURIComponent(qrCode)}`, undefined);
  },

  getAdminOrderStats: async (token: string, from?: string, to?: string): Promise<AdminOrderStatsResponse> => {
    return adminGet<AdminOrderStatsResponse>(token, "/admin/orders/stats", { from, to });
  }
};
