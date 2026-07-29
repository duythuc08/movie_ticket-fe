import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { SingleSelectWithSearch } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { pricePolicySchema, type PricePolicyValues } from "@/lib/validations/admin/pricePolicy.schema";
import { fetchActiveCinemasForSelect } from "@/services/admin/adminCinemaService";
import { adminPricePolicyService } from "@/services/admin/adminPricePolicyService";
import type { PricePolicy } from "@/types/admin/pricePolicy";
import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

interface PricePolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  policy?: PricePolicy | null;
}

export const PricePolicyFormDialog = ({
  open, onOpenChange, onSuccess, policy,
}: PricePolicyFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cinemaOptions, setCinemaOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!token || !open) return;
    fetchActiveCinemasForSelect(token)
      .then((cinemas) => setCinemaOptions(cinemas.map((c) => ({ value: String(c.cinemaId), label: c.name }))))
      .catch(() => { });
  }, [token, open]);

  const isEdit = !!policy;

  const defaultValues: PricePolicyValues = useMemo(() => ({
    cinemaId: policy?.cinemaId ?? 0,
    name: policy?.name ?? "",
    isActive: policy?.isActive ?? true,
    effectiveFrom: policy?.effectiveFrom ?? "",
    effectiveTo: policy?.effectiveTo ?? "",
  }), [policy]);

  const onSubmit = async (values: PricePolicyValues) => {
    if (!token) return;
    setIsSubmitting(true);
    const payload = { ...values, effectiveTo: values.effectiveTo || undefined };
    try {
      if (isEdit) {
        await adminPricePolicyService.updatePricePolicy(token, policy!.pricePolicyId, payload);
        toast.success("Cập nhật chính sách giá thành công");
      } else {
        await adminPricePolicyService.createPricePolicy(token, payload);
        toast.success("Tạo chính sách giá thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu chính sách giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Chỉnh sửa chính sách giá" : "Tạo chính sách giá mới"}
      subtitle={isEdit ? `#${policy!.pricePolicyId} — ${policy!.name}` : undefined}
      updatedAt={policy?.updatedAt}
      resetKey={policy?.pricePolicyId ?? "create"}
      schema={pricePolicySchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Cập nhật" : "Tạo chính sách"}
      maxWidth="max-w-lg"
    >
      {(form) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 font-medium">Rạp áp dụng <span className="text-destructive">*</span></Label>
            <Controller
              name="cinemaId"
              control={form.control}
              render={({ field }) => (
                <SingleSelectWithSearch
                  options={cinemaOptions}
                  value={field.value ? String(field.value) : ""}
                  onChange={(v) => field.onChange(Number(v))}
                  placeholder="Chọn rạp..."
                  searchPlaceholder="Tìm rạp..."
                />
              )}
            />
            {form.formState.errors.cinemaId && (
              <p className="text-xs text-destructive">{form.formState.errors.cinemaId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 font-medium">Tên chính sách <span className="text-destructive">*</span></Label>
            <Input {...form.register("name")} placeholder="VD: Bảng giá chuẩn 2026" className="bg-background" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 font-medium">Hiệu lực từ <span className="text-destructive">*</span></Label>
              <Input type="date" {...form.register("effectiveFrom")} className="bg-background" />
              {form.formState.errors.effectiveFrom && (
                <p className="text-xs text-destructive">{form.formState.errors.effectiveFrom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Hiệu lực đến</Label>
              <Input type="date" {...form.register("effectiveTo")} className="bg-background" />
              {form.formState.errors.effectiveTo && (
                <p className="text-xs text-destructive">{form.formState.errors.effectiveTo.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-4 border-border/60">
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label className="font-medium">Kích hoạt chính sách này</Label>
          </div>
        </div>
      )}
    </AdminFormDialog>
  );
};
