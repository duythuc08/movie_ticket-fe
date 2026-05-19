"use client";

import * as React from "react";
import {
  useForm,
  type UseFormReturn,
  type FieldValues,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps<TSchema extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<TSchema, any>;
  defaultValues?: DefaultValues<TSchema>;
  onSubmit: (values: TSchema) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: (form: UseFormReturn<TSchema>) => React.ReactNode;
}

export function FormDialog<TSchema extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Lưu",
  children,
}: FormDialogProps<TSchema>) {
  const form = useForm<TSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    form.reset(defaultValues);
    onOpenChange(false);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4 border-none p-0 m-0">
            {children(form)}
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
