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
import { roomFormSchema, type RoomFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminRoom, AdminCinema, RoomType, RoomStatus } from "@/types/admin.type";
import { ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS } from "./RoomColumns";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: AdminRoom | null;
  defaultCinemaId?: number | null;
  cinemas: AdminCinema[];
  onSubmit: (data: RoomFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  defaultCinemaId,
  cinemas,
  onSubmit,
  isSubmitting,
}: RoomFormDialogProps) {
  const isCreateMode = !room;

  const defaultValues = {
    name:       room?.name              ?? "",
    capacity:   room?.capacity          ?? 0,
    cinemaId:   room?.cinemas?.cinemaId ?? defaultCinemaId ?? 0,
    roomType:   (room?.roomType         ?? "STANDARD") as RoomType,
    roomStatus: (room?.roomStatus       ?? "OPERATIONAL") as RoomStatus,
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isCreateMode ? "Thêm phòng chiếu" : "Chỉnh sửa phòng chiếu"}
      subtitle={!isCreateMode ? `${room.cinemas?.name ?? ""} — ${room.name}` : undefined}
      updatedAt={null}
      schema={roomFormSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isCreateMode ? "Thêm phòng" : "Lưu thay đổi"}
      maxWidth="max-w-lg"
    >
      {(form) => (
        <>
          {isCreateMode && (
            <div className="space-y-2">
              <Label>
                Rạp chiếu <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(form.watch("cinemaId") || "")}
                onValueChange={(val) => form.setValue("cinemaId", Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn rạp chiếu" />
                </SelectTrigger>
                <SelectContent>
                  {cinemas.map((c) => (
                    <SelectItem key={c.cinemaId} value={String(c.cinemaId)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.cinemaId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cinemaId.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="room-name">
              Tên phòng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="room-name"
              {...form.register("name")}
              placeholder="VD: Phòng 1, Phòng IMAX A..."
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-capacity">
              Sức chứa (ghế) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="room-capacity"
              type="number"
              min={1}
              {...form.register("capacity", { valueAsNumber: true })}
              placeholder="VD: 120"
            />
            {form.formState.errors.capacity && (
              <p className="text-xs text-destructive">{form.formState.errors.capacity.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Loại phòng <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("roomType")}
                onValueChange={(val) => form.setValue("roomType", val as RoomType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Trạng thái vận hành <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("roomStatus")}
                onValueChange={(val) => form.setValue("roomStatus", val as RoomStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isCreateMode && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
              Lưu ý: Không thể đổi loại phòng khi phòng đang có suất chiếu đã lên lịch.
            </p>
          )}
        </>
      )}
    </AdminFormDialog>
  );
}
