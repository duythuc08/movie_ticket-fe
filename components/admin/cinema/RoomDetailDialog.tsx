"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Pencil, LayoutGrid, MonitorPlay, Building2, Tag, Users, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { AdminRoom, AdminSeat, SeatType } from "@/types/admin.type";
import {
  fetchSeatsByRoom,
  setupSeatsForRoom,
  toggleSeatEntityStatus,
  fetchBlockedShowTimesForSeat,
  updateSeatStatus,
} from "@/services/admin/adminSeatService";
import type { BlockedShowTime, SeatStatus } from "@/types/admin.type";
import { updateAdminRoom } from "@/services/admin/adminRoomService";
import { SeatGrid } from "./SeatGrid";
import { ROOM_TYPE_LABELS, ROOM_TYPE_BADGE_CLASSES } from "./RoomColumns";

const SETUP_CELL_CLASSES: Record<SeatType, string> = {
  STANDARD: "bg-blue-100 border-blue-300 text-blue-800",
  VIP: "bg-purple-100 border-purple-300 text-purple-800",
  COUPLE: "bg-pink-100 border-pink-300 text-pink-800",
};

interface RoomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: AdminRoom | null;
  onEdit?: (room: AdminRoom) => void;
  onRefresh?: () => void;
  defaultEditMode?: boolean;
  initialSetupDims?: { rows: number; cols: number };
}

export function RoomDetailDialog({
  open,
  onOpenChange,
  room,
  onEdit,
  onRefresh,
  defaultEditMode,
  initialSetupDims,
}: RoomDetailDialogProps) {
  const { token } = useAuth();
  const [seats, setSeats] = useState<AdminSeat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [grid, setGrid] = useState<(SeatType | null)[][]>([]);
  const [dims, setDims] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [inputRows, setInputRows] = useState(8);
  const [inputCols, setInputCols] = useState(10);
  const [activeTool, setActiveTool] = useState<SeatType>("STANDARD");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"PAINT" | "ERASE" | null>(null);
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ r: number; c: number } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [chainUnlockOpen, setChainUnlockOpen] = useState(false);
  const [chainUnlockSeat, setChainUnlockSeat] = useState<AdminSeat | null>(null);
  const [blockedShowtimes, setBlockedShowtimes] = useState<BlockedShowTime[]>([]);
  const [selectedShowtimes, setSelectedShowtimes] = useState<number[]>([]);
  const [isUpdatingSeat, setIsUpdatingSeat] = useState(false);

  const loadSeats = useCallback(async () => {
    if (!token || !room) return;
    setIsLoadingSeats(true);
    try {
      const result = await fetchSeatsByRoom(token, room.roomId);
      setSeats(result);
    } catch {
      toast.error("Không thể tải sơ đồ ghế");
    } finally {
      setIsLoadingSeats(false);
    }
  }, [token, room]);

  useEffect(() => {
    if (open) {
      setIsEditMode(!!defaultEditMode);
    } else {
      setSeats([]);
      setGrid([]);
      setDims({ rows: 0, cols: 0 });
      setInputRows(8);
      setInputCols(10);
      setActiveTool("STANDARD");
    }
  }, [open, defaultEditMode]);

  useEffect(() => {
    if (open) {
      loadSeats();
    }
  }, [open, loadSeats]);

  async function handleSeatAction(seat: AdminSeat, actionType: "CHANGE_STATUS" | "TOGGLE_ENTITY", newStatus?: SeatStatus) {
    if (!token || isEditMode) return;
    
    if (actionType === "TOGGLE_ENTITY") {
      const action = seat.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
      try {
        if (seat.seatType === "COUPLE") {
          const partner = seats.find(s => 
            s.seatRow === seat.seatRow && 
            s.seatType === "COUPLE" && 
            (s.seatNumber === seat.seatNumber - 1 || s.seatNumber === seat.seatNumber + 1)
          );
          
          await toggleSeatEntityStatus(token, seat.seatId, seat.entityStatus);
          if (partner) {
            await toggleSeatEntityStatus(token, partner.seatId, partner.entityStatus);
          }
          toast.success(`Đã ${action} ghế đôi ${seat.seatRow}${Math.min(seat.seatNumber, partner?.seatNumber || seat.seatNumber)}-${Math.max(seat.seatNumber, partner?.seatNumber || seat.seatNumber)}`);
        } else {
          await toggleSeatEntityStatus(token, seat.seatId, seat.entityStatus);
          toast.success(`Đã ${action} ghế ${seat.seatRow}${seat.seatNumber}`);
        }
        
        loadSeats();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Không thể ${action} ghế`);
      }
    } else if (actionType === "CHANGE_STATUS" && newStatus) {
      if (newStatus === "NORMAL" && (seat.seatStatus === "BROKEN" || seat.seatStatus === "MAINTENANCE")) {
        try {
          setIsUpdatingSeat(true);
          const blocked = await fetchBlockedShowTimesForSeat(token, seat.seatId);
          if (blocked && blocked.length > 0) {
            setBlockedShowtimes(blocked);
            setSelectedShowtimes(blocked.map(s => s.showTimeId));
            setChainUnlockSeat(seat);
            setChainUnlockOpen(true);
          } else {
            await updateSeatStatusPair(seat, "NORMAL", []);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Không thể kiểm tra suất chiếu bị ảnh hưởng");
        } finally {
          setIsUpdatingSeat(false);
        }
      } else {
        try {
          setIsUpdatingSeat(true);
          await updateSeatStatusPair(seat, newStatus, []);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái");
        } finally {
          setIsUpdatingSeat(false);
        }
      }
    }
  }

  async function updateSeatStatusPair(seat: AdminSeat, status: SeatStatus, unlockShowTimeIds: number[]) {
    if (!token) return;
    await updateSeatStatus(token, seat.seatId, { seatStatus: status, unlockShowTimeIds });
    if (seat.seatType === "COUPLE") {
      const partner = seats.find(s => 
          s.seatRow === seat.seatRow && 
          s.seatType === "COUPLE" && 
          (s.seatNumber === seat.seatNumber - 1 || s.seatNumber === seat.seatNumber + 1)
        );
      if (partner) {
        await updateSeatStatus(token, partner.seatId, { seatStatus: status, unlockShowTimeIds });
      }
    }
    toast.success("Cập nhật trạng thái ghế thành công");
    loadSeats();
  }

  async function handleConfirmChainUnlock() {
    if (!chainUnlockSeat) return;
    try {
      setIsUpdatingSeat(true);
      await updateSeatStatusPair(chainUnlockSeat, "NORMAL", selectedShowtimes);
      setChainUnlockOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi mở khóa ghế");
    } finally {
      setIsUpdatingSeat(false);
    }
  }

  useEffect(() => {
    if (isEditMode && seats.length === 0 && dims.rows === 0 && dims.cols === 0) {
      handleEnterEditMode();
    }
  }, [isEditMode, seats, dims]);

  function handleEnterEditMode() {
    setIsEditMode(true);
    if (seats.length > 0) {
      let maxRowIndex = 0;
      let maxCol = 0;
      seats.forEach(s => {
        const rowIndex = s.seatRow.charCodeAt(0) - 65;
        if (rowIndex > maxRowIndex) maxRowIndex = rowIndex;
        if (s.seatNumber > maxCol) maxCol = s.seatNumber;
      });
      const rows = maxRowIndex + 1;
      const cols = maxCol;
      setInputRows(rows);
      setInputCols(cols);
      setDims({ rows, cols });
      
      const initialGrid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null as SeatType | null));
      seats.forEach(s => {
        const r = s.seatRow.charCodeAt(0) - 65;
        const c = s.seatNumber - 1;
        initialGrid[r][c] = s.seatType;
      });
      setGrid(initialGrid);
    } else {
      const defaultRows = initialSetupDims?.rows || 8;
      const defaultCols = initialSetupDims?.cols || 10;
      setInputRows(defaultRows);
      setInputCols(defaultCols);
      setDims({ rows: defaultRows, cols: defaultCols });
      setGrid(Array.from({ length: defaultRows }, () => Array.from({ length: defaultCols }, () => null)));
    }
  }

  function handleApplyDims() {
    if (seats.length > 0 || grid.some(row => row.some(cell => cell !== null))) {
      setIsAlertOpen(true);
    } else {
      handleApplyDimsConfirm();
    }
  }

  function handleApplyDimsConfirm() {
    setIsAlertOpen(false);
    setDims({ rows: inputRows, cols: inputCols });
    setGrid(Array.from({ length: inputRows }, () => Array.from({ length: inputCols }, () => null)));
  }

  function handleApplyDimsCancel() {
    setIsAlertOpen(false);
    setInputRows(dims.rows);
    setInputCols(dims.cols);
  }

  const applyActionToCell = useCallback((r: number, c: number, currentGrid: (SeatType | null)[][], mode: "PAINT" | "ERASE") => {
    if (!dims) return currentGrid;
    const next = currentGrid.map((row) => [...row]);
    
    let couplePartnerCol = -1;
    if (currentGrid[r][c] === "COUPLE") {
      let countBefore = 0;
      for (let k = c - 1; k >= 0; k--) {
        if (currentGrid[r][k] === "COUPLE") countBefore++;
        else break;
      }
      const isLeft = countBefore % 2 === 0;
      if (isLeft && c < dims.cols - 1 && currentGrid[r][c + 1] === "COUPLE") {
        couplePartnerCol = c + 1;
      } else if (!isLeft && c > 0 && currentGrid[r][c - 1] === "COUPLE") {
        couplePartnerCol = c - 1;
      }
    }

    if (mode === "ERASE") {
      next[r][c] = null;
      if (couplePartnerCol !== -1) next[r][couplePartnerCol] = null;
      return next;
    }

    if (activeTool === "COUPLE") {
      if (currentGrid[r][c] === "COUPLE") return currentGrid;

      if (c < dims.cols - 1) {
        next[r][c] = "COUPLE";
        next[r][c + 1] = "COUPLE";
      } else {
        toast.error("Không đủ không gian tạo ghế đôi tại mép phải");
        return currentGrid;
      }
    } else {
      next[r][c] = activeTool;
      if (couplePartnerCol !== -1) next[r][couplePartnerCol] = activeTool;
    }
    return next;
  }, [activeTool, dims]);

  function handlePointerDown(r: number, c: number) {
    if (!isEditMode) return;
    setIsDragging(true);
    setDragStart({ r, c });
    setDragCurrent({ r, c });
    const isSame = grid[r][c] === activeTool;
    setDragMode(isSame ? "ERASE" : "PAINT");
  }

  function handlePointerEnter(r: number, c: number) {
    if (!isEditMode) return;
    if (isDragging) {
      setDragCurrent({ r, c });
    }
  }

  function handlePointerUp() {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const r1 = Math.min(dragStart.r, dragCurrent.r);
    const r2 = Math.max(dragStart.r, dragCurrent.r);
    let c1 = Math.min(dragStart.c, dragCurrent.c);
    let c2 = Math.max(dragStart.c, dragCurrent.c);

    if (dragMode === "PAINT" && activeTool === "COUPLE") {
      const width = c2 - c1 + 1;
      if (width % 2 !== 0) {
        if (c2 < dims.cols - 1) c2++;
        else if (c1 > 0) c1--;
      }
    }

    let nextGrid = grid.map(row => [...row]);

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (dragMode === "ERASE") {
          nextGrid[r][c] = null;
        } else {
          nextGrid[r][c] = activeTool;
        }
      }
    }

    for (let r = 0; r < dims.rows; r++) {
      let count = 0;
      for (let c = 0; c < dims.cols; c++) {
        if (nextGrid[r][c] === "COUPLE") {
          count++;
        } else {
          if (count % 2 !== 0) nextGrid[r][c - 1] = null;
          count = 0;
        }
      }
      if (count % 2 !== 0) nextGrid[r][dims.cols - 1] = null;
    }

    setGrid(nextGrid);
    setIsDragging(false);
    setDragMode(null);
    setDragStart(null);
    setDragCurrent(null);
  }

  async function handleSaveGrid() {
    if (!token || !room) return;
    setIsSettingUp(true);
    try {
      await setupSeatsForRoom(token, room.roomId, { rows: dims.rows, cols: dims.cols, seatTypes: grid });
      
      let validCount = 0;
      for (let r = 0; r < dims.rows; r++) {
        for (let c = 0; c < dims.cols; c++) {
          if (grid[r][c] !== null) validCount++;
        }
      }

      await updateAdminRoom(token, room.roomId, {
        name: room.name,
        capacity: validCount,
        roomType: room.roomType,
        roomStatus: room.roomStatus
      });

      toast.success("Thiết lập sơ đồ ghế và cập nhật sức chứa thành công");
      setIsEditMode(false);
      loadSeats();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thiết lập thất bại");
    } finally {
      setIsSettingUp(false);
    }
  }

  if (!room) return null;

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-primary" />
                Chi tiết phòng chiếu
              </DialogTitle>
              <p className="text-sm text-muted-foreground truncate max-w-xl">{room.name}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">{room.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Building2 className="w-4 h-4 text-primary/70" />
                  Thuộc rạp: <span className="text-foreground">{room.cinemas.name}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Badge variant="outline" className={`text-xs uppercase tracking-wider font-bold ${ROOM_TYPE_BADGE_CLASSES[room.roomType]}`}>
                  {ROOM_TYPE_LABELS[room.roomType]}
                </Badge>
                <Badge
                  variant={room.roomStatus === "OPERATIONAL" ? "success" : room.roomStatus === "MAINTENANCE" ? "warning" : "secondary"}
                  className="text-[10px] uppercase tracking-wider"
                >
                  {room.roomStatus === "OPERATIONAL" ? "Hoạt động" : room.roomStatus === "MAINTENANCE" ? "Bảo trì" : "Vệ sinh"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-background rounded-lg shadow-sm border text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sức chứa hợp lệ</p>
                  <p className="text-lg font-bold text-foreground">{room.capacity} <span className="text-sm font-medium text-muted-foreground">ghế</span></p>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Seat Grid Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    {isEditMode ? "Chế độ Vẽ Sơ đồ" : "Sơ đồ ghế hiện tại"}
                    {!isEditMode && seats.length > 0 && <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">{seats.length}</Badge>}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEditMode 
                      ? "Kéo thả hoặc click để vẽ ghế. Trống để làm lối đi."
                      : "Click vào ghế để mở menu trạng thái (hoặc vô hiệu hóa)"}
                  </p>
                </div>
                {!isEditMode ? (
                  <Button size="sm" className="gap-1.5 shadow-sm" onClick={handleEnterEditMode}>
                    <LayoutGrid className="h-3.5 w-3.5" /> Cập nhật Sơ đồ
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditMode(false)} disabled={isSettingUp}>
                      Hủy
                    </Button>
                    <Button size="sm" className="gap-1.5 shadow-sm" onClick={handleSaveGrid} disabled={isSettingUp}>
                      {isSettingUp && <Loader2 className="w-3 h-3 animate-spin" />}
                      Lưu sơ đồ
                    </Button>
                  </div>
                )}
              </div>

              {isEditMode ? (
                <div className="space-y-4 border rounded-xl p-4 md:p-6 bg-muted/10">
                  <div className="flex items-end gap-3 mb-6 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">Số hàng</Label>
                      <Input type="number" min={1} max={30} value={inputRows} onChange={(e) => setInputRows(Number(e.target.value))} className="w-20 h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Số cột</Label>
                      <Input type="number" min={1} max={30} value={inputCols} onChange={(e) => setInputCols(Number(e.target.value))} className="w-20 h-9" />
                    </div>
                    <Button size="sm" variant="outline" className="h-9 mb-[1px]" onClick={handleApplyDims} disabled={inputRows === dims.rows && inputCols === dims.cols}>
                      Áp dụng
                    </Button>
                    
                    <div className="flex-1" />
                    
                    <div className="flex bg-background p-1 shadow-sm border shrink-0 h-9 mb-[1px]">
                      {(["STANDARD", "VIP", "COUPLE"] as SeatType[]).map((t) => {
                        const isActive = activeTool === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setActiveTool(t)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all border",
                              isActive 
                                ? "ring-2 ring-primary ring-offset-1 border-primary bg-primary/5" 
                                : "border-transparent hover:bg-muted text-muted-foreground"
                            )}
                          >
                            <span className={cn("h-4 w-4 border block", SETUP_CELL_CLASSES[t])} />
                            {t === "STANDARD" ? "Thường" : t === "VIP" ? "VIP" : "Đôi"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4 bg-background rounded-xl border shadow-sm touch-none w-full" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                    <div className="w-max mx-auto flex flex-col items-center gap-1.5 select-none">
                      <div className="mb-8 w-full max-w-xl mx-auto border-t-[6px] border-primary/40 rounded-t-[50%] text-center pt-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          Màn hình
                        </span>
                      </div>

                      {grid.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-1">
                          <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground mr-1">
                            {rowLabels[rowIdx] || rowIdx}
                          </span>
                          <div className="flex gap-1">
                            {row.map((cellType, colIdx) => {
                              const isSelected = dragStart && dragCurrent &&
                                rowIdx >= Math.min(dragStart.r, dragCurrent.r) &&
                                rowIdx <= Math.max(dragStart.r, dragCurrent.r) &&
                                colIdx >= Math.min(dragStart.c, dragCurrent.c) &&
                                colIdx <= Math.max(dragStart.c, dragCurrent.c);

                              let coupleClass = "";
                              if (cellType === "COUPLE") {
                                let countBefore = 0;
                                for (let k = colIdx - 1; k >= 0; k--) {
                                  if (row[k] === "COUPLE") countBefore++;
                                  else break;
                                }
                                const isLeft = countBefore % 2 === 0;
                                
                                if (isLeft && colIdx < dims.cols - 1 && row[colIdx + 1] === "COUPLE") {
                                  coupleClass = "!w-[36px] border-r-0 mr-[-4px] z-10";
                                } else if (!isLeft && colIdx > 0 && row[colIdx - 1] === "COUPLE") {
                                  coupleClass = "!w-[36px] border-l-0 ml-[-4px] z-10";
                                }
                              }

                              return (
                                <div
                                  key={colIdx}
                                  onPointerDown={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handlePointerDown(rowIdx, colIdx); }}
                                  onPointerEnter={() => handlePointerEnter(rowIdx, colIdx)}
                                  className={cn(
                                    "h-8 w-8 border transition-all flex items-center justify-center cursor-pointer",
                                    cellType ? SETUP_CELL_CLASSES[cellType] : "border-dashed border-muted-foreground/30 hover:border-primary/50",
                                    coupleClass,
                                    isSelected && "ring-2 ring-primary ring-inset opacity-80"
                                  )}
                                >
                                  {cellType && <span className="text-[10px] font-bold opacity-70">{rowLabels[rowIdx] || rowIdx}{colIdx + 1}</span>}
                                </div>
                              );
                            })}
                          </div>
                          <span className="w-6 shrink-0 ml-1 opacity-0 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/10 border rounded-xl p-4 md:p-6 overflow-hidden">
                  <SeatGrid seats={seats} onSeatAction={handleSeatAction} isLoading={isLoadingSeats} />
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground/80">
                Mã phòng: {room.roomId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-semibold">
                Đóng
              </Button>
              {onEdit && !isEditMode && (
                <Button type="button" onClick={() => onEdit(room)} className="min-w-[120px] h-9 text-xs font-semibold">
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent data-admin="">
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận thay đổi kích thước</AlertDialogTitle>
          <AlertDialogDescription>
            Thay đổi kích thước lưới sẽ xóa toàn bộ dữ liệu ghế bạn đang vẽ. Bạn có chắc chắn muốn tiếp tục không?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleApplyDimsCancel}>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleApplyDimsConfirm} className="bg-destructive text-white hover:bg-destructive/90">
            Tiếp tục
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={chainUnlockOpen} onOpenChange={setChainUnlockOpen}>
      <DialogContent data-admin="">
        <DialogHeader>
          <DialogTitle>Mở bán ghế tự động</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm">
            Ghế <strong>{chainUnlockSeat?.seatRow}{chainUnlockSeat?.seatNumber}</strong> đang bị khóa ở <strong>{blockedShowtimes.length}</strong> suất chiếu sắp tới. Bạn có muốn tự động mở bán ghế này không?
          </p>
          <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded p-3">
            {blockedShowtimes.map(st => (
              <div key={st.showTimeId} className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id={`st-${st.showTimeId}`} 
                  checked={selectedShowtimes.includes(st.showTimeId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedShowtimes([...selectedShowtimes, st.showTimeId]);
                    } else {
                      setSelectedShowtimes(selectedShowtimes.filter(id => id !== st.showTimeId));
                    }
                  }}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor={`st-${st.showTimeId}`} className="text-sm cursor-pointer select-none">
                  Suất {st.startTime} - {st.endTime} <span className="text-muted-foreground ml-1">({st.roomName})</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setChainUnlockOpen(false)} disabled={isUpdatingSeat}>Hủy</Button>
          <Button onClick={handleConfirmChainUnlock} disabled={isUpdatingSeat}>
            {isUpdatingSeat && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Xác nhận mở bán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

