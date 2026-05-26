"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seatSetupDimensionSchema, type SeatSetupDimensionSchema } from "@/lib/validations/admin.schemas";
import type { SeatType } from "@/types/admin.type";

const SEAT_TYPE_CYCLE: (SeatType | null)[] = [null, "STANDARD", "VIP", "COUPLE"];

const SETUP_CELL_CLASSES: Record<string, string> = {
  null:     "bg-muted/60 border-border text-muted-foreground",
  STANDARD: "bg-blue-100 border-blue-300 text-blue-800",
  VIP:      "bg-purple-100 border-purple-300 text-purple-800",
  COUPLE:   "bg-pink-100 border-pink-300 text-pink-800",
};

interface SeatSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  roomName: string;
  onSetupComplete: (rows: number, cols: number, seatTypes: (SeatType | null)[][]) => Promise<void>;
  isSubmitting: boolean;
}

export function SeatSetupDialog({
  open,
  onOpenChange,
  roomName,
  onSetupComplete,
  isSubmitting,
}: SeatSetupDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<(SeatType | null)[][]>([]);
  const [dims, setDims] = useState<SeatSetupDimensionSchema | null>(null);

  const form = useForm<SeatSetupDimensionSchema>({
    resolver: zodResolver(seatSetupDimensionSchema),
    defaultValues: { rows: 8, cols: 10 },
  });

  function handleClose() {
    if (isSubmitting) return;
    setStep(1);
    setGrid([]);
    setDims(null);
    form.reset({ rows: 8, cols: 10 });
    onOpenChange(false);
  }

  function handleDimsSubmit(data: SeatSetupDimensionSchema) {
    const newGrid: (SeatType | null)[][] = Array.from({ length: data.rows }, () =>
      Array.from({ length: data.cols }, () => "STANDARD" as SeatType)
    );
    setDims(data);
    setGrid(newGrid);
    setStep(2);
  }

  function handleCellClick(rowIdx: number, colIdx: number) {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      const current = next[rowIdx][colIdx];
      const currentIndex = SEAT_TYPE_CYCLE.indexOf(current);
      next[rowIdx][colIdx] = SEAT_TYPE_CYCLE[(currentIndex + 1) % SEAT_TYPE_CYCLE.length];
      return next;
    });
  }

  async function handleSubmitSetup() {
    if (!dims) return;
    await onSetupComplete(dims.rows, dims.cols, grid);
    handleClose();
  }

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 [&>button]:hidden">
        <DialogHeader className="border-b px-6 py-4 shrink-0">
          <DialogTitle className="text-base">
            Thiết lập sơ đồ ghế — {roomName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === 1 ? "Bước 1: Xác định kích thước phòng" : "Bước 2: Cấu hình loại ghế"}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <form id="dims-form" onSubmit={form.handleSubmit(handleDimsSubmit)} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="setup-rows">
                  Số hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="setup-rows"
                  type="number"
                  min={1}
                  max={30}
                  {...form.register("rows", { valueAsNumber: true })}
                />
                {form.formState.errors.rows && (
                  <p className="text-xs text-destructive">{form.formState.errors.rows.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-cols">
                  Số cột (ghế mỗi hàng) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="setup-cols"
                  type="number"
                  min={1}
                  max={30}
                  {...form.register("cols", { valueAsNumber: true })}
                />
                {form.formState.errors.cols && (
                  <p className="text-xs text-destructive">{form.formState.errors.cols.message}</p>
                )}
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                Cảnh báo: Thiết lập mới sẽ xóa toàn bộ sơ đồ ghế hiện tại của phòng.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Click để đổi loại ghế:</span>
                {(["STANDARD", "VIP", "COUPLE"] as SeatType[]).map((t) => (
                  <span key={t} className="flex items-center gap-1">
                    <span className={cn("h-3.5 w-3.5 rounded border inline-block", SETUP_CELL_CLASSES[t])} />
                    {t === "STANDARD" ? "Thường" : t === "VIP" ? "VIP" : "Đôi"}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className={cn("h-3.5 w-3.5 rounded border inline-block", SETUP_CELL_CLASSES["null"])} />
                  Bỏ ghế
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block space-y-1">
                  {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex items-center gap-1">
                      <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                        {rowLabels[rowIdx]}
                      </span>
                      <div className="flex gap-1">
                        {row.map((cellType, colIdx) => (
                          <button
                            key={colIdx}
                            type="button"
                            onClick={() => handleCellClick(rowIdx, colIdx)}
                            className={cn(
                              "h-8 w-8 rounded border text-[9px] font-semibold transition-colors hover:opacity-80",
                              SETUP_CELL_CLASSES[cellType ?? "null"]
                            )}
                          >
                            {cellType ? `${rowLabels[rowIdx]}${colIdx + 1}` : "×"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Tổng ghế hợp lệ:{" "}
                <strong>{grid.flat().filter(Boolean).length}</strong> /{" "}
                {(dims?.rows ?? 0) * (dims?.cols ?? 0)}
              </p>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-3 flex items-center justify-between shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <div className="flex gap-2">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Quay lại
              </Button>
            )}
            {step === 1 ? (
              <Button type="submit" form="dims-form">
                Tiếp theo
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmitSetup} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận thiết lập
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
