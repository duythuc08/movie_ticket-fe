"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

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
import type { AdminCinema, AdminRoom, RoomStatus, RoomType } from "@/types/admin.type";
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from "./RoomColumns";

function RoomDefaultValueSync({
  form,
  roomType,
  roomStatus,
}: {
  form: UseFormReturn<RoomFormSchema>;
  roomType: RoomType;
  roomStatus: RoomStatus;
}) {
  useEffect(() => {
    form.setValue("roomType", roomType, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    form.setValue("roomStatus", roomStatus, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    form.clearErrors(["roomType", "roomStatus"]);
  }, [form, roomType, roomStatus]);

  return null;
}

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
  const schema = isCreateMode
    ? roomFormSchema.superRefine((data, ctx) => {
      if (data.rowCount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rowCount"],
          message: "Số hàng không được để trống",
        });
      }
      if (data.columnCount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["columnCount"],
          message: "Số cột không được để trống",
        });
      }
    })
    : roomFormSchema;

  const defaultValues = {
    name: room?.name ?? "",
    capacity: room?.capacity ?? 0,
    cinemaId: room?.cinemas?.cinemaId ?? defaultCinemaId ?? 0,
    roomType: (room?.roomType ?? "TWO_D") as RoomType,
    roomStatus: (room?.roomStatus ?? "OPERATIONAL") as RoomStatus,
    rowCount: "" as unknown as number,
    columnCount: "" as unknown as number,
  };

  const roomTypeLabel =
    ROOM_TYPE_OPTIONS.find((opt) => opt.value === defaultValues.roomType)?.label ?? defaultValues.roomType;
  const roomStatusLabel =
    ROOM_STATUS_OPTIONS.find((opt) => opt.value === defaultValues.roomStatus)?.label ?? defaultValues.roomStatus;

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isCreateMode ? "Thêm phòng chiếu" : "Chỉnh sửa phòng chiếu"}
      subtitle={!isCreateMode ? `${room.cinemas?.name ?? ""} - ${room.name}` : undefined}
      updatedAt={null}
      resetKey={room ? `${room.roomId}-${room.roomType}-${room.roomStatus}` : `create-${defaultCinemaId ?? "none"}`}
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isCreateMode ? "Thêm phòng" : "Lưu thay đổi"}
      validationMode="onSubmit"
      maxWidth="max-w-lg"
    >
      {(form) => (
        <>
          <RoomDefaultValueSync
            form={form}
            roomType={defaultValues.roomType}
            roomStatus={defaultValues.roomStatus}
          />

          {isCreateMode && (
            <div className="space-y-2">
              <Label>
                Rạp chiếu <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(form.watch("cinemaId") || "")}
                onValueChange={(val) => form.setValue("cinemaId", Number(val), {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })}
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
                  {...form.register("rowCount", {
                    valueAsNumber: true,
                    required: "Số hàng không được để trống",
                    min: { value: 1, message: "Phải có ít nhất 1 hàng" },
                    max: { value: 30, message: "Tối đa 30 hàng" },
                  })}
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
                  {...form.register("columnCount", {
                    valueAsNumber: true,
                    required: "Số cột không được để trống",
                    min: { value: 1, message: "Phải có ít nhất 1 cột" },
                    max: { value: 30, message: "Tối đa 30 cột" },
                  })}
                />
                {form.formState.errors.columnCount && (
                  <p className="text-xs text-destructive">{form.formState.errors.columnCount.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="room-capacity">Sức chứa hiện tại (ghế)</Label>
              <Input
                id="room-capacity"
                type="number"
                disabled
                value={form.watch("capacity")}
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Sức chứa được tính toán tự động dựa trên Sơ đồ ghế hợp lệ.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại phòng</Label>
              <input type="hidden" {...form.register("roomType")} />
              <Input
                disabled
                value={roomTypeLabel}
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái vận hành</Label>
              <input type="hidden" {...form.register("roomStatus")} />
              <Input
                disabled
                value={roomStatusLabel}
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
