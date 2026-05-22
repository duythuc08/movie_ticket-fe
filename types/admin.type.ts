
export type EntityStatus = "ACTIVE" | "INACTIVE";

export type MovieStatus = "COMING_SOON" | "NOW_SHOWING" | "STOPPED";

export type AgeRating = "G" | "PG" | "PG_13" | "R" | "NC_17";

export type MovieRole = "DIRECTOR" | "ACTOR";

export type BannerType = "MOVIE" | "EVENT";

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

export interface AdminGenre {
  genreId: number;
  name: string;
  description: string | null;
  entityStatus: EntityStatus;
}

export interface GenreCreatePayload {
  name: string;
  description?: string;
}

export interface AdminPerson {
  id: number;
  name: string;
  avatarUrl: string | null;
  movieRole: MovieRole;
  entityStatus: EntityStatus;
}

export interface PersonCreatePayload {
  name: string;
  avatarUrl?: string;
  movieRole: MovieRole;
}

export interface AdminMovie {
  movieId: number;
  title: string;
  description: string;
  duration: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string;
  castPersons: AdminPerson[];
  directors: AdminPerson[];
  language: string;
  subTitle: string;
  genre: AdminGenre[];
  ageRating: AgeRating;
  movieStatus: MovieStatus;
  entityStatus: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MovieCreatePayload {
  title: string;
  description: string;
  duration: number;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  castIds: number[];
  directorIds: number[];
  language: string;
  subTitle?: string;
  genreName: string[];
  ageRating: AgeRating;
}

export interface MovieUpdatePayload {
  title?: string;
  description?: string;
  duration?: number;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate?: string;
  castIds?: number[];
  directorIds?: number[];
  language?: string;
  subTitle?: string;
  genreName?: string[];
  ageRating?: AgeRating;
}

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

export interface AdminListQuery {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}

export interface MovieListQuery extends AdminListQuery {
  movieStatus?: MovieStatus;
  genreName?: string;
}

export interface PersonListQuery extends AdminListQuery {
  movieRole?: MovieRole;
  entityStatus?: EntityStatus;
}

export interface GenreListQuery extends AdminListQuery {
  entityStatus?: EntityStatus;
}

export interface MovieFormValues {
  title: string;
  description: string;
  duration: number;
  trailerUrl: string;
  releaseDate: string;
  language: string;
  subTitle: string;
  ageRating: AgeRating;
  genreNames: string[];
  castIds: number[];
  directorIds: number[];
  posterUrl: string;
  posterFile: File | null;
}

export interface GenreFormValues {
  name: string;
  description: string;
}

export interface PersonFormValues {
  name: string;
  avatarUrl: string;
  movieRole: MovieRole;
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
