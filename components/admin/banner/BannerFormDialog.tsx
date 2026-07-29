"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { ImageUploadPreview, SingleSelectWithSearch } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { bannerFormSchema, type BannerFormSchema } from "@/lib/validations/admin.schemas";
import { adminEventService } from "@/services/admin/adminEventService";
import { MovieSelectorDialog } from "@/components/admin/movie/MovieSelectorDialog";
import type { AdminBanner } from "@/types/admin.type";
import type { AdminEvent } from "@/types/admin/promotion";
import { Film, Hash, Image as ImageIcon, Link as LinkIcon, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: AdminBanner | null;
  onSubmit: (data: BannerFormSchema) => Promise<void>;
  isSubmitting: boolean;
  readOnly?: boolean;
  onEdit?: () => void;
}

function BannerFormContent({
  form,
  currentImageUrl,
  linkedMovie,
  events,
  linkedEvent,
  isLoadingEvents,
  hasMoreEvents,
  isLoadingMoreEvents,
  onLoadMoreEvents,
}: {
  form: UseFormReturn<BannerFormSchema>;
  currentImageUrl?: string | null;
  linkedMovie?: { movieId: number; title: string } | null;
  events: AdminEvent[];
  linkedEvent?: { id: number; title: string } | null;
  isLoadingEvents: boolean;
  hasMoreEvents: boolean;
  isLoadingMoreEvents: boolean;
  onLoadMoreEvents: () => void;
}) {
  const watchedType = form.watch("bannerType");
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(linkedMovie?.title ?? "");

  return (
    <div className="space-y-6 py-2">

      <div className="space-y-3">
        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={14} /> Hình ảnh Banner <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="imageUrl"
          control={form.control}
          render={({ field }) => (
            <div className="rounded-xl overflow-hidden border border-border/80 shadow-sm bg-muted/20 p-1">
              <ImageUploadPreview
                currentImageUrl={currentImageUrl}
                aspectRatio="banner"
                onFileSelect={(file) => field.onChange(file)}
              />
            </div>
          )}
        />
        {form.formState.errors.imageUrl && (
          <p className="text-xs text-destructive mt-1">
            {String(form.formState.errors.imageUrl.message)}
          </p>
        )}
      </div>

      <div className="space-y-4 border border-border/60 rounded-xl p-4 bg-muted/5">
        <div className="space-y-2">
          <Label htmlFor="banner-title" className="text-sm font-semibold">
            Tiêu đề hiển thị <span className="text-destructive">*</span>
          </Label>
          <Input
            id="banner-title"
            {...form.register("title")}
            placeholder="Nhập tên chương trình hoặc tên phim..."
            className="h-10 shadow-sm"
          />
          {form.formState.errors.title && (
            <p className="text-xs font-medium text-destructive mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-description" className="text-sm font-semibold text-foreground/80">
            Mô tả ngắn
          </Label>
          <Textarea
            id="banner-description"
            {...form.register("description")}
            placeholder="Nội dung tóm tắt hiển thị trên banner (nếu có)..."
            rows={2}
            className="resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 size={14} /> Phân loại
          </Label>
          <Controller
            control={form.control}
            name="bannerType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 shadow-sm">
                  <SelectValue placeholder="Chọn loại banner..." />
                </SelectTrigger>
                <SelectContent data-admin="">
                  <SelectItem value="MOVIE">Phim</SelectItem>
                  <SelectItem value="EVENT">Sự kiện / Ưu đãi</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-priority" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Hash size={14} /> Độ ưu tiên (0-100)
          </Label>
          <Input
            id="banner-priority"
            type="number"
            {...form.register("priority", { valueAsNumber: true })}
            className="h-10 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4 border border-border/60 rounded-xl p-4 bg-muted/5">
        <div className="space-y-2">
          <Label htmlFor="banner-linkUrl" className="text-sm font-semibold flex items-center gap-1.5">
            <LinkIcon size={14} /> URL Liên kết (Tùy chọn)
          </Label>
          <Input
            id="banner-linkUrl"
            {...form.register("linkUrl")}
            placeholder="https://cinema.com/detail-page"
            className="h-9"
          />
        </div>

        {watchedType === "MOVIE" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label className="text-xs font-bold text-blue-600">
              Phim liên kết
            </Label>
            <Controller
              control={form.control}
              name="movieId"
              render={({ field }) => (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMovieDialogOpen(true)}
                    className="w-full justify-start font-normal h-10 gap-2"
                  >
                    <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={field.value ? "" : "text-muted-foreground"}>
                      {field.value ? selectedMovieTitle : "Chọn phim liên kết..."}
                    </span>
                  </Button>
                  <MovieSelectorDialog
                    open={isMovieDialogOpen}
                    onOpenChange={setIsMovieDialogOpen}
                    value={field.value ?? null}
                    excludeStopped={false}
                    onSelect={(movie) => {
                      field.onChange(movie.movieId);
                      setSelectedMovieTitle(movie.title);
                    }}
                  />
                </>
              )}
            />
          </div>
        )}

        {watchedType === "EVENT" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label className="text-xs font-bold text-emerald-600">
              Sự kiện liên kết
            </Label>
            <Controller
              control={form.control}
              name="eventId"
              render={({ field }) => {
                const safeEvents = Array.isArray(events) ? events : [];
                const base = safeEvents.map((e) => ({ value: String(e?.eventId), label: e?.title }));
                if (linkedEvent && !base.some((o) => o.value === String(linkedEvent.id))) {
                  base.unshift({ value: String(linkedEvent.id), label: linkedEvent.title });
                }
                return (
                  <SingleSelectWithSearch
                    options={base}
                    value={field.value != null ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                    placeholder="Chọn sự kiện liên kết..."
                    searchPlaceholder="Tìm tên sự kiện..."
                    isLoading={isLoadingEvents}
                    hasMore={hasMoreEvents}
                    isLoadingMore={isLoadingMoreEvents}
                    onLoadMore={onLoadMoreEvents}
                  />
                );
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all hover:bg-primary/10">
        <div className="space-y-0.5">
          <Label htmlFor="banner-active" className="text-sm font-bold text-primary cursor-pointer">
            Kích hoạt hiển thị
          </Label>
          <p className="text-[11px] text-primary/70 font-medium">
            Banner này sẽ xuất hiện ngay lập tức trên Slider trang chủ.
          </p>
        </div>
        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <Switch
              id="banner-active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}

export function BannerFormDialog({
  open,
  onOpenChange,
  banner,
  onSubmit,
  isSubmitting,
  readOnly = false,
  onEdit,
}: BannerFormDialogProps) {
  const { token } = useAuth();
  const isEditMode = !!banner;

  const PAGE_SIZE = 5;
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventPage, setEventPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMoreEvents, setIsLoadingMoreEvents] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;

    const resetTimer = window.setTimeout(() => {
      if (cancelled) return;
      setEvents([]);
      setEventPage(0);
      setHasMoreEvents(false);
    }, 0);

    async function load() {
      setIsLoadingEvents(true);
      try {
        const evtResult = await adminEventService.getEvents(token!, 0, PAGE_SIZE);
        if (!cancelled) {
          setEvents(evtResult.content);
          setHasMoreEvents(!evtResult.last);
          setEventPage(1);
        }
      } catch {
        if (!cancelled) toast.error("Không thể tải danh sách sự kiện");
      } finally {
        if (!cancelled) setIsLoadingEvents(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      window.clearTimeout(resetTimer);
    };
  }, [open, token]);

  async function handleLoadMoreEvents() {
    if (!token || isLoadingMoreEvents || !hasMoreEvents) return;
    setIsLoadingMoreEvents(true);
    try {
      const result = await adminEventService.getEvents(token, eventPage, PAGE_SIZE);
      setEvents((prev) => [...prev, ...result.content]);
      setHasMoreEvents(!result.last);
      setEventPage((p) => p + 1);
    } catch {
      toast.error("Không thể tải thêm sự kiện");
    } finally {
      setIsLoadingMoreEvents(false);
    }
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        readOnly
          ? "Chi tiết Banner"
          : isEditMode
            ? "Chỉnh sửa Banner"
            : "Thêm Banner mới"
      }
      subtitle={banner?.title || "Cấu hình hình ảnh quảng bá trên trang chủ"}
      resetKey={banner?.id ?? "create"}
      schema={bannerFormSchema}
      defaultValues={{
        imageUrl: banner?.imageUrl ?? "",
        title: banner?.title ?? "",
        description: banner?.description ?? "",
        linkUrl: banner?.linkUrl ?? "",
        priority: banner?.priority ?? 0,
        active: banner?.active ?? true,
        bannerType: banner?.bannerType ?? "MOVIE",
        movieId: banner?.movies?.movieId ?? null,
        eventId: banner?.event?.id ?? null,
      }}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditMode ? "Lưu thay đổi" : "Thêm mới"}
      readOnly={readOnly}
      onEdit={onEdit}
      maxWidth="max-w-xl"
    >
      {(form) => (
        <BannerFormContent
          form={form}
          currentImageUrl={banner?.imageUrl}
          linkedMovie={banner?.movies}
          events={events}
          linkedEvent={banner?.event}
          isLoadingEvents={isLoadingEvents}
          hasMoreEvents={hasMoreEvents}
          isLoadingMoreEvents={isLoadingMoreEvents}
          onLoadMoreEvents={handleLoadMoreEvents}
        />
      )}
    </AdminFormDialog>
  );
}
