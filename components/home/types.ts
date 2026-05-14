import type { Movie, Cinema, QuickBookingSlot, BookingDate, Banner } from "@/types";

export type { Banner as BannerItem };

export interface CarouselState {
  currentIndex: number;
  isPlaying: boolean;
}

export interface QuickBookingState {
  selectedMovie: Movie | null;
  selectedCinema: Cinema | null;
  selectedDate: string | null;
  selectedSlot: QuickBookingSlot | null;
  movies: Movie[];
  cinemas: Cinema[];
  dates: BookingDate[];
  slots: QuickBookingSlot[];
  loadingMovies: boolean;
  loadingCinemas: boolean;
  loadingDates: boolean;
  loadingSlots: boolean;
}
