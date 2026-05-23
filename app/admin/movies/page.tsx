"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@/services/admin/adminMovieService";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";
import { DataTable, PageHeader } from "@/components/shared";
import { MovieFormDialog } from "@/components/admin/movie/MovieFormDialog";
import { MovieDetailDialog } from "@/components/admin/movie/MovieDetailDialog";
import { createMovieColumns } from "@/components/admin/movie/MovieColumns";
import { Button } from "@/components/ui/button";

const MOVIE_STATUS_FILTER = [
  { label: "Đang chiếu",  value: "NOW_SHOWING" },
  { label: "Sắp chiếu",   value: "COMING_SOON" },
  { label: "Ngừng chiếu", value: "STOPPED"     },
];

export default function AdminMoviesPage() {
  const { token } = useAuth();

  const [movies,       setMovies]       = useState<AdminMovie[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isFormOpen,   setIsFormOpen]   = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMovies = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminMovies(token, { page: 0, size: 999 });
      setMovies(result.content);
    } catch {
      toast.error("Không thể tải danh sách phim");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadMovies(); }, [loadMovies]);

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
      loadMovies();
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
      loadMovies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${action} phim`);
    }
  }

  const columns = useMemo(
    () => createMovieColumns({
      onViewDetail:   handleViewDetail,
      onEdit:         handleEditDirect,
      onToggleStatus: handleToggleStatus,
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

      <DataTable
        columns={columns}
        data={movies}
        searchKey="title"
        searchPlaceholder="Tìm theo tên phim..."
        filters={[{
          key:     "movieStatus",
          label:   "Trạng thái chiếu",
          options: MOVIE_STATUS_FILTER,
        }]}
        isLoading={isLoading}
        emptyText="Chưa có phim nào."
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
