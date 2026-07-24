"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminMovie } from "@/types/admin.type";
import type { MovieFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAdminMovies,
  createAdminMovie,
  updateAdminMovie,
  toggleMovieEntityStatus,
  stopAdminMovie,
  replayAdminMovie,
} from "@/services/admin/adminMovieService";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";
import { DataTable, PageHeader } from "@/components/shared";
import { MovieFormDialog } from "@/components/admin/movie/MovieFormDialog";
import { MovieDetailDialog } from "@/components/admin/movie/MovieDetailDialog";
import { createMovieColumns } from "@/components/admin/movie/MovieColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const MOVIE_STATUS_FILTER = [
  { label: "Đang chiếu",  value: "NOW_SHOWING" },
  { label: "Sắp chiếu",   value: "COMING_SOON" },
  { label: "Ngừng chiếu", value: "STOPPED"     },
];

const PAGE_SIZE = 10;
const DEFAULT_SORT = "createdAt,desc";

export default function AdminMoviesPage() {
  const { token } = useAuth();

  const [movies,       setMovies]       = useState<AdminMovie[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isFormOpen,   setIsFormOpen]   = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [sort,          setSort]          = useState(DEFAULT_SORT);
  const [movieStatus,   setMovieStatus]   = useState<string | undefined>(undefined);
  const [keywordInput,  setKeywordInput]  = useState("");
  const [keyword,       setKeyword]       = useState("");

  useEffect(() => {
    const t = setTimeout(() => setKeyword(keywordInput), 500);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const loadMovies = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminMovies(token, {
        page: targetPage,
        size: PAGE_SIZE,
        sort,
        movieStatus: movieStatus as AdminMovie["movieStatus"] | undefined,
        title: keyword || undefined,
      });
      setMovies(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách phim");
    } finally {
      setIsLoading(false);
    }
  }, [token, sort, movieStatus, keyword]);

  useEffect(() => { setPage(0); loadMovies(0); }, [loadMovies]);

  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (sorting.length === 0) {
      setSort(DEFAULT_SORT);
    } else {
      setSort(`${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`);
    }
  }, []);

  function handleOpenCreate() {
    setSelectedMovie(null);
    setIsFormOpen(true);
  }

  function handleViewDetail(movie: AdminMovie) {
    setSelectedMovie(movie);
    setIsDetailOpen(true);
  }

  function handleEditDirect(movie: AdminMovie) {
    setSelectedMovie(movie);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: MovieFormSchema) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      let finalPosterUrl = data.posterUrl;

      if (data.posterFile) {
        toast.loading("Đang tải ảnh lên...", { id: "upload" });
        finalPosterUrl = await uploadFileAndGetUrl(token, data.posterFile);
        toast.dismiss("upload");
      }

      const payload = {
        title: data.title, description: data.description, duration: data.duration,
        trailerUrl: data.trailerUrl || undefined, releaseDate: data.releaseDate,
        language: data.language, subTitle: data.subTitle || undefined,
        ageRating: data.ageRating,
        genreName:   data.genreNames,
        directorIds: data.directorIds,
        castIds:     data.castIds,
        posterUrl: finalPosterUrl || undefined,
      };

      if (selectedMovie) {
        await updateAdminMovie(token, selectedMovie.movieId, payload);
        toast.success(`Đã cập nhật phim "${data.title}"`);
      } else {
        await createAdminMovie(token, payload);
        toast.success(`Đã thêm phim "${data.title}"`);
      }

      setIsFormOpen(false);
      setSelectedMovie(null);
      loadMovies(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu phim thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDetailEditSubmit(movie: AdminMovie, data: MovieFormSchema) {
    setSelectedMovie(movie);
    await handleFormSubmit(data);
  }

  async function handleToggleStatus(movie: AdminMovie) {
    if (!token) return;
    const action = movie.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
    try {
      await toggleMovieEntityStatus(token, movie.movieId, movie.entityStatus);
      toast.success(`Đã ${action} phim "${movie.title}"`);
      loadMovies(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${action} phim`);
    }
  }

  async function handleStopMovie(movie: AdminMovie) {
    if (!token) return;
    try {
      await stopAdminMovie(token, movie.movieId);
      toast.success(`Đã tạm dừng phim "${movie.title}"`);
      loadMovies(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạm dừng phim");
    }
  }

  async function handleReplayMovie(movie: AdminMovie) {
    if (!token) return;
    try {
      await replayAdminMovie(token, movie.movieId);
      toast.success(`Đã chiếu lại phim "${movie.title}"`);
      loadMovies(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chiếu lại phim");
    }
  }

  const columns = useMemo(
    () => createMovieColumns({
      onViewDetail:   handleViewDetail,
      onEdit:         handleEditDirect,
      onToggleStatus: handleToggleStatus,
      onStop:         handleStopMovie,
      onReplay:       handleReplayMovie,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Phim"
        description="Thêm, chỉnh sửa và quản lý toàn bộ phim trong hệ thống"
      >
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm phim mới
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên phim..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={movieStatus ?? "__all__"}
          onValueChange={(value) => setMovieStatus(value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Trạng thái chiếu" />
          </SelectTrigger>
          <SelectContent data-admin="">
            {MOVIE_STATUS_FILTER.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="__all__">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={movies}
        isLoading={isLoading}
        emptyText="Chưa có phim nào."
        onSortingChange={handleSortingChange}
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => {
            setPage(newPage);
            loadMovies(newPage);
          },
        }}
      />

      {/* Dialog tạo / chỉnh sửa */}
      <MovieFormDialog
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setSelectedMovie(null);
        }}
        movie={selectedMovie}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Dialog xem chi tiết */}
      <MovieDetailDialog
        open={isDetailOpen}
        onOpenChange={(isOpen) => {
          setIsDetailOpen(isOpen);
          if (!isOpen) setSelectedMovie(null);
        }}
        movie={selectedMovie}
        onEditSubmit={handleDetailEditSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
