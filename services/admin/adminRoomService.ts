import type {
  AdminRoom,
  RoomCreatePayload,
  RoomUpdatePayload,
  EntityStatus,
} from "@/types/admin.type";
import { adminGet, adminPost, adminPut, adminPutEmpty } from "./adminApiClient";

export async function fetchAllRooms(token: string): Promise<AdminRoom[]> {
  return adminGet<AdminRoom[]>(token, "/rooms/getRooms");
}

export async function fetchRoomsByCinema(
  token: string,
  cinemaId: number
): Promise<AdminRoom[]> {
  return adminGet<AdminRoom[]>(token, `/rooms/getRooms/by-cinema/${cinemaId}`);
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
