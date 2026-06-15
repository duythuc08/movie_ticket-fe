export type PromotionType   = "PERCENTAGE" | "FIXED_AMOUNT";
export type PromotionStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "EXPIRED";
export type EventType       = "PREMIERE" | "FESTIVAL" | "SPECIAL_SCREENING" | "PROMOTION";
export type DayOfWeekValue  =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface AdminPromotion {
  promotionId: number;
  code: string;
  name: string;
  description?: string | null;
  type: PromotionType;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  useLimit: number | null;
  usedCount: number;
  isPublic: boolean;
  startTime: string;
  endTime: string;
  applicableMovieIds: number[];
  dayOfWeek: DayOfWeekValue[];
  status: PromotionStatus;
  updatedAt?: string;
}

export interface AdminEvent {
  eventId: number;
  title: string;
  description?: string | null;
  posterUrl?: string | null;
  startTime: string;
  endTime: string;
  eventType: EventType;
  movieId?: number | null;
  movieTitle?: string | null;
  updatedAt?: string;
}
