"use client";

import { useState, useEffect, useCallback } from "react";
import type { MovieDetail, ShowtimeData, ShowtimeDate } from "@/types";
import {
  fetchMovieDetail,
  fetchShowtimesByDate,
} from "@/components/movie/service/movie.service";

const WEEKDAY_LABELS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function buildShowtimeDates(): ShowtimeDate[] {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const label =
      i === 0
        ? `Hôm nay (${dd}/${mm})`
        : `${WEEKDAY_LABELS[d.getDay()]} (${dd}/${mm})`;
    return { date: d, label };
  });
}

interface UseMovieDetailReturn {
  movie: MovieDetail | null;
  showtimes: ShowtimeData[];
  showtimeDates: ShowtimeDate[];
  selectedDateIndex: number;
  loading: boolean;
  loadingShowtimes: boolean;
  error: string | null;
  selectDate: (index: number) => void;
}

export function useMovieDetail(movieId: string): UseMovieDetailReturn {
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [showtimes, setShowtimes] = useState<ShowtimeData[]>([]);
  const [showtimeDates] = useState<ShowtimeDate[]>(buildShowtimeDates);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which date indices have completed fetching — dùng để derive loadingShowtimes
  // Tránh setState sync trong effect body
  const [loadedDateIndices, setLoadedDateIndices] = useState<Set<number>>(new Set());

  // Derived: true nếu date hiện tại chưa fetch xong
  const loadingShowtimes = !loadedDateIndices.has(selectedDateIndex);

  // Effect 1: fetch movie detail — chỉ setState trong async callback
  useEffect(() => {
    let cancelled = false;
    fetchMovieDetail(movieId)
      .then((data) => {
        if (!cancelled) {
          setMovie(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Không thể tải thông tin phim.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [movieId]);

  // Effect 2: fetch showtimes — không có setState sync trong body
  useEffect(() => {
    const entry = showtimeDates[selectedDateIndex];
    if (!entry) return;

    const { date, label } = entry;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const startStr = start.toISOString().replace(".000Z", "");
    const endStr = end.toISOString().replace(".000Z", "");

    let cancelled = false;

    fetchShowtimesByDate(movieId, startStr, endStr, label)
      .then((data) => {
        if (!cancelled) {
          setShowtimes((prev) => {
            const next = [...prev];
            next[selectedDateIndex] = data;
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        // Chỉ setState trong async callback — không sync
        if (!cancelled) {
          setLoadedDateIndices((prev) => new Set([...prev, selectedDateIndex]));
        }
      });

    return () => { cancelled = true; };
  }, [selectedDateIndex, movieId]);

  const selectDate = useCallback((index: number) => {
    setSelectedDateIndex(index);
  }, []);

  return {
    movie,
    showtimes,
    showtimeDates,
    selectedDateIndex,
    loading,
    loadingShowtimes,
    error,
    selectDate,
  };
}
