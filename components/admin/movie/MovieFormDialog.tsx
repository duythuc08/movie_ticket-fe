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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
  { value: "G",     label: "G — Mọi lứa tuổi" },
  { value: "PG",    label: "PG — Có hướng dẫn phụ huynh" },
  { value: "PG_13", label: "PG-13 — Trên 13 tuổi" },
  { value: "R",     label: "R — 18+" },
  { value: "NC_17", label: "NC-17 — Chỉ người lớn" },
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

  const [genreOptions,    setGenreOptions]    = useState<SelectOption[]>([]);
  const [directorOptions, setDirectorOptions] = useState<SelectOption[]>([]);
  const [actorOptions,    setActorOptions]    = useState<SelectOption[]>([]);
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
      toast.error("Không thể tải dữ liệu dropdown");
    } finally {
      setIsLoadingOptions(false);
    }
  }, [token, open]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  useEffect(() => {
    if (!open) return;
    if (movie) {
      const releaseDateValue = movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().split("T")[0]
        : "";
      form.reset({
        title: movie.title, description: movie.description, duration: movie.duration,
        trailerUrl: movie.trailerUrl ?? "", releaseDate: releaseDateValue,
        language: movie.language, subTitle: movie.subTitle ?? "",
        ageRating: movie.ageRating,
        genreNames:  (movie.genre        ?? []).map((g) => g.name),
        castIds:     (movie.castPersons  ?? []).map((p) => p.id),
        directorIds: (movie.directors    ?? []).map((p) => p.id),
        posterUrl: movie.posterUrl ?? "", posterFile: null,
      });
    } else {
      form.reset({
        title: "", description: "", duration: 90, trailerUrl: "",
        releaseDate: "", language: "Tiếng Việt", subTitle: "",
        ageRating: "PG", genreNames: [], castIds: [], directorIds: [],
        posterUrl: "", posterFile: null,
      });
    }
  }, [open, movie, form]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? "Thêm phim mới" : `Chỉnh sửa: ${movie?.title}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
          <fieldset disabled={isSubmitting} className="space-y-6 border-none p-0 m-0">

            {/* Layout 2 cột: Poster (trái) + Thông tin cơ bản (phải) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
              {/* Upload Poster */}
              <div className="space-y-2">
                <Label>Poster phim</Label>
                <Controller
                  name="posterFile"
                  control={form.control}
                  render={({ field }) => (
                    <ImageUploadPreview
                      currentImageUrl={movie?.posterUrl}
                      aspectRatio="poster"
                      onFileSelect={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="movie-title">Tên phim <span className="text-destructive">*</span></Label>
                  <Input id="movie-title" {...form.register("title")} placeholder="Nhập tên phim..." />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="movie-duration">Thời lượng (phút) <span className="text-destructive">*</span></Label>
                    <Input id="movie-duration" type="number" min={1} max={600}
                      {...form.register("duration", { valueAsNumber: true })} />
                    {form.formState.errors.duration && (
                      <p className="text-xs text-destructive">{form.formState.errors.duration.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="movie-language">Ngôn ngữ <span className="text-destructive">*</span></Label>
                    <Input id="movie-language" {...form.register("language")} placeholder="VD: Tiếng Anh" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="movie-release">Ngày ra mắt <span className="text-destructive">*</span></Label>
                    <Input id="movie-release" type="date" {...form.register("releaseDate")}
                      className="[color-scheme:light] dark:[color-scheme:dark]" />
                    {form.formState.errors.releaseDate && (
                      <p className="text-xs text-destructive">{form.formState.errors.releaseDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="movie-subtitle">Phụ đề</Label>
                    <Input id="movie-subtitle" {...form.register("subTitle")} placeholder="VD: Lồng tiếng Việt" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="movie-age-rating">Phân loại độ tuổi <span className="text-destructive">*</span></Label>
                  <select
                    id="movie-age-rating"
                    {...form.register("ageRating")}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {AGE_RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <Label htmlFor="movie-description">Mô tả / Nội dung phim <span className="text-destructive">*</span></Label>
              <textarea
                id="movie-description"
                {...form.register("description")}
                rows={4}
                placeholder="Nhập mô tả nội dung phim..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* URL Trailer */}
            <div className="space-y-1.5">
              <Label htmlFor="movie-trailer">URL Trailer (YouTube)</Label>
              <Input id="movie-trailer" {...form.register("trailerUrl")} placeholder="https://www.youtube.com/watch?v=..." />
            </div>

            {/* Thể loại + QuickAdd */}
            <div className="space-y-1.5">
              <Label>Thể loại <span className="text-destructive">*</span></Label>
              <Controller
                name="genreNames"
                control={form.control}
                render={({ field }) => (
                  <MultiSelectWithSearch
                    options={genreOptions}
                    selectedValues={field.value}
                    onChange={field.onChange}
                    placeholder={isLoadingOptions ? "Đang tải..." : "Chọn thể loại..."}
                    disabled={isLoadingOptions}
                    quickAddSlot={
                      <QuickAddGenreButton
                        onCreated={() => {}}
                        onCreateRequest={handleQuickAddGenre}
                      />
                    }
                  />
                )}
              />
              {form.formState.errors.genreNames && (
                <p className="text-xs text-destructive">{form.formState.errors.genreNames.message}</p>
              )}
            </div>

            {/* Đạo diễn + QuickAdd */}
            <div className="space-y-1.5">
              <Label>Đạo diễn <span className="text-destructive">*</span></Label>
              <Controller
                name="directorIds"
                control={form.control}
                render={({ field }) => (
                  <MultiSelectWithSearch
                    options={directorOptions}
                    selectedValues={field.value.map(String)}
                    onChange={(stringValues) => field.onChange(stringValues.map(Number))}
                    placeholder={isLoadingOptions ? "Đang tải..." : "Chọn đạo diễn..."}
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
                <p className="text-xs text-destructive">{form.formState.errors.directorIds.message}</p>
              )}
            </div>

            {/* Diễn viên + QuickAdd */}
            <div className="space-y-1.5">
              <Label>Diễn viên</Label>
              <Controller
                name="castIds"
                control={form.control}
                render={({ field }) => (
                  <MultiSelectWithSearch
                    options={actorOptions}
                    selectedValues={field.value.map(String)}
                    onChange={(stringValues) => field.onChange(stringValues.map(Number))}
                    placeholder={isLoadingOptions ? "Đang tải..." : "Chọn diễn viên..."}
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

          </fieldset>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreateMode ? "Thêm phim" : "Cập nhật phim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
