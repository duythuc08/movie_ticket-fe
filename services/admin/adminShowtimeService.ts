import { adminGet, adminPost, adminPut, adminPutEmpty, adminDelete } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type {
  Showtime,
  ShowtimeDetail,
  ShowTimeProposalRequest,
  ShowTimeProposalResult,
} from "@/types/admin/showtime";
import type { SelectionResponse } from "@/types";
import type { CreateShowtimeValues, UpdateShowtimeValues } from "@/lib/validations/admin/showtime.schema";

export const adminShowtimeService = {
  getShowtimes: async (token: string, page = 0, size = 10, filter?: string) => {
    return adminGet<ApiPagedResult<Showtime>>(token, "/admin/showtimes", { page, size, filter });
  },

  getShowtimesForGantt: async (token: string, cinemaId: number, day: string) => {
    return adminGet<Showtime[]>(token, "/admin/showtimes/gantt", { cinemaId, day });
  },

  getShowtimeDetail: async (token: string, id: number) => {
    return adminGet<ShowtimeDetail>(token, `/admin/showtimes/${id}`);
  },

  createShowtime: async (token: string, data: CreateShowtimeValues) => {
    const { usePricePolicy, prices, ...rest } = data;
    return adminPost<Showtime[]>(token, "/admin/showtimes", {
      ...rest,
      prices: usePricePolicy ? [] : prices,
    });
  },

  updateShowtime: async (token: string, id: number, data: UpdateShowtimeValues) => {
    return adminPut<Showtime>(token, `/admin/showtimes/${id}`, data);
  },

  cancelShowtime: async (token: string, id: number) => {
    return adminPutEmpty(token, `/admin/showtimes/${id}/cancel`);
  },

  getSeatSelection: async (token: string, showTimeId: number) => {
    return adminGet<SelectionResponse>(token, `/seatShowTimes/selection/${showTimeId}`);
  },

  proposeShowtimes: async (token: string, data: ShowTimeProposalRequest) => {
    return adminPost<ShowTimeProposalResult>(token, "/admin/showtimes/propose", data);
  },

  approveDraft: async (token: string, id: number) => {
    return adminPut<Showtime>(token, `/admin/showtimes/${id}/approve`, {});
  },

  approveDraftsByCinemaAndDate: async (token: string, cinemaId: number, day: string) => {
    return adminPut<Showtime[]>(token, `/admin/showtimes/approve-batch?cinemaId=${cinemaId}&day=${day}`, {});
  },

  updateDraftTime: async (token: string, id: number, data: UpdateShowtimeValues) => {
    return adminPut<Showtime>(token, `/admin/showtimes/${id}/draft`, data);
  },

  deleteDraft: async (token: string, id: number) => {
    return adminDelete(token, `/admin/showtimes/${id}/draft`);
  },
};
