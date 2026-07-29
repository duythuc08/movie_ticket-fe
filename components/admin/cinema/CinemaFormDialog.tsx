"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Button } from "@/components/ui/button";
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
import type { AdminCinema, AdminCinemaDetail, CinemaStatus, RoomStatus, RoomType } from "@/types/admin.type";
import { Building2, Mail, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { CINEMA_STATUS_OPTIONS } from "./CinemaColumns";

interface CinemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cinema?: AdminCinemaDetail | AdminCinema | null;
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
  const initialRooms = !isCreateMode && "rooms" in cinema && cinema.rooms ? cinema.rooms : [];

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isCreateMode ? "Thêm rạp chiếu mới" : "Chỉnh sửa rạp chiếu"}
      subtitle={!isCreateMode ? cinema.name : undefined}
      updatedAt={null}
      resetKey={cinema && "cinemaId" in cinema ? cinema.cinemaId : "create"}
      schema={cinemaFormSchema}
      defaultValues={{
        name:         cinema?.name         ?? "",
        address:      cinema?.address      ?? "",
        phoneNumber:  cinema?.phoneNumber  ?? "",
        email:        cinema?.email        ?? "",
        cinemaStatus: cinema?.cinemaStatus ?? "OPERATIONAL",
        rooms: initialRooms.map((r) => ({
          roomId: r.roomId,
          name: r.name,
          capacity: r.capacity,
          roomType: r.roomType,
          roomStatus: r.roomStatus,
        })),
      }}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isCreateMode ? "Tạo rạp" : "Lưu thay đổi"}
      maxWidth="max-w-3xl"
    >
      {(form) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { fields, append, remove } = useFieldArray({
          control: form.control,
          name: "rooms",
        });

        return (
        <>
          <div className="space-y-2">
            <Label htmlFor="cinema-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
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
            <Label htmlFor="cinema-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
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
              <Label htmlFor="cinema-phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
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
              <Label htmlFor="cinema-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
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
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Trạng thái vận hành <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("cinemaStatus")}
              onValueChange={(val) => form.setValue("cinemaStatus", val as CinemaStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent data-admin="">
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

          {!isCreateMode && (
            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  Danh sách phòng chiếu
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8"
                  onClick={() => append({ roomId: null, name: "", capacity: 0, roomType: "TWO_D", roomStatus: "OPERATIONAL" })}
                >
                  <Plus className="h-4 w-4" /> Thêm phòng
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="grid grid-cols-[1fr_80px_120px_120px_auto] gap-3 px-3 pb-1">
                  <Label className="text-xs text-muted-foreground">Tên phòng</Label>
                  <Label className="text-xs text-muted-foreground">Sức chứa</Label>
                  <Label className="text-xs text-muted-foreground">Loại</Label>
                  <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                  <div className="w-9"></div>
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_80px_120px_120px_auto] gap-3 items-start p-3 border rounded-lg bg-muted/20 relative mb-4">
                  <div className="relative">
                    <Input className="h-9" {...form.register(`rooms.${index}.name`)} placeholder="Tên phòng" />
                    {form.formState.errors.rooms?.[index]?.name && (
                      <p className="text-[10px] text-destructive absolute -bottom-4 left-0 truncate w-full">{form.formState.errors.rooms[index]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <Input className="h-9" type="number" {...form.register(`rooms.${index}.capacity`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Select
                      value={form.watch(`rooms.${index}.roomType`)}
                      onValueChange={(val) => form.setValue(`rooms.${index}.roomType`, val as RoomType)}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent data-admin="">
                        <SelectItem value="TWO_D">2D</SelectItem>
                        <SelectItem value="THREE_D">3D</SelectItem>
                        <SelectItem value="IMAX">IMAX</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={form.watch(`rooms.${index}.roomStatus`)}
                      onValueChange={(val) => form.setValue(`rooms.${index}.roomStatus`, val as RoomStatus)}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent data-admin="">
                        <SelectItem value="OPERATIONAL">Hoạt động</SelectItem>
                        <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                        <SelectItem value="CLEANING">Dọn dẹp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                  Chưa có phòng chiếu nào.
                </div>
              )}
            </div>
          )}
        </>
      )}}
    </AdminFormDialog>
  );
}
