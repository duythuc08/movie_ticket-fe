
export interface OrderShowTimeInfo {
  movieName?: string | null;
  moviePosterUrl?: string | null;
  roomName?: string | null;
  showTime?: string | null;
  cinemaName?: string | null;
  cinemaAddress?: string | null;
}

export interface OrderData {
  orderId: string;
  qrCode?: string;
  bookingTime?: string;
  fullName?: string;
  totalTicketPrice?: number;
  totalFoodPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  promotionCode?: string;
  showTimeInfo?: OrderShowTimeInfo | null;
  tickets?: { seatName: string; seatType: string; price: number; roomName?: string; movieName?: string; showTime?: string }[];
  foods?: { name: string; quantity: number; totalPrice: number }[];
  payment?: { paymentType?: string } | null;
}

export interface OrderExtraInfo {
  movie?: string;
  moviePoster?: string;
  format?: string;
  cinema?: string;
  roomName?: string;
  date?: string;
  time?: string;
  paymentMethod?: string;
}


export interface AttemptedOrderInfo {
  movie?: string;
  moviePoster?: string;
  cinema?: string;
  roomName?: string;
  time?: string;
  date?: string;
  paymentMethod?: string;
  finalPrice?: number;
  totalAmount?: number;
}
