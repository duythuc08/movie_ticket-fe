"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SingleSelectWithSearch } from "@/components/shared";
import { MovieSelectorDialog } from "@/components/admin/movie/MovieSelectorDialog";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface RoomOption {
  roomId: number;
  name: string;
  roomType: string;
}

export interface MovieOption {
  movieId: number;
  title: string;
  duration: number;
}

export interface RoomPlanAssignment {
  movieId: number;
  count: number;
}

export interface RoomPlanState {
  id: string;
  roomId: number | null;
  assignments: RoomPlanAssignment[];
}

interface RoomPlanCardProps {
  plan: RoomPlanState;
  availableRooms: RoomOption[];
  movieOptions: MovieOption[];
  bufferMinutes: number; // đệm quảng cáo + dọn phòng cộng thêm mỗi suất (khớp BUFFER_MINUTES backend)
  openMinute: number;
  closeMinute: number;
  /** Số phút đã bị suất chiếu THẬT chiếm sẵn trong phòng đang chọn (worst-case theo ngày). */
  existingBusyMinutes: number;
  /** Số suất chiếu THẬT đã có sẵn trong phòng đang chọn (worst-case theo ngày) — hiện badge. */
  existingShowtimeCount: number;
  /** Số suất thật đã có theo từng phòng (roomId -> count) — dùng hiện badge ngay trong dropdown chọn phòng. */
  existingCountByRoom?: Record<number, number>;
  onChangeRoom: (planId: string, roomId: number | null) => void;
  onAddMovie: (planId: string, movieId: number) => void;
  onChangeCount: (planId: string, movieId: number, count: number) => void;
  onRemoveMovie: (planId: string, movieId: number) => void;
  onRemovePlan: (planId: string) => void;
}

export function slotMinutesFor(durationMinutes: number, bufferMinutes: number): number {
  return durationMinutes + bufferMinutes;
}

export function computeUsedMinutes(
  plan: RoomPlanState,
  movieOptions: MovieOption[],
  bufferMinutes: number,
): number {
  return plan.assignments.reduce((sum, a) => {
    const movie = movieOptions.find((m) => m.movieId === a.movieId);
    if (!movie) return sum;
    return sum + a.count * slotMinutesFor(movie.duration, bufferMinutes);
  }, 0);
}

export function RoomPlanCard({
  plan,
  availableRooms,
  movieOptions,
  bufferMinutes,
  openMinute,
  closeMinute,
  existingBusyMinutes,
  existingShowtimeCount,
  existingCountByRoom = {},
  onChangeRoom,
  onAddMovie,
  onChangeCount,
  onRemoveMovie,
  onRemovePlan,
}: RoomPlanCardProps) {
  const totalMinutes = closeMinute - openMinute - existingBusyMinutes;
  const usedMinutes = computeUsedMinutes(plan, movieOptions, bufferMinutes);
  const remaining = totalMinutes - usedMinutes;

  const remainingH = Math.floor(Math.max(0, remaining) / 60);
  const remainingM = Math.max(0, remaining) % 60;
  const remainingTone = remaining <= 0 ? "bad" : remaining < 60 ? "warn" : "good";
  const toneClass = {
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    bad: "bg-red-100 text-red-700",
  }[remainingTone];

  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const roomOptions = availableRooms.map((r) => {
    const count = existingCountByRoom[r.roomId] || 0;
    return { value: String(r.roomId), label: count > 0 ? `${r.name} (đã có ${count} suất)` : r.name };
  });
  const chosenMovieIds = new Set(plan.assignments.map((a) => a.movieId));
  const addableMovies = movieOptions.filter((m) => {
    if (chosenMovieIds.has(m.movieId)) return false;
    const perSlot = slotMinutesFor(m.duration, bufferMinutes);
    return Math.floor(remaining / perSlot) >= 1;
  });
  const canAddMovie = addableMovies.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 py-4">
        <div className="flex-1 max-w-xs">
          <SingleSelectWithSearch
            options={roomOptions}
            value={plan.roomId ? String(plan.roomId) : ""}
            onChange={(v) => onChangeRoom(plan.id, v ? Number(v) : null)}
            placeholder="— Chọn phòng —"
          />
        </div>
        <div className="flex items-center gap-3">
          {plan.roomId != null && existingShowtimeCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Đã có {existingShowtimeCount} suất
            </span>
          )}
          {plan.roomId != null && (
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", toneClass)}>
              Còn dư: {remainingH}h{String(remainingM).padStart(2, "0")}
            </span>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemovePlan(plan.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {plan.roomId != null && (
        <CardContent className="space-y-3 pt-0">
          {plan.assignments.map((a) => {
            const movie = movieOptions.find((m) => m.movieId === a.movieId);
            if (!movie) return null;
            const perSlot = slotMinutesFor(movie.duration, bufferMinutes);
            const remainingForRow = remaining + a.count * perSlot;
            const maxAllowed = Math.max(1, Math.floor(remainingForRow / perSlot));
            return (
              <div key={a.movieId} className="grid grid-cols-[1fr_100px_auto] gap-3 items-center bg-muted/40 rounded-lg px-3 py-2">
                <div>
                  <div className="font-medium text-sm">{movie.title}</div>
                  <div className="text-xs text-muted-foreground">tối đa {maxAllowed} suất ({perSlot} phút/suất)</div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={maxAllowed}
                  value={a.count}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(maxAllowed, Number(e.target.value) || 1));
                    onChangeCount(plan.id, a.movieId, v);
                  }}
                />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveMovie(plan.id, a.movieId)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            disabled={!canAddMovie}
            onClick={() => setIsMovieDialogOpen(true)}
            className="w-full justify-center gap-2 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            {canAddMovie ? "Chọn phim để thêm suất..." : "Phòng đã hết chỗ cho phim mới"}
          </Button>

          <MovieSelectorDialog
            open={isMovieDialogOpen}
            onOpenChange={setIsMovieDialogOpen}
            excludeMovieIds={Array.from(chosenMovieIds)}
            onSelect={(movie) => {
              const stillFits = addableMovies.some((m) => m.movieId === movie.movieId);
              if (!stillFits) {
                toast.error("Phim này không còn đủ chỗ trống trong phòng, chọn phim khác hoặc giảm số suất đã có.");
                return;
              }
              onAddMovie(plan.id, movie.movieId);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}
