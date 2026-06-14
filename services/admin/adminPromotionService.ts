import { adminGet, adminPost, adminPut, adminPutEmpty } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { AdminPromotion } from "@/types/admin/promotion";
import type { PromotionValues } from "@/lib/validations/admin/promotion.schema";

export const adminPromotionService = {
  getPromotions: (token: string, page = 0, size = 10, filter?: string) =>
    adminGet<ApiPagedResult<AdminPromotion>>(token, "/admin/promotions", {
      page, size, sort: "createdAt,desc", filter,
    }),

  getPromotionById: (token: string, id: number) =>
    adminGet<AdminPromotion>(token, `/admin/promotions/${id}`),

  createPromotion: (token: string, data: PromotionValues) =>
    adminPost<AdminPromotion>(token, "/admin/promotions", data),

  updatePromotion: (token: string, id: number, data: PromotionValues) =>
    adminPut<AdminPromotion>(token, `/admin/promotions/${id}`, data),

  publishPromotion: (token: string, id: number) =>
    adminPutEmpty(token, `/admin/promotions/${id}/publish`),

  pausePromotion: (token: string, id: number) =>
    adminPutEmpty(token, `/admin/promotions/${id}/pause`),

  resumePromotion: (token: string, id: number) =>
    adminPutEmpty(token, `/admin/promotions/${id}/resume`),
};
