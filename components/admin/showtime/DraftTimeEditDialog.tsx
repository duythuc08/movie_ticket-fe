"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { TimePicker24h } from "@/components/shared/TimePicker24h";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import type { Showtime } from "@/types/admin/showtime";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

interface DraftTimeEditDialogProps {
  showtime: Showtime | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const draftTimeSchema = z.object({
  startTime: z.string().min(1, "Định dạng giờ không hợp lệ"),
});

type DraftTimeValues = z.infer<typeof draftTimeSchema>;

const parseDateTimeToDateAndTime = (iso: string): { date: string; time: string } => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const combineDateAndTime = (dateStr: string, timeStr: string): string => `${dateStr}T${timeStr}:00`;

export const DraftTimeEditDialog = ({ showtime, onOpenChange, onSuccess }: DraftTimeEditDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialDateTime = useMemo(
    () => (showtime ? parseDateTimeToDateAndTime(showtime.startTime) : { date: "", time: "" }),
    [showtime],
  );
  const [dateStr, setDateStr] = useState(initialDateTime.date);
  const [timeStr, setTimeStr] = useState(initialDateTime.time);

  const defaultValues: DraftTimeValues = { startTime: showtime?.startTime || "" };

  const handleSubmit = async (values: DraftTimeValues) => {
    if (!token || !showtime) return;
    setIsSubmitting(true);
    try {
      await adminShowtimeService.updateDraftTime(token, showtime.showTimeId, {
        movieId: showtime.movieId,
        roomId: showtime.roomId,
        startTime: values.startTime,
      });
      toast.success("Cập nhật giờ đề xuất thành công");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật giờ đề xuất");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      key={showtime?.showTimeId ?? "none"}
      open={!!showtime}
      onOpenChange={onOpenChange}
      title="Sửa giờ đề xuất (DRAFT)"
      subtitle={showtime ? `#${showtime.showTimeId} – ${showtime.movieTitle} – ${showtime.roomName}` : undefined}
      resetKey={showtime?.showTimeId ?? "none"}
      schema={draftTimeSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Cập nhật giờ"
    >
      {(form) => (
        <div className="space-y-2">
          <Label>Giờ chiếu mới <span className="text-destructive">*</span></Label>
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
      )}
    </AdminFormDialog>
  );
};
