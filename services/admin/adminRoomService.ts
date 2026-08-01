import type {
  AdminRoom,
  RoomCreatePayload,
  RoomUpdatePayload,
  EntityStatus,
  RoomListQuery,
  ApiPagedResult,
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

export async function fetchAdminRooms(
  token: string,
  query: RoomListQuery = {}
): Promise<ApiPagedResult<AdminRoom>> {
  const { page = 0, size = 10, cinemaId, roomType, roomStatus, entityStatus, name } = query;

  const filterString = buildFilterString({
    "cinemas.cinemaId": cinemaId != null ? `${cinemaId}` : undefined,
    roomType,
    roomStatus,
    entityStatus,
  });
  const nameFilterString = name ? buildLikeFilterString({ name }) : undefined;
  const combinedFilter = combineFilterStrings(filterString, nameFilterString);

  const params: Record<string, string | number | undefined> = {
    page,
    size,
    sort: "createdAt,desc",
  };

  if (combinedFilter) params.filter = combinedFilter;

  return adminGet<ApiPagedResult<AdminRoom>>(token, "/admin/rooms", params);
}

export async function fetchAdminRoomById(
  token: string,
  roomId: number
): Promise<AdminRoom> {
  return adminGet<AdminRoom>(token, `/admin/rooms/${roomId}`);
}

export async function createAdminRoom(
  token: string,
  payload: RoomCreatePayload
): Promise<AdminRoom> {
  return adminPost<AdminRoom>(token, "/admin/rooms", payload);
}

export async function updateAdminRoom(
  token: string,
  roomId: number,
  payload: RoomUpdatePayload
): Promise<AdminRoom> {
  return adminPut<AdminRoom>(token, `/admin/rooms/${roomId}`, payload);
}

export async function activateRoom(token: string, roomId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/rooms/${roomId}/activate`);
}

export async function inactivateRoom(token: string, roomId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/rooms/${roomId}/inactivate`);
}

export async function toggleRoomEntityStatus(
  token: string,
  roomId: number,
  currentEntityStatus: EntityStatus
): Promise<void> {
  if (currentEntityStatus === "ACTIVE") {
    return inactivateRoom(token, roomId);
  } else {
    return activateRoom(token, roomId);
  }
}
