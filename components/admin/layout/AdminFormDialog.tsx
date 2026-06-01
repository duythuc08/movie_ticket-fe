"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from "react-hook-form";
import type { ZodType } from "zod";

interface AdminFormDialogProps<TSchema extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  updatedAt?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<TSchema, any>;
  defaultValues?: DefaultValues<TSchema>;
  onSubmit: (values: TSchema) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  readOnly?: boolean;
  onEdit?: () => void;
  maxWidth?: string;
  children: (form: UseFormReturn<TSchema>) => React.ReactNode;
}

export function AdminFormDialog<TSchema extends FieldValues>({
  open,
  onOpenChange,
  title,
  subtitle,
  updatedAt,
  schema,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Lưu",
  readOnly = false,
  onEdit,
  maxWidth = "max-w-lg",
  children,
}: AdminFormDialogProps<TSchema>) {
  const form = useForm<TSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    form.reset(defaultValues);
    onOpenChange(false);
  }

  const updatedAtLabel = updatedAt
    ? new Date(updatedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-admin="" className={`${maxWidth} max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden`}>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">

          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate max-w-xl">{subtitle}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <fieldset
              disabled={isSubmitting || readOnly}
              className={`border-none m-0 p-0 ${readOnly ? "pointer-events-none select-none" : ""}`}
            >
              <div className="space-y-4">
                {children(form)}
              </div>
            </fieldset>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-muted-foreground">
              {updatedAtLabel ? (
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground/80">
                  <Clock size={13} className="text-muted-foreground/60" />
                  Cập nhật lần cuối: {updatedAtLabel}
                </span>
              ) : !readOnly ? (
                <span className="font-medium">
                  Lưu ý: Các trường đánh dấu <span className="text-destructive">*</span> không được bỏ trống.
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {readOnly ? (
                <>
                  <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs font-semibold">
                    Đóng
                  </Button>
                  {onEdit && (
                    <Button type="button" onClick={onEdit} className="min-w-[120px] h-9 text-xs font-semibold">
                      Chỉnh sửa
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-9 text-xs font-semibold">
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[120px] h-9 text-xs font-semibold">
                    {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {submitLabel}
                  </Button>
                </>
              )}
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
