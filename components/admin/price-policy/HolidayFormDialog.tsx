import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { holidaySchema, type HolidayValues } from "@/lib/validations/admin/pricePolicy.schema";
import { adminHolidayService } from "@/services/admin/adminHolidayService";
import type { Holiday } from "@/types/admin/pricePolicy";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  holiday?: Holiday | null;
}

export const HolidayFormDialog = ({
  open, onOpenChange, onSuccess, holiday,
}: HolidayFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!holiday;

  const defaultValues: HolidayValues = useMemo(() => ({
    name: holiday?.name ?? "",
    dateFrom: holiday?.dateFrom ?? "",
    dateTo: holiday?.dateTo ?? "",
  }), [holiday]);

  const onSubmit = async (values: HolidayValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await adminHolidayService.updateHoliday(token, holiday!.holidayId, values);
        toast.success("Cập nhật ngày lễ thành công");
      } else {
        await adminHolidayService.createHoliday(token, values);
        toast.success("Tạo ngày lễ thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu ngày lễ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Chỉnh sửa ngày lễ" : "Thêm ngày lễ mới"}
      subtitle={isEdit ? `#${holiday!.holidayId} — ${holiday!.name}` : undefined}
      resetKey={holiday?.holidayId ?? "create"}
      schema={holidaySchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Cập nhật" : "Tạo kỳ nghỉ"}
      maxWidth="max-w-md"
    >
      {(form) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 font-medium">Tên kỳ nghỉ <span className="text-destructive">*</span></Label>
            <Input {...form.register("name")} placeholder="VD: Tết Nguyên Đán 2026" className="bg-background" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 font-medium">Từ ngày <span className="text-destructive">*</span></Label>
              <Input type="date" {...form.register("dateFrom")} className="bg-background" />
              {form.formState.errors.dateFrom && (
                <p className="text-xs text-destructive">{form.formState.errors.dateFrom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 font-medium">Đến ngày <span className="text-destructive">*</span></Label>
              <Input type="date" {...form.register("dateTo")} className="bg-background" />
              {form.formState.errors.dateTo && (
                <p className="text-xs text-destructive">{form.formState.errors.dateTo.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminFormDialog>
  );
};
