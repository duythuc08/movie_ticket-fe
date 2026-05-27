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
    roomType:   (room?.roomType         ?? "") as RoomType,
    roomStatus: (room?.roomStatus       ?? "") as RoomStatus,
    rowCount:   undefined,
    columnCount: undefined,
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
                <SelectContent data-admin="">
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

          {isCreateMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-row-count">
                  Số hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="room-row-count"
                  type="number"
                  min={1}
                  max={30}
                  {...form.register("rowCount", { valueAsNumber: true })}
                />
                {form.formState.errors.rowCount && (
                  <p className="text-xs text-destructive">{form.formState.errors.rowCount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-col-count">
                  Số cột (Ghế/hàng) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="room-col-count"
                  type="number"
                  min={1}
                  max={30}
                  {...form.register("columnCount", { valueAsNumber: true })}
                />
                {form.formState.errors.columnCount && (
                  <p className="text-xs text-destructive">{form.formState.errors.columnCount.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="room-capacity">
                Sức chứa hiện tại (ghế)
              </Label>
              <Input
                id="room-capacity"
                type="number"
                disabled
                value={form.watch("capacity")}
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Sức chứa được tính toán tự động dựa trên Sơ đồ ghế hợp lệ.</p>
            </div>
          )}

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
                <SelectContent data-admin="">
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
                <SelectContent data-admin="">
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
