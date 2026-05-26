import type {
  AdminSeat,
  SeatSetupPayload,
  SeatUpdatePayload,
  AdminSeatStatusUpdateRequest,
  BlockedShowTime,
  EntityStatus,
} from "@/types/admin.type";
import { adminGet, adminPost, adminPut, adminPutEmpty } from "./adminApiClient";

export async function fetchSeatsByRoom(
  token: string,
  roomId: number
): Promise<AdminSeat[]> {
  return adminGet<AdminSeat[]>(token, `/admin/seats/by-room/${roomId}`);
}

export async function fetchBlockedShowTimesForSeat(
  token: string,
  seatId: number
): Promise<BlockedShowTime[]> {
  return adminGet<BlockedShowTime[]>(token, `/admin/seats/${seatId}/blocked-showtimes`);
}

export async function setupSeatsForRoom(
  token: string,
  roomId: number,
  payload: SeatSetupPayload
): Promise<AdminSeat[]> {
  return adminPost<AdminSeat[]>(token, `/admin/rooms/${roomId}/seats/setup`, payload);
}

export async function updateSeatType(
  token: string,
  roomId: number,
  seatId: number,
  payload: SeatUpdatePayload
): Promise<AdminSeat> {
  return adminPut<AdminSeat>(token, `/admin/rooms/${roomId}/seats/${seatId}`, payload);
}

export async function updateSeatStatus(
  token: string,
  seatId: number,
  request: AdminSeatStatusUpdateRequest
): Promise<AdminSeat> {
  return adminPut<AdminSeat>(token, `/admin/seats/${seatId}/status`, request);
}

export async function activateSeat(token: string, seatId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/seats/${seatId}/activate`);
}

export async function inactivateSeat(token: string, seatId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/seats/${seatId}/inactivate`);
}

export async function toggleSeatEntityStatus(
  token: string,
  seatId: number,
  currentEntityStatus: EntityStatus
): Promise<void> {
  if (currentEntityStatus === "ACTIVE") {
    return inactivateSeat(token, seatId);
  } else {
    return activateSeat(token, seatId);
  }
}

export function buildSeatGridMap(seats: AdminSeat[]): Map<string, AdminSeat> {
  const map = new Map<string, AdminSeat>();
  for (const seat of seats) {
    map.set(`${seat.seatRow}-${seat.seatNumber}`, seat);
  }
  return map;
}
