export const STATUS_LABELS: Record<string, string> = {
  SHOWING: "Đang chiếu",
  COMING_SOON: "Sắp chiếu",
  IMAX: "IMAX",
  ENDED: "Đã kết thúc",
};

export const AGE_RATING_LABELS: Record<string, string> = {
  P: "Mọi lứa tuổi",
  C13: "Từ 13 tuổi",
  C16: "Từ 16 tuổi",
  C18: "Từ 18 tuổi",
};

export const AGE_RATING_COLORS: Record<string, string> = {
  P: "bg-green-500 text-white",
  C13: "bg-yellow-500 text-white",
  C16: "bg-orange-500 text-white",
  C18: "bg-red-600 text-white",
};

export const STATUS_COLORS: Record<string, string> = {
  SHOWING: "bg-primary/10 text-primary border-primary/30",
  COMING_SOON: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  IMAX: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  ENDED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

export const MOVIE_PAGE_SIZE = 4;

export const SHOWTIME_DATE_WINDOW = 6;
