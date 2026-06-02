import { adminPost, adminPut } from "./adminApiClient";

export const adminShowtimePriceService = {
  updateShowTimePrice: async (token: string, showTimePriceId: number, showTimeId: number, price: number) => {
    return adminPut<any>(token, `/admin/showtime-prices/${showTimePriceId}/showtime/${showTimeId}?price=${price}`, null);
  },

  createShowTimePrice: async (token: string, data: any) => {
    return adminPost<any>(token, `/admin/showtime-prices`, data);
  },

  createShowTimePrices: async (token: string, data: any[]) => {
    return adminPost<any>(token, `/admin/showtime-prices/bulk`, data);
  }
};
