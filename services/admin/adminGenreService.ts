import type {
  AdminGenre,
  ApiPagedResult,
  GenreCreatePayload,
  GenreListQuery,
  EntityStatus,
} from "@/types/admin.type";
import {
  adminGet,
  adminPost,
  adminPut,
  adminPutEmpty,
  buildFilterString,
  buildLikeFilterString,
  combineFilterStrings,
} from "./adminApiClient";

export async function fetchAdminGenres(
  token: string,
  query: GenreListQuery = {}
): Promise<ApiPagedResult<AdminGenre>> {
  const { page = 0, size = 10, entityStatus, name } = query;

  const filterString = buildFilterString({ entityStatus });
  const nameFilterString = name ? buildLikeFilterString({ name }) : undefined;
  const combinedFilter = combineFilterStrings(filterString, nameFilterString);

  const params: Record<string, string | number | undefined> = {
    page,
    size,
    sort: "createdAt,desc",
  };

  if (combinedFilter) {
    params.filter = combinedFilter;
  }

  return adminGet<ApiPagedResult<AdminGenre>>(token, "/admin/genres", params);
}

export async function fetchAllGenresForSelect(
  token: string
): Promise<AdminGenre[]> {
  const result = await adminGet<ApiPagedResult<AdminGenre>>(
    token,
    "/admin/genres",
    { page: 0, size: 200, sort: "name,asc", filter: buildFilterString({ entityStatus: "ACTIVE" }) }
  );
  return result.content;
}

export async function fetchGenreById(
  token: string,
  genreId: number
): Promise<AdminGenre> {
  return adminGet<AdminGenre>(token, `/admin/genres/${genreId}`);
}

export async function createGenre(
  token: string,
  payload: GenreCreatePayload
): Promise<AdminGenre> {
  return adminPost<AdminGenre>(token, "/admin/genres", payload);
}

export async function updateGenre(
  token: string,
  genreId: number,
  payload: GenreCreatePayload
): Promise<AdminGenre> {
  return adminPut<AdminGenre>(token, `/admin/genres/${genreId}`, payload);
}

export async function activateGenre(
  token: string,
  genreId: number
): Promise<void> {
  return adminPutEmpty(token, `/admin/genres/${genreId}/activate`);
}

export async function inactivateGenre(
  token: string,
  genreId: number
): Promise<void> {
  return adminPutEmpty(token, `/admin/genres/${genreId}/inactivate`);
}

export async function toggleGenreStatus(
  token: string,
  genreId: number,
  currentStatus: EntityStatus
): Promise<void> {
  if (currentStatus === "ACTIVE") {
    return inactivateGenre(token, genreId);
  } else {
    return activateGenre(token, genreId);
  }
}
