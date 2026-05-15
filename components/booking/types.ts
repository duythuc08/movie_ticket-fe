export type SeatStatus = "AVAILABLE" | "SOLD" | "SELECTED" | "RESERVED";
export type SeatType = "STANDARD" | "VIP" | "COUPLE";

export interface SelectedSeat {
  seatId: number;
  seatRow: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
  seatShowTimeId: number;
  partnerId?: number | null;
  seatShowTimeStatus: SeatStatus;
}

export interface FoodItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  img: string;
  stock: number;
  isCombo: boolean;
}

export interface SelectedFood {
  id: number;
  foodId: number;
  name: string;
  desc: string;
  price: number;
  img: string;
  qty: number;
  totalPrice: number;
  isCombo: boolean;
}

export interface BookingState {
  movieId?: number;
  movie?: string;
  moviePoster?: string;
  format?: string;
  cinemaId?: number;
  cinema?: string;
  roomName?: string;
  showTimeId?: number;
  date?: string;
  time?: string;
  seats?: SelectedSeat[];
  seatTotal?: number;
  foods?: SelectedFood[];
  foodTotal?: number;
  total?: number;
  orderId?: string;
  promotionCode?: string;
}
