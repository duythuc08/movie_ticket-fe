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
      <DialogContent data-admin="" className={`${maxWidth} max-h-[88vh] overflow-hidden gap-0 p-0 [&>button]:hidden`}>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-h-[88vh] flex-col">

          <DialogHeader className="z-10 flex shrink-0 flex-row items-start justify-between border-b border-border bg-card px-6 py-4 space-y-0">
            <div className="space-y-0.5 min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-tight text-foreground">
                {title}
              </DialogTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 -mt-1 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X size={15} />
            </Button>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <fieldset
              disabled={isSubmitting || readOnly}
              className={`m-0 border-none p-0 ${readOnly ? "pointer-events-none select-none" : ""}`}
            >
              <div className="px-6 py-5 space-y-4">
                {children(form)}
              </div>
            </fieldset>
          </div>

          <div className="z-10 flex shrink-0 items-center justify-between gap-4 border-t border-border bg-card px-6 py-3">
            <div className="text-xs text-muted-foreground">
              {updatedAtLabel ? (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Cập nhật lần cuối: {updatedAtLabel}
                </span>
              ) : !readOnly ? (
                <span>Trường có dấu <span className="text-destructive">*</span> là bắt buộc</span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {readOnly ? (
                <Button type="button" variant="outline" onClick={handleClose}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-24">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
