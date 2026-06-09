import { adminGet, adminPost, adminPut } from "@/services/admin/adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { UserProfile, PublicPromotion, LoyaltyHistory } from "@/types/user-profile";
import type { UserVoucher } from "@/types";

export const userProfileService = {
  getMyInfo: (token: string) =>
    adminGet<UserProfile>(token, "/users/myInfo"),

  updateMyInfo: (token: string, data: {
    password?: string;
    firstname?: string;
    lastname?: string;
    phoneNumber?: string;
    birthday?: string;
  }) => adminPut<UserProfile>(token, "/users/myInfo", data),

  getMyLoyaltyHistory: (token: string, page = 0, size = 10) =>
    adminGet<ApiPagedResult<LoyaltyHistory>>(token, "/users/myLoyaltyHistory", {
      page, size, sort: "createdAt,desc",
    }),

  getMyVouchers: (token: string) =>
    adminGet<UserVoucher[]>(token, "/users/vouchers"),

  getApplicableVouchers: (token: string, movieId?: number, totalAmount?: number) =>
    adminGet<UserVoucher[]>(token, "/users/vouchers/applicable", {
      movieId,
      totalAmount,
    }),

  getAvailablePromotions: (token: string) =>
    adminGet<PublicPromotion[]>(token, "/promotions"),

  claimPromotion: (token: string, promotionId: number) =>
    adminPost<void>(token, `/promotions/${promotionId}/claim`, {}),
};
