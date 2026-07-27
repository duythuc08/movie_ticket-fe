// ─── Movie ───────────────────────────────────────────────
export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  duration: number;
  durationText: string;
  poster: string;
  trailer: string;
  releaseDate: string;
  cast: string[];
  director: string | null;
  language: string;
  subTitle: string;
  genres: string[];
  genreDescriptions: string[];
  ageRating: string;
  status: string;
}

export interface MovieDetail {
  id: number;
  title: string;
  synopsis: string;
  duration: string;
  releaseDate: string;
  poster: string;
  trailerUrl: string;
  directors: { id?: number; name: string }[];
  cast: { id?: number; name: string; avatarUrl?: string }[];
  genres: string[];
  language: string;
  subTitle: string;
  ageRating: string;
  status: string;
  hasReviewed?: boolean;
}

// ─── Banner ───────────────────────────────────────────────
export interface Banner {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  linkUrl: string;
  priority: number;
  active: boolean;
  bannerType: string;
  movie: { id: number; title: string; description: string } | null;
  event: { id: number; title: string; description: string } | null;
}

// ─── Showtime ─────────────────────────────────────────────
export interface ShowtimeDate {
  date: Date;
  label: string;
}

export interface ShowtimeEntry {
  id: number;
  time: string;
  roomName: string;
}

export interface CinemaShowtime {
  cinemaId: number;
  name: string;
  location: string;
  times: ShowtimeEntry[];
}

export interface ShowtimeData {
  date: string;
  cinemas: CinemaShowtime[];
}

// ─── Voucher (user-facing) ───────────────────────────────
export type PromotionType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface UserVoucher {
  voucherId: number;
  promotionId: number;
  code: string;
  name: string;
  description?: string | null;
  type: PromotionType;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  startTime: string;
  endTime: string;
  dayOfWeek: string[];
  applicableMovieIds: number[];
  claimedAt?: string;
  eligible: boolean | null;
}

// ─── Booking ──────────────────────────────────────────────
export interface SeatDetail {
  seatId: number;
  seatRow: string;
  seatNumber: number;
  seatType: string;
  price: number;
  seatShowTimeId?: number;
  partnerId?: number;
  seatShowTimeStatus?: string;
}

export interface FoodDetail {
  id: number;
  foodId: number;
  name: string;
  desc?: string;
  price: number;
  img?: string;
  qty: number;
  totalPrice: number;
  isCombo?: boolean;
}

export interface BookingState {
  movieId?: number;
  movie?: string;
  movieDuration?: string;
  moviePoster?: string;
  cinemaId?: number;
  cinema?: string;
  location?: string;
  time?: string;
  showTimeId?: number;
  date?: string;
  roomName?: string;
  seats?: SeatDetail[];
  seatTotal?: number;
  foods?: FoodDetail[];
  foodTotal?: number;
  total?: number;
  promotionCode?: string;
  orderId?: number | string;
  expiredTime?: string;
  bookingStartTime?: string;
}

// ─── Food ─────────────────────────────────────────────────
export interface FoodProduct {
  id: number;
  name: string;
  desc: string;
  price: number;
  img: string;
  stock: number;
  isCombo: boolean;
}

// ─── Seat ─────────────────────────────────────────────────
export interface SeatShowTime {
  seatId: number;
  seatRow: string;
  seatNumber: number;
  seatType: string;
  seatShowTimeStatus: string;
  seatShowTimeId?: number;
  partnerId?: number;
  userId?: string | null;
}

export interface SuggestedSeat {
  seatShowTimeId: number;
  seatRow: string;
  seatNumber: number;
  seatType: string;
  viewQuanlityScore: number;
}

export interface SelectionResponse {
  seats: SeatShowTime[];
  pricingMap: Record<string, number>;
  suggested: SuggestedSeat[];
}

// ─── Order ────────────────────────────────────────────────
export interface OrderTicket {
  orderTicketId: number;
  seatName: string;
  seatType: string;
  price: number;
}

export interface OrderFood {
  foodId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShowTimeInfo {
  movieName: string | null;
  moviePosterUrl: string | null;
  roomName: string | null;
  showTime: string | null;
  cinemaName: string | null;
  cinemaAddress: string | null;
}

export interface PaymentResponse {
  paymentId: number;
  transactionId: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentStatus: string;
}

export interface AdminOrderSummaryResponse {
  orderId: number;
  fullName: string;
  movieName: string | null;
  cinemaName: string | null;
  showTime: string | null;
  ticketCount: number;
  finalPrice: number;
  orderStatus: string;
  bookingTime: string;
}

export interface AdminOrderStatsResponse {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  expiredOrders: number;
  usedOrders: number;
}

export interface Order {
  orderId: number;
  userId: string | null;
  fullName: string;
  orderStatus: string;
  bookingTime: string;
  expiredTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  totalTicketPrice: number;
  totalFoodPrice: number;
  discountAmount: number;
  memberDiscountAmount: number | null;
  finalPrice: number;
  promotionCode: string | null;
  qrCode: string | null;
  pointsEarned: number;
  tickets: OrderTicket[];
  foods: OrderFood[];
  showTimeInfo: ShowTimeInfo | null;
  payment: PaymentResponse | null;
}

// ─── Pagination ────────────────────────────────────────────
export interface PagedMovieResult {
  movies: Movie[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

// ─── Quick Booking ─────────────────────────────────────────
export interface Cinema {
  id: number;
  name: string;
  address: string;
}

export interface QuickBookingSlot {
  showTimeId: number;
  startTime: string;
  roomName: string;
  roomType: string;
}

export interface BookingDate {
  value: string;  // "YYYY-MM-DD"
  label: string;  // "Hôm nay (27/03)" | "Thứ 7 (28/03)"
}

// ─── User ─────────────────────────────────────────────────
export interface UserInfo {
  userId: string;
  username: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  birthday: string | null;
  memberShipTierName: string;
  loyaltyPoints: number;
}

export interface MembershipTier {
  name: string;
  pointsRequired: number;
  discountPercent: number;
  birthdayDiscount: number;
}
