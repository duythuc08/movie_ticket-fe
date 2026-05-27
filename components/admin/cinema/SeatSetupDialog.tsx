"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Loader2, MousePointer2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seatSetupDimensionSchema, type SeatSetupDimensionSchema } from "@/lib/validations/admin.schemas";
import type { SeatType } from "@/types/admin.type";

const SETUP_CELL_CLASSES: Record<string, string> = {
  null:     "bg-muted/40 border-border border-dashed text-muted-foreground hover:bg-muted",
  STANDARD: "bg-slate-200 border-slate-300 text-slate-800",
  VIP:      "bg-amber-200 border-amber-300 text-amber-800",
  COUPLE:   "bg-rose-200 border-rose-300 text-rose-800",
};

interface SeatSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  roomName: string;
  initialRows?: number;
  initialCols?: number;
  onSetupComplete: (rows: number, cols: number, seatTypes: (SeatType | null)[][]) => Promise<void>;
  isSubmitting: boolean;
}

export function SeatSetupDialog({
  open,
  onOpenChange,
  roomName,
  initialRows,
  initialCols,
  onSetupComplete,
  isSubmitting,
}: SeatSetupDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<(SeatType | null)[][]>([]);
  const [dims, setDims] = useState<SeatSetupDimensionSchema | null>(null);
  
  // Paint tool state
  const [activeTool, setActiveTool] = useState<SeatType>("STANDARD");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"PAINT" | "ERASE" | null>(null);

  const form = useForm<SeatSetupDimensionSchema>({
    resolver: zodResolver(seatSetupDimensionSchema),
    defaultValues: { rows: 8, cols: 10 },
  });

  useEffect(() => {
    if (open) {
      if (initialRows && initialCols) {
        setDims({ rows: initialRows, cols: initialCols });
        // Khởi tạo Grid rỗng
        setGrid(Array.from({ length: initialRows }, () => Array.from({ length: initialCols }, () => null)));
        setStep(2);
      } else {
        setStep(1);
        setDims(null);
        setGrid([]);
        form.reset({ rows: undefined, cols: undefined });
      }
      setActiveTool("STANDARD");
      setIsDragging(false);
    }
  }, [open, initialRows, initialCols, form]);

  function handleClose() {
    if (isSubmitting) return;
    onOpenChange(false);
  }

  function handleDimsSubmit(data: SeatSetupDimensionSchema) {
    const newGrid: (SeatType | null)[][] = Array.from({ length: data.rows }, () =>
      Array.from({ length: data.cols }, () => null)
    );
    setDims(data);
    setGrid(newGrid);
    setStep(2);
  }

  const applyActionToCell = useCallback((r: number, c: number, currentGrid: (SeatType | null)[][], mode: "PAINT" | "ERASE") => {
    if (!dims) return currentGrid;
    const next = currentGrid.map((row) => [...row]);
    
    if (mode === "ERASE") {
      if (next[r][c] === "COUPLE") {
        next[r][c] = null;
        if (c < dims.cols - 1 && next[r][c + 1] === "COUPLE") next[r][c + 1] = null;
        else if (c > 0 && next[r][c - 1] === "COUPLE") next[r][c - 1] = null;
      } else {
        next[r][c] = null;
      }
      return next;
    }

    if (activeTool === "COUPLE") {
      if (currentGrid[r][c] === "COUPLE") return currentGrid;

      if (c < dims.cols - 1) {
        next[r][c] = "COUPLE";
        next[r][c + 1] = "COUPLE";
      } else if (c > 0) {
        next[r][c - 1] = "COUPLE";
        next[r][c] = "COUPLE";
      }
    } else {
      next[r][c] = activeTool;
    }
    return next;
  }, [activeTool, dims]);

  function handlePointerDown(r: number, c: number) {
    setIsDragging(true);
    const isSame = grid[r][c] === activeTool;
    const mode = isSame ? "ERASE" : "PAINT";
    setDragMode(mode);
    setGrid((prev) => applyActionToCell(r, c, prev, mode));
  }

  function handlePointerEnter(r: number, c: number) {
    if (isDragging && dragMode) {
      setGrid((prev) => applyActionToCell(r, c, prev, dragMode));
    }
  }

  function handlePointerUp() {
    setIsDragging(false);
    setDragMode(null);
  }

  async function handleSubmitSetup() {
    if (!dims) return;
    await onSetupComplete(dims.rows, dims.cols, grid);
  }

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-admin="" className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 [&>button]:hidden">
        <DialogHeader className="border-b px-6 py-4 shrink-0 bg-background flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="text-base">
              Thiết lập sơ đồ ghế — {roomName}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1 ? "Bước 1: Xác định kích thước phòng" : "Bước 2: Cấu hình loại ghế (Kéo thả để vẽ)"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" onClick={handleClose} disabled={isSubmitting}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-muted/10" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
          <div className="px-6 py-5 min-h-full">
            {step === 1 ? (
              <form id="dims-form" onSubmit={form.handleSubmit(handleDimsSubmit)} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="setup-rows">Số hàng <span className="text-destructive">*</span></Label>
                  <Input id="setup-rows" type="number" min={1} max={30} {...form.register("rows", { valueAsNumber: true })} />
                  {form.formState.errors.rows && <p className="text-xs text-destructive">{form.formState.errors.rows.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-cols">Số cột (ghế mỗi hàng) <span className="text-destructive">*</span></Label>
                  <Input id="setup-cols" type="number" min={1} max={30} {...form.register("cols", { valueAsNumber: true })} />
                  {form.formState.errors.cols && <p className="text-xs text-destructive">{form.formState.errors.cols.message}</p>}
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2 border border-amber-200">
                  Cảnh báo: Thiết lập mới sẽ tạo một lưới trống và xóa sơ đồ ghế hiện tại.
                </p>
              </form>
            ) : (
              <div className="space-y-6 flex flex-col items-center">
                <div className="flex flex-wrap items-center justify-center gap-3 bg-background p-2.5 rounded-lg border shadow-sm sticky top-0 z-10">
                  <span className="text-xs font-semibold text-muted-foreground mr-2 flex items-center gap-1">
                    <MousePointer2 className="w-3.5 h-3.5" />
                    Công cụ vẽ:
                  </span>
                  {(["STANDARD", "VIP", "COUPLE"] as SeatType[]).map((t) => {
                    const isActive = activeTool === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTool(t)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                          isActive 
                            ? "ring-2 ring-primary ring-offset-1 border-primary bg-primary/5" 
                            : "border-transparent hover:bg-muted"
                        )}
                      >
                        <span className={cn("h-4 w-4 rounded border block", SETUP_CELL_CLASSES[t])} />
                        {t === "STANDARD" ? "Thường" : t === "VIP" ? "VIP" : "Đôi"}
                      </button>
                    );
                  })}
                </div>

                <div className="overflow-x-auto p-4 bg-background rounded-xl border shadow-sm touch-none w-full">
                  <div className="w-max mx-auto flex flex-col items-center gap-1.5 select-none">
                    <div className="mb-8 flex flex-col items-center w-full max-w-2xl">
                      <div className="w-3/4 h-2 bg-gradient-to-b from-primary/40 to-transparent rounded-t-full blur-[2px]" />
                      <div className="w-full text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2">
                        Màn hình
                      </div>
                    </div>

                    {grid.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-right text-xs font-bold text-muted-foreground mr-2">
                          {rowLabels[rowIdx] || rowIdx}
                        </span>
                        <div className="flex gap-1.5">
                          {row.map((cellType, colIdx) => (
                            <button
                              key={colIdx}
                              type="button"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                handlePointerDown(rowIdx, colIdx);
                              }}
                              onPointerEnter={(e) => {
                                e.preventDefault();
                                handlePointerEnter(rowIdx, colIdx);
                              }}
                              className={cn(
                                "h-8 w-8 sm:h-10 sm:w-10 rounded-t-lg rounded-b-sm border text-[10px] sm:text-xs font-bold transition-colors select-none",
                                SETUP_CELL_CLASSES[cellType ?? "null"]
                              )}
                            >
                              {cellType ? colIdx + 1 : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 text-primary text-sm px-4 py-2 rounded-full font-medium">
                  Tổng ghế hợp lệ: {grid.flat().filter(Boolean).length} / {(dims?.rows ?? 0) * (dims?.cols ?? 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-background flex items-center justify-between shrink-0">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <div className="flex gap-2">
            {step === 2 && !initialRows && (
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Đổi kích thước
              </Button>
            )}
            {step === 1 ? (
              <Button type="submit" form="dims-form">
                Tiếp theo
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmitSetup} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu sơ đồ ghế
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
