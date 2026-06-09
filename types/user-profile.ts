import type { PromotionType, DayOfWeekValue } from "@/types/admin/promotion";

export interface UserProfile {
  userId: string;
  username: string;
  firstname?: string;
  lastname?: string;
  phoneNumber?: string;
  birthday?: string;
  loyaltyPoints: number;
  memberShipTierName?: string | null;
}

export interface PublicPromotion {
  promotionId: number;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  useLimit: number | null;
  usedCount: number;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeekValue[];
  applicableMovieIds: number[];
}

export type { UserVoucher } from "@/types";
export type { LoyaltyHistory } from "@/types/admin/user";
