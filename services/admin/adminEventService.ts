import { adminGet, adminPost, adminPut, adminDelete } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { AdminEvent } from "@/types/admin/promotion";
import type { EventValues } from "@/lib/validations/admin/promotion.schema";

export const adminEventService = {
  getEvents: (token: string, page = 0, size = 10, filter?: string) =>
    adminGet<ApiPagedResult<AdminEvent>>(token, "/admin/events", {
      page, size, sort: "startTime,desc", filter,
    }),

  getEventById: (token: string, id: number) =>
    adminGet<AdminEvent>(token, `/admin/events/${id}`),

  createEvent: (token: string, data: EventValues) =>
    adminPost<AdminEvent>(token, "/admin/events", data),

  updateEvent: (token: string, id: number, data: EventValues) =>
    adminPut<AdminEvent>(token, `/admin/events/${id}`, data),

  deleteEvent: (token: string, id: number) =>
    adminDelete(token, `/admin/events/${id}`),
};
