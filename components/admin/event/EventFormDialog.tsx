import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelectWithSearch, ImageUploadPreview } from "@/components/shared";
import { Controller } from "react-hook-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { adminEventService } from "@/services/admin/adminEventService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";
import { useAuth } from "@/context/AuthContext";
import { eventSchema, type EventValues } from "@/lib/validations/admin/promotion.schema";
import type { AdminEvent } from "@/types/admin/promotion";
import { HelpCircle } from "lucide-react";

const toDateTimeLocal = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const EVENT_TYPE_OPTIONS = [
  { value: "PREMIERE", label: "Ra mắt phim" },
  { value: "FESTIVAL", label: "Liên hoan phim" },
  { value: "SPECIAL_SCREENING", label: "Chiếu đặc biệt" },
  { value: "PROMOTION", label: "Sự kiện khuyến mãi" },
];

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  event?: AdminEvent | null;
}

export const EventFormDialog = ({
  open, onOpenChange, onSuccess, event,
}: EventFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movieOptions, setMovieOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!token || !open) return;
    fetchAdminMovies(token, { size: 200 })
      .then((res) => setMovieOptions([
        { value: "none", label: "— Không liên kết phim —" },
        ...res.content.map((m) => ({ value: String(m.movieId), label: m.title })),
      ]))
      .catch(() => { });
  }, [token, open]);

  const isEdit = !!event;

  const defaultValues: EventValues = useMemo(() => ({
    title: event?.title ?? "",
    description: event?.description ?? "",
    posterUrl: event?.posterUrl ?? "",
    startTime: toDateTimeLocal(event?.startTime ?? ""),
    endTime: toDateTimeLocal(event?.endTime ?? ""),
    eventType: event?.eventType ?? "PREMIERE",
    movieId: event?.movieId ?? null,
  }), [event]);

  const onSubmit = async (values: EventValues) => {
    if (!token) return;
    setIsSubmitting(true);

    let finalPosterUrl = typeof values.posterUrl === "string" ? values.posterUrl : "";
    if (values.posterUrl instanceof File) {
      try {
        finalPosterUrl = await uploadFileAndGetUrl(token, values.posterUrl);
      } catch (error) {
        toast.error("Lỗi khi tải ảnh lên");
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      ...values,
      startTime: `${values.startTime}:00`,
      endTime: `${values.endTime}:00`,
      posterUrl: finalPosterUrl || null,
      movieId: values.movieId ?? null,
    };
    try {
      if (isEdit) {
        await adminEventService.updateEvent(token, event!.eventId, payload);
        toast.success("Cập nhật sự kiện thành công");
      } else {
        await adminEventService.createEvent(token, payload);
        toast.success("Tạo sự kiện thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu sự kiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
      subtitle={isEdit ? `#${event!.eventId}` : undefined}
      updatedAt={event?.updatedAt}
      schema={eventSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Cập nhật" : "Tạo sự kiện"}
      maxWidth="max-w-4xl"
    >
      {(form) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 space-y-2 h-full flex flex-col">
            <Label className="font-medium text-sm">Ảnh Poster <span className="text-destructive">*</span></Label>
            <Controller
              name="posterUrl"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl overflow-hidden border border-border bg-muted/30 p-1.5 w-full flex-1 flex flex-col justify-center min-h-[280px]">
                  <ImageUploadPreview
                    currentImageUrl={typeof field.value === "string" ? field.value : null}
                    aspectRatio="poster"
                    onFileSelect={(file) => field.onChange(file)}
                  />
                </div>
              )}
            />
            {form.formState.errors.posterUrl && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.posterUrl.message as string}</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="font-medium text-sm">Tiêu đề sự kiện <span className="text-destructive">*</span></Label>
              <Input {...form.register("title")} placeholder="VD: Đêm Nhạc Hội Điện Ảnh Toàn Cầu" className="bg-background" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-medium text-sm">Loại sự kiện <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch("eventType")}
                  onValueChange={(v) => form.setValue("eventType", v as EventValues["eventType"])}
                >
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent data-admin="">
                    {EVENT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-sm">Phim liên kết</Label>
                <SingleSelectWithSearch
                  options={movieOptions}
                  value={form.watch("movieId") ? String(form.watch("movieId")) : "none"}
                  onChange={(v) => form.setValue("movieId", v === "none" ? null : Number(v))}
                  placeholder="Chọn phim (tùy chọn)..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-medium text-sm">Thời gian bắt đầu <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" {...form.register("startTime")} className="bg-background" />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-sm">Thời gian kết thúc <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" {...form.register("endTime")} className="bg-background" />
                {form.formState.errors.endTime && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="description" className="font-medium text-sm">Nội dung / Mô tả chi tiết</Label>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-3 max-w-xs space-y-1.5 text-xs bg-popover border shadow-md">
                      <p className="font-semibold text-foreground">Hướng dẫn cách viết:</p>
                      <p><code>## (Tiêu đề lớn)</code> | <code> ### (Tiêu đề nhỏ)</code></p>
                      <p><code>**(Chữ bôi đậm)**</code> | <code>*(In nghiêng)*</code></p>
                      <p><code>- (Gạch đầu dòng)</code> để tạo danh sách</p>
                      <p><code>![Tên](url_ảnh)</code> để chèn ảnh minh họa</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                {...form.register("description")}
                placeholder="Nhập nội dung chi tiết bài viết sự kiện tại đây (Hỗ trợ cấu trúc Markdown giống bài báo)..."
                className="bg-background resize-y min-h-[160px] line-height-relaxed text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </AdminFormDialog>
  );
};