import type {
  AdminMovie,
  ApiPagedResult,
  MovieCreatePayload,
  MovieUpdatePayload,
  MovieListQuery,
  EntityStatus,
} from "@/types/admin.type";
import {
  adminGet,
  adminPost,
  adminPut,
  adminPutEmpty,
  buildFilterString,
} from "./adminApiClient";

export async function fetchAdminMovies(
  token: string,
  query: MovieListQuery = {}
): Promise<ApiPagedResult<AdminMovie>> {
  const { page = 0, size = 10, movieStatus, genreName } = query;

  const filterParts: Record<string, string | undefined> = {};

  if (movieStatus) filterParts.movieStatus = movieStatus;
  if (genreName) filterParts["genre.name"] = genreName;

  const filterString = buildFilterString(filterParts);

  const params: Record<string, string | number | undefined> = {
    page,
    size,
    sort: "createdAt,desc",
  };

  if (filterString) {
    params.filter = filterString;
  }

  return adminGet<ApiPagedResult<AdminMovie>>(token, "/admin/movies", params);
}

export async function fetchAdminMovieById(
  token: string,
  movieId: number
): Promise<AdminMovie> {
  return adminGet<AdminMovie>(token, `/admin/movies/${movieId}`);
}

export async function createAdminMovie(
  token: string,
  payload: MovieCreatePayload
): Promise<AdminMovie> {
  const normalizedPayload: MovieCreatePayload = {
    ...payload,
    releaseDate: normalizeToLocalDateTime(payload.releaseDate),
  };

  return adminPost<AdminMovie>(token, "/admin/movies", normalizedPayload);
}

export async function updateAdminMovie(
  token: string,
  movieId: number,
  payload: MovieUpdatePayload
): Promise<AdminMovie> {
  const normalizedPayload: MovieUpdatePayload = {
    ...payload,
    releaseDate: payload.releaseDate
      ? normalizeToLocalDateTime(payload.releaseDate)
      : undefined,
  };

  return adminPut<AdminMovie>(token, `/admin/movies/${movieId}`, normalizedPayload);
}

export async function activateMovie(
  token: string,
  movieId: number
): Promise<void> {
  return adminPutEmpty(token, `/admin/movies/${movieId}/activate`);
}

export async function inactivateMovie(
  token: string,
  movieId: number
): Promise<void> {
  return adminPutEmpty(token, `/admin/movies/${movieId}/inactivate`);
}

export async function stopAdminMovie(
  token: string,
  movieId: number
): Promise<void> {
  return adminPost<void>(token, `/admin/movies/${movieId}/stop`, {});
}

export async function replayAdminMovie(
  token: string,
  movieId: number
): Promise<void> {
  return adminPost<void>(token, `/admin/movies/${movieId}/replay`, {});
}

export async function toggleMovieEntityStatus(
  token: string,
  movieId: number,
  currentEntityStatus: EntityStatus
): Promise<void> {
  if (currentEntityStatus === "ACTIVE") {
    return inactivateMovie(token, movieId);
  } else {
    return activateMovie(token, movieId);
  }
}

function normalizeToLocalDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
