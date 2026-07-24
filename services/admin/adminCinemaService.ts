import type {
  AdminCinema,
  AdminCinemaDetail,
  CinemaCreatePayload,
  CinemaUpdatePayload,
  CinemaListQuery,
  CinemaStatus,
  EntityStatus,
} from "@/types/admin.type";
import type { ApiPagedResult } from "@/types/admin.type";
import {
  adminGet,
  adminPost,
  adminPut,
  adminPutEmpty,
  buildFilterString,
  buildLikeFilterString,
  combineFilterStrings,
} from "./adminApiClient";

export async function fetchAdminCinemas(
  token: string,
  query: CinemaListQuery = {}
): Promise<ApiPagedResult<AdminCinema>> {
  const { page = 0, size = 10, cinemaStatus, entityStatus, name } = query;

  const filterString = buildFilterString({
    cinemaStatus: cinemaStatus,
    entityStatus: entityStatus,
  });
  const nameFilterString = name ? buildLikeFilterString({ name }) : undefined;
  const combinedFilter = combineFilterStrings(filterString, nameFilterString);

  const params: Record<string, string | number | undefined> = {
    page,
    size,
    sort: "createdAt,desc",
  };

  if (combinedFilter) params.filter = combinedFilter;

  return adminGet<ApiPagedResult<AdminCinema>>(token, "/admin/cinemas", params);
}

export async function fetchAdminCinemaById(
  token: string,
  cinemaId: number
): Promise<AdminCinemaDetail> {
  return adminGet<AdminCinemaDetail>(token, `/admin/cinemas/${cinemaId}`);
}

export async function fetchCinemasByStatus(
  token: string,
  status: CinemaStatus
): Promise<AdminCinema[]> {
  return adminGet<AdminCinema[]>(token, "/admin/cinemas/by-status", { status });
}

export async function fetchActiveCinemasForSelect(
  token: string
): Promise<AdminCinema[]> {
  const result = await fetchAdminCinemas(token, { page: 0, size: 999 });
  return result.content.filter((c) => c.entityStatus === "ACTIVE");
}

export async function createAdminCinema(
  token: string,
  payload: CinemaCreatePayload
): Promise<AdminCinema> {
  return adminPost<AdminCinema>(token, "/admin/cinemas", payload);
}

export async function updateAdminCinema(
  token: string,
  cinemaId: number,
  payload: CinemaUpdatePayload
): Promise<AdminCinemaDetail> {
  return adminPut<AdminCinemaDetail>(token, `/admin/cinemas/${cinemaId}`, payload);
}

export async function activateCinema(token: string, cinemaId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/cinemas/${cinemaId}/activate`);
}

export async function inactivateCinema(token: string, cinemaId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/cinemas/${cinemaId}/inactivate`);
}

export async function toggleCinemaEntityStatus(
  token: string,
  cinemaId: number,
  currentEntityStatus: EntityStatus
): Promise<void> {
  if (currentEntityStatus === "ACTIVE") {
    return inactivateCinema(token, cinemaId);
  } else {
    return activateCinema(token, cinemaId);
  }
}
