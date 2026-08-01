"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectWithSearch } from "@/components/shared/multi-select";
import { Search, Film, Clapperboard, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { fetchAllGenresForSelect } from "@/services/admin/adminGenreService";
import type { AdminMovie, AdminGenre } from "@/types/admin.type";
import { cn } from "@/lib/utils";
import { GENRE_LABELS } from "@/components/movie/constants/movie.constants";

const AGE_RATING_LABEL: Record<string, string> = {
  G: "G",
  PG: "PG",
  PG_13: "PG-13",
  R: "R",
  NC_17: "NC-17",
};

export interface MovieSelectorValue {
  movieId: number;
  title: string;
  duration: number;
  posterUrl: string | null;
}

interface MovieSelectorDialogSingleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "single";
  value?: number | null;
  onSelect: (movie: MovieSelectorValue) => void;
  /** Chỉ những phim đang chiếu/sắp chiếu là chọn được — mặc định true. Đặt false để hiện cả phim ngừng chiếu. */
  excludeStopped?: boolean;
  /** movieId cần ẩn hẳn khỏi danh sách (VD phim đã chọn cho phòng này rồi, tránh chọn trùng). */
  excludeMovieIds?: number[];
}

interface MovieSelectorDialogMultiProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "multi";
  value?: number[];
  onConfirm: (movies: MovieSelectorValue[]) => void;
  excludeStopped?: boolean;
  /** movieId cần ẩn hẳn khỏi danh sách (VD phim đã chọn cho phòng này rồi, tránh chọn trùng). */
  excludeMovieIds?: number[];
}

type MovieSelectorDialogProps = MovieSelectorDialogSingleProps | MovieSelectorDialogMultiProps;

function toSelectorValue(m: AdminMovie): MovieSelectorValue {
  return { movieId: m.movieId, title: m.title, duration: m.duration, posterUrl: m.posterUrl };
}

export function MovieSelectorDialog(props: MovieSelectorDialogProps) {
  const { open, onOpenChange, excludeStopped = true, excludeMovieIds = [] } = props;
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [nowShowing, setNowShowing] = useState<AdminMovie[]>([]);
  const [comingSoon, setComingSoon] = useState<AdminMovie[]>([]);
  const [stopped, setStopped] = useState<AdminMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [multiSelected, setMultiSelected] = useState<Map<number, AdminMovie>>(new Map());

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedGenres([]);
    if (props.mode === "multi") {
      setMultiSelected(new Map());
    }
  }, [open, props.mode]);

  useEffect(() => {
    if (!open || !token) return;
    fetchAllGenresForSelect(token).then(setGenres).catch(() => {});
  }, [open, token]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setIsLoading(true);

    const query = { size: 100, sort: "releaseDate,desc", title: search || undefined };

    Promise.all([
      fetchAdminMovies(token, { ...query, movieStatus: "NOW_SHOWING" }),
      fetchAdminMovies(token, { ...query, movieStatus: "COMING_SOON" }),
      excludeStopped ? Promise.resolve({ content: [] }) : fetchAdminMovies(token, { ...query, movieStatus: "STOPPED" }),
    ])
      .then(([nowRes, soonRes, stoppedRes]) => {
        if (cancelled) return;
        setNowShowing(nowRes.content);
        setComingSoon(soonRes.content);
        setStopped(stoppedRes.content);
      })
      .catch(() => {})
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [open, token, search, excludeStopped]);

  const genresInUse = useMemo(() => {
    const names = new Set(
      [...nowShowing, ...comingSoon, ...stopped].flatMap((m) => m.genre.map((g) => g.name)).filter(Boolean),
    );
    const seen = new Set<string>();
    return genres.filter((g) => {
      if (!g.name || !names.has(g.name) || seen.has(g.name)) return false;
      seen.add(g.name);
      return true;
    });
  }, [genres, nowShowing, comingSoon, stopped]);

  const genreOptions = useMemo(
    () => genresInUse.map((g) => ({
      value: g.name,
      label: GENRE_LABELS[g.name.toUpperCase()] ?? g.name,
    })),
    [genresInUse],
  );

  const excludeIdSet = useMemo(() => new Set(excludeMovieIds), [excludeMovieIds]);

  const filterByGenre = (movies: AdminMovie[]) => {
    let result = movies;
    if (excludeIdSet.size > 0) {
      result = result.filter((m) => !excludeIdSet.has(m.movieId));
    }
    if (selectedGenres.length > 0) {
      result = result.filter((m) => m.genre.some((g) => selectedGenres.includes(g.name)));
    }
    return result;
  };

  const filteredNowShowing = useMemo(
    () => filterByGenre(nowShowing),
    [nowShowing, selectedGenres, excludeIdSet],
  );
  const filteredComingSoon = useMemo(
    () => filterByGenre(comingSoon),
    [comingSoon, selectedGenres, excludeIdSet],
  );
  const filteredStopped = useMemo(() => filterByGenre(stopped), [stopped, selectedGenres, excludeIdSet]);

  const handlePick = (movie: AdminMovie) => {
    if (props.mode === "multi") {
      setMultiSelected((prev) => {
        const next = new Map(prev);
        if (next.has(movie.movieId)) next.delete(movie.movieId);
        else next.set(movie.movieId, movie);
        return next;
      });
      return;
    }
    props.onSelect(toSelectorValue(movie));
    onOpenChange(false);
  };

  const selectedSingleId = props.mode !== "multi" ? props.value : undefined;

  const noResults =
    filteredNowShowing.length === 0 && filteredComingSoon.length === 0 && filteredStopped.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-4xl max-h-[88vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0 flex flex-row items-center justify-between space-y-0">
          <DialogTitle>Chọn phim{props.mode === "multi" ? " (có thể chọn nhiều)" : ""}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="px-6 py-4 border-b flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên phim..."
              className="!pl-9"
            />
          </div>
          <MultiSelectWithSearch
            options={genreOptions}
            selectedValues={selectedGenres}
            onChange={setSelectedGenres}
            placeholder="Lọc theo thể loại..."
            searchPlaceholder="Tìm thể loại..."
            className="sm:w-64 shrink-0"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Đang tải danh sách phim...</div>
          ) : (
            <>
              <MovieGroupTable
                icon={<Clapperboard className="h-4 w-4" />}
                title="Đang chiếu"
                movies={filteredNowShowing}
                mode={props.mode ?? "single"}
                selectedSingleId={selectedSingleId}
                selectedMultiIds={multiSelected}
                onPick={handlePick}
              />
              <MovieGroupTable
                icon={<Film className="h-4 w-4" />}
                title="Sắp chiếu"
                movies={filteredComingSoon}
                mode={props.mode ?? "single"}
                selectedSingleId={selectedSingleId}
                selectedMultiIds={multiSelected}
                onPick={handlePick}
              />
              {!excludeStopped && (
                <MovieGroupTable
                  icon={<Film className="h-4 w-4" />}
                  title="Ngừng chiếu"
                  movies={filteredStopped}
                  mode={props.mode ?? "single"}
                  selectedSingleId={selectedSingleId}
                  selectedMultiIds={multiSelected}
                  onPick={handlePick}
                />
              )}
              {noResults && (
                <div className="text-center py-16 text-muted-foreground text-sm">Không tìm thấy phim phù hợp.</div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MovieGroupTable({
  icon,
  title,
  movies,
  mode,
  selectedSingleId,
  selectedMultiIds,
  onPick,
}: {
  icon: React.ReactNode;
  title: string;
  movies: AdminMovie[];
  mode: "single" | "multi";
  selectedSingleId?: number | null;
  selectedMultiIds: Map<number, AdminMovie>;
  onPick: (movie: AdminMovie) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (movies.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-sm font-semibold text-foreground mb-3 select-none"
      >
        {icon}
        {title}
        <Badge variant="secondary" className="font-normal">{movies.length}</Badge>
        <span className="ml-auto text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {isOpen && (
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
              <th className="w-10 px-3 py-2 text-left font-medium">#</th>
              <th className="w-14 px-3 py-2 text-left font-medium">Poster</th>
              <th className="px-3 py-2 text-left font-medium">Phim</th>
              <th className="w-24 px-3 py-2 text-left font-medium">Thời lượng</th>
              <th className="w-28 px-3 py-2 text-left font-medium">Phát hành</th>
              <th className="w-20 px-3 py-2 text-left font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, idx) => {
              const isSelected = mode === "multi" ? selectedMultiIds.has(movie.movieId) : selectedSingleId === movie.movieId;
              return (
                <tr
                  key={movie.movieId}
                  onClick={() => onPick(movie)}
                  className={cn(
                    "cursor-pointer border-t transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/40",
                  )}
                >
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="relative w-9 h-13 rounded overflow-hidden bg-muted shrink-0">
                      {movie.posterUrl ? (
                        <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                      <div>
                        <p className="font-medium text-foreground leading-tight">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">{movie.genre.map((g) => GENRE_LABELS[g.name.toUpperCase()] ?? g.name).join(" · ") || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{movie.duration} phút</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(movie.releaseDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-[10px]">
                      {AGE_RATING_LABEL[movie.ageRating] ?? movie.ageRating}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
