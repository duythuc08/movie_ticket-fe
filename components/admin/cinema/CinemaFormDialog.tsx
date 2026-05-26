"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cinemaFormSchema, type CinemaFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminCinema, CinemaStatus } from "@/types/admin.type";
import { CINEMA_STATUS_OPTIONS } from "./CinemaColumns";

interface CinemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cinema?: AdminCinema | null;
  onSubmit: (data: CinemaFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function CinemaFormDialog({
  open,
  onOpenChange,
  cinema,
  onSubmit,
  isSubmitting,
}: CinemaFormDialogProps) {
  const isCreateMode = !cinema;

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isCreateMode ? "Thêm rạp chiếu mới" : "Chỉnh sửa rạp chiếu"}
      subtitle={!isCreateMode ? cinema.name : undefined}
      updatedAt={null}
      schema={cinemaFormSchema}
      defaultValues={{
        name:         cinema?.name         ?? "",
        address:      cinema?.address      ?? "",
        phoneNumber:  cinema?.phoneNumber  ?? "",
        email:        cinema?.email        ?? "",
        cinemaStatus: cinema?.cinemaStatus ?? "OPERATIONAL",
      }}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isCreateMode ? "Tạo rạp" : "Lưu thay đổi"}
      maxWidth="max-w-lg"
    >
      {(form) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="cinema-name">
              Tên rạp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cinema-name"
              {...form.register("name")}
              placeholder="VD: CGV Vincom Center"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cinema-address">
              Địa chỉ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cinema-address"
              {...form.register("address")}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
            />
            {form.formState.errors.address && (
              <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cinema-phone">
                Điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cinema-phone"
                {...form.register("phoneNumber")}
                placeholder="028 1234 5678"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-xs text-destructive">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cinema-email"
                type="email"
                {...form.register("email")}
                placeholder="contact@cinema.vn"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Trạng thái vận hành <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("cinemaStatus")}
              onValueChange={(val) => form.setValue("cinemaStatus", val as CinemaStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {CINEMA_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.cinemaStatus && (
              <p className="text-xs text-destructive">{form.formState.errors.cinemaStatus.message}</p>
            )}
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
