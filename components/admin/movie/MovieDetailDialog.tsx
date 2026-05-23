"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Pencil, ExternalLink } from "lucide-react";
import type { AdminMovie } from "@/types/admin.type";
import { MovieFormDialog } from "./MovieFormDialog";
import type { MovieFormSchema } from "@/lib/validations/admin.schemas";

const MOVIE_STATUS_MAP: StatusMap = {
  NOW_SHOWING: { label: "Đang chiếu",  variant: "success"   },
  COMING_SOON: { label: "Sắp chiếu",   variant: "default"   },
  STOPPED:     { label: "Ngừng chiếu", variant: "secondary" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE:   { label: "Đang hoạt động", variant: "success"   },
  INACTIVE: { label: "Vô hiệu",        variant: "secondary" },
};

const AGE_RATING_LABELS: Record<string, string> = {
  G: "G", PG: "PG", PG_13: "PG-13", R: "R", NC_17: "NC-17",
};

interface MovieDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: AdminMovie | null;
  onEditSubmit: (movie: AdminMovie, data: MovieFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function MovieDetailDialog({
  open,
  onOpenChange,
  movie,
  onEditSubmit,
  isSubmitting,
}: MovieDetailDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  if (!movie) return null;

  function handleClose(isOpen: boolean) {
    if (!isOpen) setIsEditMode(false);
    onOpenChange(isOpen);
  }

  async function handleEditSubmit(data: MovieFormSchema) {
    await onEditSubmit(movie!, data);
    setIsEditMode(false);
  }

  const releaseDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
    : "—";

  return (
    <>
      {/* View mode */}
      <Dialog open={open && !isEditMode} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl leading-tight pr-4">
                {movie.title}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="shrink-0 gap-1.5"
              >
                <Pencil size={13} /> Chỉnh sửa
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[160px_1fr] mt-2">
            {/* Poster */}
            <div className="flex flex-col items-center gap-3">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
                {movie.posterUrl ? (
                  <Image src={movie.posterUrl} alt={movie.title} width={160} height={240}
                    className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    Không có ảnh
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <StatusBadge status={movie.movieStatus} statusMap={MOVIE_STATUS_MAP} />
                <StatusBadge status={movie.entityStatus} statusMap={ENTITY_STATUS_MAP} />
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DetailItem label="Thời lượng"  value={`${movie.duration} phút`} />
                <DetailItem label="Ngôn ngữ"    value={movie.language} />
                <DetailItem label="Phụ đề"      value={movie.subTitle || "—"} />
                <DetailItem label="Phân loại"   value={AGE_RATING_LABELS[movie.ageRating] ?? movie.ageRating} />
                <DetailItem label="Ngày ra mắt" value={releaseDate} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Thể loại</p>
                <div className="flex flex-wrap gap-1.5">
                  {(movie.genre ?? []).length > 0 ? (
                    movie.genre.map((g) => (
                      <span key={g.genreId}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary border border-primary/20">
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa có</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Đạo diễn</p>
                <p className="text-sm">{(movie.directors ?? []).map((d) => d.name).join(", ") || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Diễn viên</p>
                <p className="text-sm leading-relaxed">{(movie.castPersons ?? []).map((c) => c.name).join(", ") || "—"}</p>
              </div>

              {movie.trailerUrl && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Trailer</p>
                  <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ExternalLink size={13} /> Xem trailer
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Mô tả</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{movie.description}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit mode — mở MovieFormDialog chồng lên */}
      <MovieFormDialog
        open={open && isEditMode}
        onOpenChange={(isOpen) => { if (!isOpen) setIsEditMode(false); }}
        movie={movie}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
