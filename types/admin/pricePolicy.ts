export type RoomTypeValue = "TWO_D" | "THREE_D" | "IMAX" | "PREMIUM";
export type SeatTypeValue = "STANDARD" | "VIP" | "COUPLE" | "AISLE";
export type PriceRuleTypeValue = "WEEKDAY_LIST" | "HOLIDAY" | "DEFAULT";
export type DayOfWeekValue =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface Holiday {
  holidayId: number;
  name: string;
  dateFrom: string;
  dateTo: string;
}

export interface PricePolicy {
  pricePolicyId: number;
  cinemaId: number;
  cinemaName: string;
  name: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricePolicyRule {
  pricePolicyRuleId: number;
  pricePolicyId: number;
  roomType: RoomTypeValue;
  seatType: SeatTypeValue;
  ruleType: PriceRuleTypeValue;
  startHour: string | null;
  endHour: string | null;
  basePrice: number;
  weekdays: DayOfWeekValue[] | null;
  holidays: Holiday[] | null;
}
