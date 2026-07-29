import { adminDelete, adminGet, adminPost, adminPut } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { Holiday } from "@/types/admin/pricePolicy";
import type { HolidayValues } from "@/lib/validations/admin/pricePolicy.schema";

export const adminHolidayService = {
  getHolidays: (token: string, page = 0, size = 50, filter?: string) =>
    adminGet<ApiPagedResult<Holiday>>(token, "/admin/holidays", {
      page, size, sort: "dateFrom,asc", filter,
    }),

  createHoliday: (token: string, data: HolidayValues) =>
    adminPost<Holiday>(token, "/admin/holidays", data),

  updateHoliday: (token: string, id: number, data: HolidayValues) =>
    adminPut<Holiday>(token, `/admin/holidays/${id}`, data),

  deleteHoliday: (token: string, id: number) =>
    adminDelete(token, `/admin/holidays/${id}`),
};
