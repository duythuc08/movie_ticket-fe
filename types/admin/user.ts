export type UserStatus   = "UNVERIFIED" | "VERIFIED" | "BANNED";
export type EntityStatus = "ACTIVE" | "INACTIVE";

export interface AdminUserRole {
  name: string;
  description?: string;
}

export interface AdminUser {
  userId: string;
  username: string;
  firstname?: string;
  lastname?: string;
  phoneNumber?: string;
  birthday?: string;
  userStatus: UserStatus;
  entityStatus: EntityStatus;
  loyaltyPoints: number;
  memberShipTierName?: string | null;
  roles: AdminUserRole[];
}

export interface LoyaltyHistory {
  historyId: number;
  pointsChange: number;
  description: string;
  oldBalance: number;
  newBalance: number;
  createdAt: string;
  orderId?: number | null;
}
