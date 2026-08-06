"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Camera, Clapperboard, Loader2, Plus, Trash2, User2, X } from "lucide-react";

const personRowSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  movieRole: z.array(z.enum(["DIRECTOR", "ACTOR"] as const)).min(1, "Chọn ít nhất 1 vai trò"),
  avatarFile: z.instanceof(File).optional(),
  avatarPreview: z.string().optional(),
});

const bulkSchema = z.object({
  persons: z.array(personRowSchema).min(1),
});

type BulkForm = z.infer<typeof bulkSchema>;

export interface PersonBulkPayload {
  name: string;
  movieRole: ("DIRECTOR" | "ACTOR")[];
  avatarFile?: File;
}

interface PersonBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (persons: PersonBulkPayload[]) => Promise<void>;
  isSubmitting: boolean;
}

function PersonRow({
  index,
  form,
  onRemove,
  canRemove,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview = form.watch(`persons.${index}.avatarPreview`);
  const selected: ("DIRECTOR" | "ACTOR")[] = form.watch(`persons.${index}.movieRole`) ?? [];
  const nameError = form.formState.errors?.persons?.[index]?.name?.message as string | undefined;
  const roleError = form.formState.errors?.persons?.[index]?.movieRole?.message as string | undefined;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    form.setValue(`persons.${index}.avatarFile`, file, { shouldDirty: true });
    const reader = new FileReader();
    reader.onload = () => form.setValue(`persons.${index}.avatarPreview`, reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleRole(role: "DIRECTOR" | "ACTOR") {
    const next = selected.includes(role)
      ? selected.filter((r) => r !== role)
      : [...selected, role];
    form.setValue(`persons.${index}.movieRole`, next, { shouldValidate: true });
  }

  return (
    <div className="flex gap-3 p-4 rounded-xl border border-border bg-card group relative">
      {/* Avatar upload */}
      <div className="shrink-0">
        <label
          className="relative w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden bg-muted transition-colors group/avatar"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <User2 size={20} className="text-muted-foreground group-hover/avatar:text-primary transition-colors" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <Camera size={14} className="text-white" />
          </div>
        </label>
      </div>

      {/* Fields */}
      <div className="flex-1 min-w-0 space-y-2.5">
        <div>
          <Input
            {...form.register(`persons.${index}.name`)}
            placeholder="Họ và tên..."
            className={cn("h-9 text-sm", nameError && "border-destructive focus-visible:ring-destructive/20")}
          />
          {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleRole("ACTOR")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all",
              selected.includes("ACTOR")
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
            )}
          >
            <User2 size={13} /> Diễn viên
          </button>
          <button
            type="button"
            onClick={() => toggleRole("DIRECTOR")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all",
              selected.includes("DIRECTOR")
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
            )}
          >
            <Clapperboard size={13} /> Đạo diễn
          </button>
        </div>
        {roleError && <p className="text-xs text-destructive">{roleError}</p>}
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function PersonBulkDialog({ open, onOpenChange, onSubmit, isSubmitting }: PersonBulkDialogProps) {
  const form = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { persons: [{ name: "", movieRole: ["ACTOR"], avatarFile: undefined, avatarPreview: undefined }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "persons" });

  useEffect(() => {
    if (open) {
      form.reset({ persons: [{ name: "", movieRole: ["ACTOR"], avatarFile: undefined, avatarPreview: undefined }] });
    }
  }, [open, form]);

  async function handleSubmit(data: BulkForm) {
    await onSubmit(data.persons.map((p) => ({
      name: p.name,
      movieRole: p.movieRole,
      avatarFile: p.avatarFile,
    })));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">

          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold">Thêm nhiều nhân sự</DialogTitle>
              <div className="text-xs text-muted-foreground flex items-center">
                Thêm nhiều diễn viên / đạo diễn cùng lúc
                <Badge variant="secondary" className="ml-2 rounded-full text-[10px] px-2">{fields.length}</Badge>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {fields.map((field, index) => (
              <PersonRow
                key={field.id}
                index={index}
                form={form}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={() => append({ name: "", movieRole: ["ACTOR"], avatarFile: undefined, avatarPreview: undefined })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm font-semibold text-muted-foreground hover:text-primary transition-all"
            >
              <Plus size={16} /> Thêm nhân sự
            </button>
          </div>

          <div className="border-t border-border bg-card px-6 py-3.5 flex items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-9 text-xs font-semibold">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32 h-9 text-xs font-semibold">
              {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Thêm {fields.length} nhân sự
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
