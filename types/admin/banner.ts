import type { AdminListQuery } from "./common";

export type BannerType = "MOVIE" | "EVENT";

export interface AdminBannerMovie {
  movieId: number;
  title: string;
  description: string;
}

export interface AdminBannerEvent {
  id: number;
  title: string;
  description: string;
}

export interface AdminBanner {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  linkUrl: string;
  priority: number;
  active: boolean;
  bannerType: BannerType;
  movies: AdminBannerMovie | null;
  event: AdminBannerEvent | null;
}

export interface BannerCreatePayload {
  imageUrl: string;
  title: string;
  description?: string;
  linkUrl?: string;
  priority?: number;
  active?: boolean;
  movieId?: number;
  eventId?: number;
  bannerType: BannerType;
}

export interface BannerUpdatePayload {
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  priority?: number;
  active?: boolean;
  movieId?: number | null;
  eventId?: number | null;
  bannerType?: BannerType;
}

export interface BannerListQuery extends AdminListQuery {
  bannerType?: BannerType;
  active?: boolean;
  title?: string;
}
