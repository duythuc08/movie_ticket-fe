"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Clock, Film, Info, Users } from "lucide-react";
import { movieFormSchema, type MovieFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminMovie } from "@/types/admin.type";
import {
  MultiSelectWithSearch,
  ImageUploadPreview,
  QuickAddGenreButton,
  QuickAddPersonButton,
} from "@/components/shared";
import type { SelectOption } from "@/components/shared";
import { fetchAllGenresForSelect, createGenre } from "@/services/admin/adminGenreService";
import { fetchPersonsByRoleForSelect, createPerson } from "@/services/admin/adminPersonService";
import { useAuth } from "@/context/AuthContext";

const AGE_RATING_OPTIONS = [
  { value: "G", label: "G — Mọi lứa tuổi" },
  { value: "PG", label: "PG — Có phụ huynh" },
  { value: "PG_13", label: "PG-13 — Trên 13 tuổi" },
  { value: "R", label: "R — Trên 18 tuổi" },
  { value: "NC_17", label: "NC-17 — Chỉ dành cho người lớn" },
] as const;

interface MovieFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie?: AdminMovie | null;
  onSubmit: (data: MovieFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function MovieFormDialog({
  open,
  onOpenChange,
  movie,
  onSubmit,
  isSubmitting,
}: MovieFormDialogProps) {
  const { token } = useAuth();
  const isCreateMode = !movie;

  const [genreOptions, setGenreOptions] = useState<SelectOption[]>([]);
  const [directorOptions, setDirectorOptions] = useState<SelectOption[]>([]);
  const [actorOptions, setActorOptions] = useState<SelectOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const form = useForm<MovieFormSchema>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: "", description: "", duration: 90, trailerUrl: "",
      releaseDate: "", language: "Tiếng Việt", subTitle: "",
      ageRating: "PG", genreNames: [], castIds: [], directorIds: [],
      posterUrl: "", posterFile: null,
    },
  });

  const loadOptions = useCallback(async () => {
    if (!token || !open) return;
    setIsLoadingOptions(true);
    try {
      const [genres, directors, actors] = await Promise.all([
        fetchAllGenresForSelect(token),
        fetchPersonsByRoleForSelect(token, "DIRECTOR"),
        fetchPersonsByRoleForSelect(token, "ACTOR"),
      ]);
      setGenreOptions(genres.map((g) => ({ value: g.name, label: g.name })));
      setDirectorOptions(directors.map((p) => ({ value: String(p.id), label: p.name })));
      setActorOptions(actors.map((p) => ({ value: String(p.id), label: p.name })));
    } catch {
      toast.error("Không thể tải dữ liệu danh sách lựa chọn");
    } finally {
      setIsLoadingOptions(false);
    }
  }, [token, open]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  useEffect(() => {
    if (!open || isLoadingOptions) return;

    if (movie) {
      const releaseDateValue = movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().split("T")[0]
        : "";
      form.reset({
        title: movie.title,
        description: movie.description,
        duration: movie.duration,
        trailerUrl: movie.trailerUrl ?? "",
        releaseDate: releaseDateValue,
        language: movie.language,
        subTitle: movie.subTitle ?? "",
        ageRating: movie.ageRating,
        genreNames: (movie.genre ?? []).map((g) => g.name),
        castIds: (movie.castPersons ?? []).map((p) => p.id),
        directorIds: (movie.directors ?? []).map((p) => p.id),
        posterUrl: movie.posterUrl ?? "",
        posterFile: null,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        duration: "" as unknown as number,
        trailerUrl: "",
        releaseDate: "",
        language: "",
        subTitle: "",
        ageRating: "" as unknown as "G" | "PG" | "PG_13" | "R" | "NC_17",
        genreNames: [],
        castIds: [],
        directorIds: [],
        posterUrl: "",
        posterFile: null,
      });
    }
  }, [open, movie, form, isLoadingOptions]);

  async function handleQuickAddGenre(name: string, description: string): Promise<void> {
    if (!token) throw new Error("Chưa đăng nhập");
    const created = await createGenre(token, { name, description: description || undefined });
    setGenreOptions((prev) => [...prev, { value: created.name, label: created.name }]);
    const current = form.getValues("genreNames");
    form.setValue("genreNames", [...current, created.name]);
  }

  async function handleQuickAddDirector(name: string, role: "DIRECTOR" | "ACTOR") {
    if (!token) throw new Error("Chưa đăng nhập");
    const created = await createPerson(token, { name, movieRole: role });
    setDirectorOptions((prev) => [...prev, { value: String(created.id), label: created.name }]);
    return { id: created.id, name: created.name };
  }

  function handleDirectorCreated(personId: number) {
    const current = form.getValues("directorIds");
    form.setValue("directorIds", [...current, personId]);
  }

  async function handleQuickAddActor(name: string, role: "DIRECTOR" | "ACTOR") {
    if (!token) throw new Error("Chưa đăng nhập");
    const created = await createPerson(token, { name, movieRole: role });
    setActorOptions((prev) => [...prev, { value: String(created.id), label: created.name }]);
    return { id: created.id, name: created.name };
  }

  function handleActorCreated(personId: number) {
    const current = form.getValues("castIds");
    form.setValue("castIds", [...current, personId]);
  }

  const updatedAtLabel = !isCreateMode && movie?.updatedAt
    ? new Date(movie.updatedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">

          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                {isCreateMode ? "Thêm phim mới vào hệ thống" : "Cập nhật thông tin chi tiết phim"}
              </DialogTitle>
              {!isCreateMode && movie && (
                <p className="text-xs text-muted-foreground truncate max-w-xl">Đang chỉnh sửa: {movie.title}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <fieldset disabled={isSubmitting} className="border-none m-0 p-0">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">

                <div className="space-y-5 mx-auto md:mx-0 w-full max-w-[220px] sticky top-0">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Poster Phim</Label>
                    <Controller
                      name="posterFile"
                      control={form.control}
                      render={({ field }) => (
                        <div className="rounded-xl overflow-hidden border border-border/80 shadow-sm bg-muted/30 p-1.5">
                          <ImageUploadPreview
                            currentImageUrl={movie?.posterUrl}
                            aspectRatio="poster"
                            onFileSelect={field.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-age-rating" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Phân loại độ tuổi <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="ageRating"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="movie-age-rating" className="w-full bg-background border-border/80 shadow-sm h-9">
                            <SelectValue placeholder="Chọn độ tuổi..." />
                          </SelectTrigger>
                          <SelectContent data-admin="">
                            {AGE_RATING_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6 min-w-0 flex-1">

                  <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-muted/10">
                    <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1">
                      <Info size={14} className="text-blue-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Thông tin cơ bản</h3>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="movie-title" className="text-sm font-semibold">
                        Tên bộ phim <span className="text-destructive">*</span>
                      </Label>
                      <Input id="movie-title" {...form.register("title")} placeholder="Nhập tên phim chính thức..." className="h-9" />
                      {form.formState.errors.title && (
                        <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="movie-duration" className="text-sm font-semibold">
                          Thời lượng (phút) <span className="text-destructive">*</span>
                        </Label>
                        <Input id="movie-duration" type="number" min={1} max={600}
                          {...form.register("duration", { valueAsNumber: true })} className="h-9" />
                        {form.formState.errors.duration && (
                          <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.duration.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="movie-language" className="text-sm font-semibold">
                          Ngôn ngữ bản quyền <span className="text-destructive">*</span>
                        </Label>
                        <Input id="movie-language" {...form.register("language")} placeholder="VD: Tiếng Anh, Tiếng Việt" className="h-9" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="movie-release" className="text-sm font-semibold">
                          Ngày khởi chiếu chính thức <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="movie-release"
                          type="date"
                          {...form.register("releaseDate")}
                          className="h-9"
                          style={{ colorScheme: "light" }}
                        />
                        {form.formState.errors.releaseDate && (
                          <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.releaseDate.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="movie-subtitle" className="text-sm font-semibold">Cấu hình phụ đề</Label>
                        <Input id="movie-subtitle" {...form.register("subTitle")} placeholder="VD: Phụ đề Tiếng Việt, Lồng tiếng" className="h-9" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-muted/10">
                    <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1">
                      <Film size={14} className="text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Nội dung & Truyền thông</h3>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="movie-description" className="text-sm font-semibold">
                        Tóm tắt nội dung cốt truyện <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="movie-description"
                        {...form.register("description")}
                        rows={4}
                        placeholder="Nhập mô tả tóm tắt diễn biến hoặc nội dung chính của bộ phim..."
                        className="resize-none min-h-[100px]"
                      />
                      {form.formState.errors.description && (
                        <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="movie-trailer" className="text-sm font-semibold">Đường dẫn Video Trailer (YouTube)</Label>
                      <Input id="movie-trailer" {...form.register("trailerUrl")} placeholder="https://www.youtube.com/watch?v=..." className="h-9" />
                      {form.formState.errors.trailerUrl && (
                        <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.trailerUrl.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-muted/10">
                    <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1">
                      <Users size={14} className="text-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Thể loại & Nhân sự chính</h3>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">
                        Thể loại phim <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="genreNames"
                        control={form.control}
                        render={({ field }) => (
                          <MultiSelectWithSearch
                            options={genreOptions}
                            selectedValues={field.value}
                            onChange={field.onChange}
                            placeholder={isLoadingOptions ? "Đang tải dữ liệu..." : "Lựa chọn các thể loại phim..."}
                            disabled={isLoadingOptions}
                            quickAddSlot={
                              <QuickAddGenreButton
                                onCreated={() => { }}
                                onCreateRequest={handleQuickAddGenre}
                              />
                            }
                          />
                        )}
                      />
                      {form.formState.errors.genreNames && (
                        <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.genreNames.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">
                        Đạo diễn phụ trách <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="directorIds"
                        control={form.control}
                        render={({ field }) => (
                          <MultiSelectWithSearch
                            options={directorOptions}
                            selectedValues={field.value.map(String)}
                            onChange={(stringValues) => field.onChange(stringValues.map(Number))}
                            placeholder={isLoadingOptions ? "Đang tải dữ liệu..." : "Lựa chọn đạo diễn..."}
                            disabled={isLoadingOptions}
                            quickAddSlot={
                              <QuickAddPersonButton
                                defaultRole="DIRECTOR"
                                onCreated={handleDirectorCreated}
                                onCreateRequest={handleQuickAddDirector}
                              />
                            }
                          />
                        )}
                      />
                      {form.formState.errors.directorIds && (
                        <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.directorIds.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Các diễn viên tham gia</Label>
                      <Controller
                        name="castIds"
                        control={form.control}
                        render={({ field }) => (
                          <MultiSelectWithSearch
                            options={actorOptions}
                            selectedValues={field.value.map(String)}
                            onChange={(stringValues) => field.onChange(stringValues.map(Number))}
                            placeholder={isLoadingOptions ? "Đang tải dữ liệu..." : "Lựa chọn diễn viên..."}
                            disabled={isLoadingOptions}
                            quickAddSlot={
                              <QuickAddPersonButton
                                defaultRole="ACTOR"
                                onCreated={handleActorCreated}
                                onCreateRequest={handleQuickAddActor}
                              />
                            }
                          />
                        )}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </fieldset>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-muted-foreground">
              {updatedAtLabel ? (
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground/80">
                  <Clock size={13} className="text-muted-foreground/60" />
                  Hệ thống cập nhật lúc: {updatedAtLabel}
                </span>
              ) : (
                <span className="font-medium">
                  Lưu ý: Các trường đánh dấu <span className="text-destructive">*</span> không được bỏ trống.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-9 text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px] h-9 text-xs font-semibold">
                {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {isCreateMode ? "Thêm mới" : "Lưu thay đổi"}
              </Button>
            </div>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
}
