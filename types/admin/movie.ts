import type { EntityStatus, AdminListQuery } from "./common";
import type { AdminPerson } from "./person";
import type { AdminGenre } from "./genre";

export type MovieStatus = "COMING_SOON" | "NOW_SHOWING" | "STOPPED";
export type AgeRating = "G" | "PG" | "PG_13" | "R" | "NC_17";

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

export interface MovieListQuery extends AdminListQuery {
  movieStatus?: MovieStatus;
  genreName?: string;
  title?: string;
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
