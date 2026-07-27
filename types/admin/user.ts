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

export interface GenreProfile {
  genreName: string;
  likedCount: number;
  weightPct: number;
}

export interface RecommendationItem {
  movieId: number;
  title: string;
  posterUrl?: string;
  description?: string;
  duration?: number;
  genres?: string[];
  predictedScore: number;
  neighborCount: number;
  averageRating: number;
  source: string;
}

export interface AdminUserRecommendation {
  genreProfile: GenreProfile[];
  recommendations: RecommendationItem[];
  usedColdStart: boolean;
}

export interface UserReviewHistoryItem {
  reviewId: number;
  movieId: number;
  movieTitle: string;
  posterUrl?: string;
  genres: string[];
  rating: number;
}
