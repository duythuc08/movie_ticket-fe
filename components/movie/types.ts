import type {
  Movie,
  MovieDetail,
  PagedMovieResult,
  ShowtimeDate,
  ShowtimeData,
  ShowtimeEntry,
  CinemaShowtime,
} from "@/types";

export type {
  Movie,
  MovieDetail,
  PagedMovieResult,
  ShowtimeDate,
  ShowtimeData,
  ShowtimeEntry,
  CinemaShowtime,
};

export type MovieStatus = "SHOWING" | "COMING_SOON" | "IMAX" | "ENDED";

export type MovieStatusKey = "showing" | "comingSoon" | "imax";

export interface Genre {
  name: string;
  description?: string;
}

export interface Person {
  id?: number;
  name: string;
  avatarUrl?: string;
}

export interface MovieDetailState {
  movie: MovieDetail | null;
  showtimes: ShowtimeData[];
  selectedDateIndex: number;
  loading: boolean;
  loadingShowtimes: boolean;
  error: string | null;
}
