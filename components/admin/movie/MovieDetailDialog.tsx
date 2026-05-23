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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Pencil, ExternalLink, X } from "lucide-react";
import type { AdminMovie } from "@/types/admin.type";
import { MovieFormDialog } from "./MovieFormDialog";
import type { MovieFormSchema } from "@/lib/validations/admin.schemas";

const MOVIE_STATUS_MAP: StatusMap = {
  NOW_SHOWING: { label: "Đang chiếu",  variant: "success"   },
  COMING_SOON: { label: "Sắp chiếu",   variant: "warning"   },
  STOPPED:     { label: "Ngừng chiếu", variant: "secondary" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE:   { label: "Hoạt động", variant: "success"   },
  INACTIVE: { label: "Vô hiệu",   variant: "secondary" },
};

const AGE_RATING_MAP: StatusMap = {
  G:     { label: "G",     variant: "secondary"   },
  PG:    { label: "PG",    variant: "outline"     },
  PG_13: { label: "PG-13", variant: "warning"     },
  R:     { label: "R",     variant: "cancelled"   },
  NC_17: { label: "NC-17", variant: "destructive" },
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

  const directors = (movie.directors ?? []).map((d) => d.name).join(", ") || "—";
  const cast = (movie.castPersons ?? []).map((c) => c.name).join(", ") || "—";

  return (
    <>
      <Dialog open={open && !isEditMode} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto gap-0 p-0 [&>button]:hidden">

          {/* ── Header sticky ── */}
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 space-y-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold leading-snug line-clamp-2">
                  {movie.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={movie.movieStatus} statusMap={MOVIE_STATUS_MAP} />
                  <StatusBadge status={movie.ageRating}   statusMap={AGE_RATING_MAP} />
                  <StatusBadge status={movie.entityStatus} statusMap={ENTITY_STATUS_MAP} />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="gap-1.5 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  <Pencil size={13} /> Chỉnh sửa
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => handleClose(false)}
                >
                  <X size={15} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* ── Body ── */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[150px_1fr]">

              {/* Poster */}
              <div className="shrink-0">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      width={150}
                      height={225}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center px-2">
                      Không có ảnh
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin */}
              <div className="space-y-5 min-w-0">

                {/* Grid thông số */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailItem label="Thời lượng" value={`${movie.duration} phút`} />
                  <DetailItem label="Ngôn ngữ"   value={movie.language} />
                  <DetailItem label="Phụ đề"     value={movie.subTitle || "—"} />
                  <DetailItem label="Ngày ra mắt" value={releaseDate} />
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Đạo diễn</p>
                    <p className="text-sm">{directors}</p>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Thể loại */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Thể loại</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(movie.genre ?? []).length > 0 ? (
                      movie.genre.map((g) => (
                        <Badge key={g.genreId} variant="outline"
                          className="rounded-full border-primary/30 text-primary bg-primary/5">
                          {g.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa có</span>
                    )}
                  </div>
                </div>

                {/* Diễn viên */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Diễn viên</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cast}</p>
                </div>

                {/* Trailer */}
                {movie.trailerUrl && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Trailer</p>
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink size={13} /> Xem trailer
                    </a>
                  </div>
                )}

                {/* Mô tả */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{movie.description}</p>
                </div>

              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Edit mode */}
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
