export type EntityStatus = "ACTIVE" | "INACTIVE";

export interface ApiPagedResult<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface AdminListQuery {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}

export interface DashboardStats {
  totalMovies: number;
  showingToday: number;
  weeklyRevenue: number;
  totalUsers: number;
}

export interface RecentActivity {
  id: number;
  type: "movie_added" | "booking_created" | "user_registered";
  description: string;
  timestamp: string;
}
