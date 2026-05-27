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
import { Pencil, ExternalLink, X, Film, Calendar, Clock, Globe2 } from "lucide-react";
import type { AdminMovie } from "@/types/admin.type";
import { MovieFormDialog } from "./MovieFormDialog";
import type { MovieFormSchema } from "@/lib/validations/admin.schemas";

const MOVIE_STATUS_MAP: StatusMap = {
  NOW_SHOWING: { label: "Đang chiếu", variant: "success" },
  COMING_SOON: { label: "Sắp chiếu", variant: "warning" },
  STOPPED: { label: "Ngừng chiếu", variant: "secondary" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE: { label: "Hoạt động", variant: "success" },
  INACTIVE: { label: "Vô hiệu", variant: "secondary" },
};

const AGE_RATING_MAP: StatusMap = {
  G: { label: "G", variant: "secondary" },
  PG: { label: "PG", variant: "outline" },
  PG_13: { label: "PG-13", variant: "warning" },
  R: { label: "R", variant: "cancelled" },
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
        <DialogContent data-admin="" className="max-w-4xl max-h-[85vh] overflow-y-auto gap-0 p-0 rounded-xl border border-border/80 shadow-2xl [&>button]:hidden">

          <div className="relative h-48 w-full bg-muted overflow-hidden shrink-0 select-none">
            {movie.posterUrl && (
              <div className="absolute inset-0 scale-110">
                <Image
                  src={movie.posterUrl}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="h-8 gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs font-medium px-3 shadow-sm"
              >
                <Pencil size={13} /> Chỉnh sửa
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/40 backdrop-blur-md text-foreground hover:bg-red-500/80 transition-all border border-white/10"
                onClick={() => handleClose(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="px-8 pb-8 -mt-24 relative z-10 space-y-6">

            <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-start">
              <div className="shrink-0 mx-auto sm:mx-0">
                <div className="aspect-[2/3] w-40 overflow-hidden rounded-xl border-2 border-background shadow-xl bg-muted ring-1 ring-black/5">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      width={160}
                      height={240}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center px-2">
                      Không có ảnh
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-0 sm:pt-24 text-center sm:text-left space-y-3 w-full">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight line-clamp-2">
                    {movie.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <StatusBadge status={movie.ageRating} statusMap={AGE_RATING_MAP} />
                  <StatusBadge status={movie.movieStatus} statusMap={MOVIE_STATUS_MAP} />
                  <StatusBadge status={movie.entityStatus} statusMap={ENTITY_STATUS_MAP} />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

              <div className="md:col-span-2 space-y-5">

                <div className="bg-muted/30 border border-border/40 p-4 rounded-xl space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">Mô tả cốt truyện</p>
                  <p className="text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-line">
                    {movie.description || "Chưa có mô tả tóm tắt cho bộ phim này."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Đạo diễn</p>
                    <p className="text-sm font-medium text-foreground">{directors}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Dàn diễn viên chính</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{cast}</p>
                  </div>
                </div>

                {movie.trailerUrl && (
                  <div className="pt-1">
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Film size={14} /> Xem Trailer chính thức <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-muted/40 border border-border/50 p-4 rounded-xl h-fit">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/60 pb-2 mb-2">
                  Thông số chi tiết
                </p>
                <GridDetailItem icon={<Clock size={14} />} label="Thời lượng" value={`${movie.duration} phút`} />
                <GridDetailItem icon={<Globe2 size={14} />} label="Ngôn ngữ" value={movie.language} />
                <GridDetailItem icon={<Film size={14} />} label="Phụ đề" value={movie.subTitle || "Không có"} />
                <GridDetailItem icon={<Calendar size={14} />} label="Ngày ra mắt" value={releaseDate} />

                <div className="pt-2 border-t border-border/60 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Thể loại</p>
                  <div className="flex flex-wrap gap-1">
                    {(movie.genre ?? []).length > 0 ? (
                      movie.genre.map((g) => (
                        <Badge
                          key={g.genreId}
                          variant="secondary"
                          className="text-[11px] font-normal tracking-wide px-2 py-0.5 rounded-md border border-border/50"
                        >
                          {g.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa xác định</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

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

function GridDetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <div className="text-muted-foreground/70 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground/80 leading-none">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}