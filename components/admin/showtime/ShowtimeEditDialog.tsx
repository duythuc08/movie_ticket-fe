"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { SingleSelectWithSearch } from "@/components/shared";
import { TimePicker24h } from "@/components/shared/TimePicker24h";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { updateShowtimeSchema, UpdateShowtimeValues } from "@/lib/validations/admin/showtime.schema";
import { fetchAdminRooms } from "@/services/admin/adminRoomService";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { MovieSelectorDialog } from "@/components/admin/movie/MovieSelectorDialog";
import type { Showtime } from "@/types/admin/showtime";
import { Film } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ShowtimeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showtime: Showtime | null;
  onSuccess: () => void;
}

const parseDateTimeToDateAndTime = (iso: string): { date: string; time: string } => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const combineDateAndTime = (dateStr: string, timeStr: string): string =>
  `${dateStr}T${timeStr}:00`;

const getInitialDateTime = (iso?: string) => {
  if (!iso) return { date: "", time: "" };
  return parseDateTimeToDateAndTime(iso);
};

export const ShowtimeEditDialog = ({
  open,
  onOpenChange,
  showtime,
  onSuccess,
}: ShowtimeEditDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomOptions, setRoomOptions] = useState<{ value: string; label: string }[]>([]);
  const initialDateTime = useMemo(() => getInitialDateTime(showtime?.startTime), [showtime?.startTime]);
  const [dateStr, setDateStr] = useState(initialDateTime.date);
  const [timeStr, setTimeStr] = useState(initialDateTime.time);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(showtime?.movieTitle ?? "");
  const [selectedMovieDuration, setSelectedMovieDuration] = useState(showtime?.movieDuration ?? 120);

  useEffect(() => {
    setSelectedMovieTitle(showtime?.movieTitle ?? "");
    setSelectedMovieDuration(showtime?.movieDuration ?? 120);
  }, [showtime]);

  useEffect(() => {
    if (!token) return;
    fetchAdminRooms(token, { size: 200, entityStatus: "ACTIVE" })
      .then((res) =>
        setRoomOptions(res.content.map((r) => ({ value: String(r.roomId), label: r.name })))
      )
      .catch(() => {});
  }, [token]);

  const defaultValues: UpdateShowtimeValues = {
    movieId: showtime?.movieId || 0,
    roomId: showtime?.roomId || 0,
    startTime: showtime?.startTime || "",
  };

  const handleSubmit = async (values: UpdateShowtimeValues) => {
    if (!token || !showtime) return;
    setIsSubmitting(true);
    try {
      await adminShowtimeService.updateShowtime(token, showtime.showTimeId, values);
      toast.success("Cập nhật suất chiếu thành công");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Lỗi khi cập nhật suất chiếu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      key={showtime?.showTimeId ?? "create"}
      open={open}
      onOpenChange={onOpenChange}
      title="Chỉnh sửa suất chiếu"
      subtitle={showtime ? `#${showtime.showTimeId} – ${showtime.movieTitle}` : undefined}
      resetKey={showtime?.showTimeId ?? "none"}
      schema={updateShowtimeSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Cập nhật"
      maxWidth="max-w-2xl"
    >
      {(form) => {
        const duration = selectedMovieDuration || 120;

        let endTimeStr = "";
        if (dateStr && timeStr && duration) {
          const start = new Date(combineDateAndTime(dateStr, timeStr));
          if (!isNaN(start.getTime())) {
            start.setMinutes(start.getMinutes() + duration + 15);
            const m = start.getMinutes();
            const remainder = m % 5;
            if (remainder !== 0) {
              start.setMinutes(m + (5 - remainder));
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            endTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
          }
        }

        return (
        <>
          <div className="space-y-2">
            <Label>Phim <span className="text-destructive">*</span></Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMovieDialogOpen(true)}
              className="w-full justify-start font-normal h-10 gap-2"
            >
              <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={form.watch("movieId") ? "" : "text-muted-foreground"}>
                {form.watch("movieId") ? selectedMovieTitle : "Chọn phim..."}
              </span>
            </Button>
            {form.formState.errors.movieId && (
              <p className="text-xs text-destructive">{form.formState.errors.movieId.message}</p>
            )}

            <MovieSelectorDialog
              open={isMovieDialogOpen}
              onOpenChange={setIsMovieDialogOpen}
              value={form.watch("movieId") || null}
              onSelect={(movie) => {
                form.setValue("movieId", movie.movieId, { shouldValidate: true });
                setSelectedMovieTitle(movie.title);
                setSelectedMovieDuration(movie.duration);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Phòng chiếu <span className="text-destructive">*</span></Label>
            <SingleSelectWithSearch
              options={roomOptions}
              value={String(form.watch("roomId") || "")}
              onChange={(val) => form.setValue("roomId", Number(val), { shouldValidate: true })}
              placeholder="Chọn phòng chiếu..."
            />
            {form.formState.errors.roomId && (
              <p className="text-xs text-destructive">{form.formState.errors.roomId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border mb-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Lịch chiếu ngày {dateStr}
              </Label>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Giờ chiếu <span className="text-destructive">*</span></Label>
                <TimePicker24h 
                  value={timeStr} 
                  onChange={(newTime) => {
                    setTimeStr(newTime);
                    if (dateStr && newTime) {
                      form.setValue("startTime", combineDateAndTime(dateStr, newTime), { shouldValidate: true });
                    }
                  }} 
                />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="mb-2 block">Giờ kết thúc (Dự kiến)</Label>
                <TimePicker24h 
                  value={endTimeStr} 
                  onChange={() => {}} 
                  disabled={true} 
                />
              </div>
            </div>
          </div>
        </>
        );
      }}
    </AdminFormDialog>
  );
};
