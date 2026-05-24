"use client";

import { useEffect, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { ImageUploadPreview, SingleSelectWithSearch } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bannerFormSchema, type BannerFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminBanner, AdminMovie } from "@/types/admin.type";
import { Image as ImageIcon, Link as LinkIcon, Hash, Settings2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: AdminBanner | null;
  onSubmit: (data: BannerFormSchema) => Promise<void>;
  isSubmitting: boolean;
  readOnly?: boolean;
}

// Inner component để dùng hooks (useEffect watch bannerType)
function BannerFormContent({
  form,
  movies,
  isLoadingMovies,
  hasMore,
  isLoadingMore,
  onLoadMore,
  currentImageUrl,
  linkedMovie,
}: {
  form: UseFormReturn<BannerFormSchema>;
  movies: AdminMovie[];
  isLoadingMovies: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  currentImageUrl?: string | null;
  linkedMovie?: { movieId: number; title: string } | null;
}) {
  const watchedType = form.watch("bannerType");

  useEffect(() => {
    if (watchedType === "EVENT") {
      toast.info("Chức năng liên kết sự kiện đang được phát triển");
    }
  }, [watchedType]);

  return (
    <div className="space-y-6 py-2">

      {/* 1. Ảnh Banner */}
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
          <p className="text-xs font-medium text-destructive mt-1">
            {form.formState.errors.imageUrl.message}
          </p>
        )}
      </div>

      {/* 2. Tiêu đề & Mô tả */}
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

      {/* 3. Phân loại & Độ ưu tiên */}
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
                <SelectContent>
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

      {/* 4. URL & Liên kết */}
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

        {/* Select phim */}
        {watchedType === "MOVIE" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label className="text-xs font-bold text-blue-600">
              Phim liên kết
            </Label>
            <Controller
              control={form.control}
              name="movieId"
              render={({ field }) => {
                // Đảm bảo phim đang liên kết luôn có trong danh sách kể cả khi đang load
                const base = movies.map((m) => ({ value: String(m.movieId), label: m.title }));
                if (linkedMovie && !base.some((o) => o.value === String(linkedMovie.movieId))) {
                  base.unshift({ value: String(linkedMovie.movieId), label: linkedMovie.title });
                }
                return (
                  <SingleSelectWithSearch
                    options={base}
                    value={field.value != null ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                    placeholder="Chọn phim liên kết..."
                    searchPlaceholder="Tìm tên phim..."
                    isLoading={isLoadingMovies}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={onLoadMore}
                  />
                );
              }}
            />
          </div>
        )}

        {/* Event placeholder */}
        {watchedType === "EVENT" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label className="text-xs font-bold text-emerald-600">
              Sự kiện liên kết
            </Label>
            <div className="h-9 rounded-md border border-emerald-200 bg-emerald-50 px-3 flex items-center text-xs text-emerald-600 font-medium">
              Chức năng đang được phát triển...
            </div>
          </div>
        )}
      </div>

      {/* 5. Trạng thái hiển thị */}
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
}: BannerFormDialogProps) {
  const { token } = useAuth();
  const isEditMode = !!banner;

  const PAGE_SIZE = 5;
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [moviePage, setMoviePage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setMovies([]);
    setMoviePage(0);
    setHasMore(false);

    async function load() {
      setIsLoadingMovies(true);
      try {
        const result = await fetchAdminMovies(token!, { page: 0, size: PAGE_SIZE });
        if (!cancelled) {
          setMovies(result.content);
          setHasMore(!result.last);
          setMoviePage(1);
        }
      } catch {
        if (!cancelled) toast.error("Không thể tải danh sách phim");
      } finally {
        if (!cancelled) setIsLoadingMovies(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, token]);

  async function handleLoadMore() {
    if (!token || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchAdminMovies(token, { page: moviePage, size: PAGE_SIZE });
      setMovies((prev) => [...prev, ...result.content]);
      setHasMore(!result.last);
      setMoviePage((p) => p + 1);
    } catch {
      toast.error("Không thể tải thêm phim");
    } finally {
      setIsLoadingMore(false);
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
      schema={bannerFormSchema}
      defaultValues={{
        imageUrl:    banner?.imageUrl    ?? "",
        title:       banner?.title       ?? "",
        description: banner?.description ?? "",
        linkUrl:     banner?.linkUrl     ?? "",
        priority:    banner?.priority    ?? 0,
        active:      banner?.active      ?? true,
        bannerType:  banner?.bannerType  ?? "MOVIE",
        movieId:     banner?.movies?.movieId ?? null,
        eventId:     banner?.event?.id   ?? null,
      }}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditMode ? "Cập nhật Banner" : "Tạo Banner mới"}
      readOnly={readOnly}
      maxWidth="max-w-xl"
    >
      {(form) => (
        <BannerFormContent
          form={form}
          movies={movies}
          isLoadingMovies={isLoadingMovies}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          currentImageUrl={banner?.imageUrl}
          linkedMovie={banner?.movies}
        />
      )}
    </AdminFormDialog>
  );
}
