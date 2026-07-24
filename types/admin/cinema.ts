import type { EntityStatus, AdminListQuery } from "./common";

export type CinemaStatus = "OPERATIONAL" | "TEMPORARILY_CLOSED";
export type RoomType = "STANDARD" | "VIP" | "IMAX" | "THREE_D";
export type RoomStatus = "OPERATIONAL" | "MAINTENANCE" | "CLEANING";
export type SeatType = "STANDARD" | "VIP" | "COUPLE" | "AISLE";
export type SeatStatus = "NORMAL" | "BROKEN" | "MAINTENANCE";

export interface AdminCinema {
  cinemaId: number;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  cinemaStatus: CinemaStatus;
  entityStatus: EntityStatus;
}

export interface AdminCinemaRoom {
  roomId: number;
  name: string;
  capacity: number;
  roomType: RoomType;
  roomStatus: RoomStatus;
}

export interface AdminCinemaDetail extends AdminCinema {
  rooms: AdminCinemaRoom[];
}

export interface AdminRoom {
  roomId: number;
  name: string;
  capacity: number;
  cinemas: AdminCinema;
  roomType: RoomType;
  roomStatus: RoomStatus;
  entityStatus: EntityStatus;
}

export interface AdminSeat {
  seatId: number;
  seatRow: string;
  seatNumber: number;
  roomId: number;
  seatType: SeatType;
  seatStatus: SeatStatus;
  entityStatus: EntityStatus;
  viewQuanlityScore: number;
}

export interface BlockedShowTime {
  showTimeId: number;
  startTime: string;
  endTime: string;
  roomName: string;
}

export interface CinemaCreatePayload {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  cinemaStatus: CinemaStatus;
}

export interface AdminRoomRequest {
  roomId: number | null;
  name: string;
  capacity: number;
  roomType: RoomType;
  roomStatus: RoomStatus;
}

export interface CinemaUpdatePayload {
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  cinemaStatus?: CinemaStatus;
  rooms?: AdminRoomRequest[];
}

export interface RoomCreatePayload {
  name: string;
  capacity: number;
  cinemas: { cinemaId: number };
  roomType: RoomType;
  roomStatus: RoomStatus;
}

export interface RoomUpdatePayload {
  name?: string;
  capacity?: number;
  roomType?: RoomType;
  roomStatus?: RoomStatus;
}

export interface SeatSetupPayload {
  rows: number;
  cols: number;
  seatTypes: SeatType[][];
}

export interface SeatUpdatePayload {
  seatRow: string;
  seatNumber: number;
  seatTypes: SeatType;
}

export interface AdminSeatStatusUpdateRequest {
  seatStatus: SeatStatus;
  unlockShowTimeIds?: number[];
}

export interface CinemaListQuery extends AdminListQuery {
  cinemaStatus?: CinemaStatus;
  entityStatus?: EntityStatus;
  name?: string;
}

export interface RoomListQuery extends AdminListQuery {
  cinemaId?: number;
  roomType?: RoomType;
  roomStatus?: RoomStatus;
  entityStatus?: EntityStatus;
  name?: string;
}
