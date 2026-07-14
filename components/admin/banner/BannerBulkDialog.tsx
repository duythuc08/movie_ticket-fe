"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadPreview, SingleSelectWithSearch } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { adminEventService } from "@/services/admin/adminEventService";
import type { AdminMovie } from "@/types/admin.type";
import type { AdminEvent } from "@/types/admin/promotion";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Hash, Image as ImageIcon, Loader2, Plus, Settings2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerRowSchema = z.object({
  imageFile: z.any().refine((v) => v !== undefined && v !== null && v !== "", "Ảnh không được để trống"),
  title: z.string().min(1, "Tiêu đề không được để trống").max(200),
  description: z.string().max(500).optional().default(""),
  linkUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")).default(""),
  priority: z.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
  bannerType: z.enum(["MOVIE", "EVENT"] as const),
  movieId: z.number().optional().nullable(),
  eventId: z.number().optional().nullable(),
});

const bulkSchema = z.object({
  banners: z.array(bannerRowSchema).min(1),
});

type BulkForm = z.infer<typeof bulkSchema>;
type BannerRowData = z.infer<typeof bannerRowSchema>;

export interface BannerBulkPayload {
  imageFile: File;
  title: string;
  description?: string;
  linkUrl?: string;
  priority: number;
  active: boolean;
  bannerType: "MOVIE" | "EVENT";
  movieId?: number | null;
  eventId?: number | null;
}

interface BannerBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (banners: BannerBulkPayload[]) => Promise<void>;
  isSubmitting: boolean;
}

function BannerRow({
  index,
  form,
  movies,
  events,
  isLoadingMovies,
  isLoadingEvents,
  onRemove,
  canRemove,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  movies: AdminMovie[];
  events: AdminEvent[];
  isLoadingMovies: boolean;
  isLoadingEvents: boolean;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const bannerType = form.watch(`banners.${index}.bannerType`);
  const title = form.watch(`banners.${index}.title`);
  const imageFile = form.watch(`banners.${index}.imageFile`);
  const errors = form.formState.errors?.banners?.[index];

  const previewUrl = imageFile instanceof File ? URL.createObjectURL(imageFile) : undefined;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title || "Banner chưa đặt tên"}</p>
          {errors?.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
          {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
        </div>
      </div>

      {/* Row content */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Image */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={13} /> Hình ảnh <span className="text-destructive">*</span>
            </Label>
            <Controller
              name={`banners.${index}.imageFile`}
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl overflow-hidden border border-border/80 bg-muted/20 p-1">
                  <ImageUploadPreview
                    currentImageUrl={previewUrl}
                    aspectRatio="banner"
                    onFileSelect={(file) => field.onChange(file)}
                  />
                </div>
              )}
            />
            {errors?.imageFile && <p className="text-xs text-destructive">{String(errors.imageFile.message)}</p>}
          </div>

          {/* Title + Description */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tiêu đề <span className="text-destructive">*</span></Label>
              <Input
                {...form.register(`banners.${index}.title`)}
                placeholder="Nhập tiêu đề banner..."
                className={cn("h-9", errors?.title && "border-destructive")}
              />
              {errors?.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground/80">Mô tả</Label>
              <Textarea
                {...form.register(`banners.${index}.description`)}
                placeholder="Mô tả ngắn..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Settings2 size={13} /> Phân loại
              </Label>
              <Controller
                control={form.control}
                name={`banners.${index}.bannerType`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn loại..." />
                    </SelectTrigger>
                    <SelectContent data-admin="">
                      <SelectItem value="MOVIE">Phim</SelectItem>
                      <SelectItem value="EVENT">Sự kiện</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Hash size={13} /> Độ ưu tiên
              </Label>
              <Input
                type="number"
                {...form.register(`banners.${index}.priority`, { valueAsNumber: true })}
                className="h-9"
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Link + Movie/Event select */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">URL liên kết</Label>
              <Input
                {...form.register(`banners.${index}.linkUrl`)}
                placeholder="https://..."
                className="h-9"
              />
              {errors?.linkUrl && <p className="text-xs text-destructive">{errors.linkUrl.message}</p>}
            </div>

            {bannerType === "MOVIE" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-blue-600">Phim liên kết</Label>
                <Controller
                  control={form.control}
                  name={`banners.${index}.movieId`}
                  render={({ field }) => (
                    <SingleSelectWithSearch
                      options={movies.map((m) => ({ value: String(m.movieId), label: m.title }))}
                      value={field.value != null ? String(field.value) : ""}
                      onChange={(val) => field.onChange(val ? Number(val) : null)}
                      placeholder="Chọn phim..."
                      searchPlaceholder="Tìm phim..."
                      isLoading={isLoadingMovies}
                    />
                  )}
                />
              </div>
            )}

            {bannerType === "EVENT" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-emerald-600">Sự kiện liên kết</Label>
                <Controller
                  control={form.control}
                  name={`banners.${index}.eventId`}
                  render={({ field }) => (
                    <SingleSelectWithSearch
                      options={events.map((e) => ({ value: String(e.eventId), label: e.title }))}
                      value={field.value != null ? String(field.value) : ""}
                      onChange={(val) => field.onChange(val ? Number(val) : null)}
                      placeholder="Chọn sự kiện..."
                      searchPlaceholder="Tìm sự kiện..."
                      isLoading={isLoadingEvents}
                    />
                  )}
                />
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-primary">Kích hoạt hiển thị</p>
              <p className="text-[11px] text-primary/70">Banner xuất hiện ngay trên trang chủ</p>
            </div>
            <Controller
              control={form.control}
              name={`banners.${index}.active`}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_ROW: BannerRowData = {
  imageFile: null,
  title: "",
  description: "",
  linkUrl: "",
  priority: 0,
  active: true,
  bannerType: "MOVIE",
  movieId: null,
  eventId: null,
};

export function BannerBulkDialog({ open, onOpenChange, onSubmit, isSubmitting }: BannerBulkDialogProps) {
  const { token } = useAuth();
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const form = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { banners: [{ ...DEFAULT_ROW }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "banners" });

  useEffect(() => {
    if (!open) return;
    form.reset({ banners: [{ ...DEFAULT_ROW }] });

    if (!token) return;
    setIsLoadingMovies(true);
    fetchAdminMovies(token, { page: 0, size: 200 })
      .then((r) => setMovies(r.content))
      .catch(() => toast.error("Không thể tải danh sách phim"))
      .finally(() => setIsLoadingMovies(false));

    setIsLoadingEvents(true);
    adminEventService.getEvents(token, 0, 200)
      .then((r) => setEvents(r.content))
      .catch(() => toast.error("Không thể tải danh sách sự kiện"))
      .finally(() => setIsLoadingEvents(false));
  }, [open, token, form]);

  async function handleSubmit(data: BulkForm) {
    await onSubmit(
      data.banners.map((b) => ({
        imageFile: b.imageFile as File,
        title: b.title,
        description: b.description || undefined,
        linkUrl: b.linkUrl || undefined,
        priority: b.priority,
        active: b.active,
        bannerType: b.bannerType,
        movieId: b.movieId,
        eventId: b.eventId,
      }))
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">

          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold">Thêm nhiều Banner</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Tạo nhiều banner cùng lúc
                <Badge variant="secondary" className="ml-2 rounded-full text-[10px] px-2">{fields.length}</Badge>
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {fields.map((field, index) => (
              <BannerRow
                key={field.id}
                index={index}
                form={form}
                movies={movies}
                events={events}
                isLoadingMovies={isLoadingMovies}
                isLoadingEvents={isLoadingEvents}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={() => append({ ...DEFAULT_ROW })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm font-semibold text-muted-foreground hover:text-primary transition-all"
            >
              <Plus size={16} /> Thêm banner
            </button>
          </div>

          <div className="border-t border-border bg-card px-6 py-3.5 flex items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-9 text-xs font-semibold">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-36 h-9 text-xs font-semibold">
              {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Thêm {fields.length} banner
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
