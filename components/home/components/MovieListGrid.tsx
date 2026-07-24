"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/movie/components/MovieCard";
import { useMovieCarousel } from "@/components/home/hooks/use-movie-carousel";
import type { Movie } from "@/types";

const PAGE_SIZE = 12;

interface MovieListGridProps {
  movieStatus: "showing" | "comingSoon";
  initialMovies: Movie[];
  initialTotalPages: number;
  initialTotalElements: number;
}

export function MovieListGrid({
  movieStatus,
  initialMovies,
  initialTotalPages,
  initialTotalElements,
}: MovieListGridProps) {
  const {
    movies,
    currentPage,
    totalPages,
    totalElements,
    loading,
    canPrev,
    canNext,
    prevPage,
    nextPage,
  } = useMovieCarousel({
    movieStatus,
    initialMovies,
    initialTotalPages,
    initialTotalElements,
    pageSize: PAGE_SIZE,
  });

  const from = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const to = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  if (!loading && movies.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Hiện chưa có phim nào.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="aspect-[2/3]">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
            ))
          : movies.map((movie, i) => (
              <div key={movie.id || i}>
                <MovieCard movie={movie} />
              </div>
            ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 text-sm text-muted-foreground">
          <span>
            {totalElements === 0
              ? "Không có kết quả"
              : `Hiển thị ${from}–${to} trong ${totalElements} phim`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={!canPrev}
              className="rounded-md border border-border bg-background px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="text-foreground font-medium">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={!canNext}
              className="rounded-md border border-border bg-background px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
