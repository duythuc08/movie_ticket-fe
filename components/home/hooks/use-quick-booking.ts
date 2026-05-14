"use client";

import { useState, useCallback, useEffect } from "react";
import type { BookingDate, Cinema, Movie, QuickBookingSlot } from "@/types";
import {
  fetchNowShowingMovies,
  fetchCinemasByMovieId,
  fetchDatesByCinemaAndMovie,
  fetchSlotsByCinemaMovieDate,
} from "@/components/home/service/quick-booking.service";
import {
  get6DayWindow,
  formatDateLabel,
  filterExpiredShowtimes,
} from "@/components/home/utils/home.utils";

export function useQuickBooking() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [dates, setDates] = useState<BookingDate[]>([]);
  const [slots, setSlots] = useState<QuickBookingSlot[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<QuickBookingSlot | null>(null);

  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchNowShowingMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoadingMovies(false));
  }, []);

  const handleMovieChange = useCallback(
    async (movieId: string) => {
      const movie = movies.find((m) => m.id.toString() === movieId) ?? null;
      setSelectedMovie(movie);
      setSelectedCinema(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setCinemas([]);
      setDates([]);
      setSlots([]);
      if (!movie) return;
      setLoadingCinemas(true);
      try {
        const data = await fetchCinemasByMovieId(movie.id);
        setCinemas(data);
      } finally {
        setLoadingCinemas(false);
      }
    },
    [movies]
  );

  const handleCinemaChange = useCallback(
    async (cinemaId: string) => {
      const cinema = cinemas.find((c) => c.id.toString() === cinemaId) ?? null;
      setSelectedCinema(cinema);
      setSelectedDate(null);
      setSelectedSlot(null);
      setDates([]);
      setSlots([]);
      if (!cinema || !selectedMovie) return;
      setLoadingDates(true);
      try {
        const rawDates = await fetchDatesByCinemaAndMovie(cinema.id, selectedMovie.id);
        const window6 = new Set(get6DayWindow());
        const bookingDates: BookingDate[] = rawDates
          .filter((d) => window6.has(d))
          .map((d) => ({ value: d, label: formatDateLabel(d) }));
        setDates(bookingDates);
      } finally {
        setLoadingDates(false);
      }
    },
    [cinemas, selectedMovie]
  );

  const handleDateChange = useCallback(
    async (dateValue: string) => {
      setSelectedDate(dateValue || null);
      setSelectedSlot(null);
      setSlots([]);
      if (!dateValue || !selectedCinema || !selectedMovie) return;
      setLoadingSlots(true);
      try {
        const data = await fetchSlotsByCinemaMovieDate(
          selectedCinema.id,
          selectedMovie.id,
          dateValue
        );
        setSlots(filterExpiredShowtimes(data, dateValue));
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedCinema, selectedMovie]
  );

  const handleSlotChange = useCallback(
    (slotId: string) => {
      const slot = slots.find((s) => s.showTimeId.toString() === slotId) ?? null;
      setSelectedSlot(slot);
    },
    [slots]
  );

  return {
    movies,
    cinemas,
    dates,
    slots,
    selectedMovie,
    selectedCinema,
    selectedDate,
    selectedSlot,
    loadingMovies,
    loadingCinemas,
    loadingDates,
    loadingSlots,
    handleMovieChange,
    handleCinemaChange,
    handleDateChange,
    handleSlotChange,
    canBook: !!(selectedMovie && selectedCinema && selectedDate && selectedSlot),
  };
}
