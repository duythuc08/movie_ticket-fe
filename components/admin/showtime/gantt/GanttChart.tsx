"use client";

import React, { useMemo, useState } from "react";
import { Showtime } from "@/types/admin/showtime";
import { GanttShowtimeBlock } from "./GanttShowtimeBlock";
import { cn } from "@/lib/utils";

interface Room {
  roomId: number;
  name: string;
}

interface GanttChartProps {
  rooms: Room[];
  showtimes: Showtime[];
  onAddClick?: (roomId: number, startTimeStr: string) => void;
  onUpdateShowtimeTime?: (showTimeId: number, roomId: number, newStartTime: string) => void;
  selectedDate: Date;
  onViewDetail?: (showtime: Showtime) => void;
  onEdit?: (showtime: Showtime) => void;
}

export const GanttChart = ({ rooms, showtimes, onAddClick, onUpdateShowtimeTime, selectedDate, onViewDetail, onEdit }: GanttChartProps) => {
  const times = Array.from({ length: 37 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const isNextDay = hour >= 24;
    const displayHour = isNextDay ? hour - 24 : hour;
    const minute = i % 2 === 0 ? "00" : "30";
    return `${displayHour.toString().padStart(2, "0")}:${minute}`;
  });

  const [dragOverCell, setDragOverCell] = useState<{ roomId: number, cellIndex: number } | null>(null);

  const getStartTimeFromCoordinates = (clientX: number, targetLeft: number, targetWidth: number) => {
    const clickX = clientX - targetLeft;
    const percent = clickX / targetWidth;
    const cellIndex = Math.max(0, Math.min(35, Math.floor(percent * 36)));
    const roundedMinutes = cellIndex * 30;
    
    let hour = Math.floor(roundedMinutes / 60) + 9;
    const minute = roundedMinutes % 60;
    
    const clickDate = new Date(selectedDate);
    if (hour >= 24) {
      hour -= 24;
      clickDate.setDate(clickDate.getDate() + 1);
    }
    
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${clickDate.getFullYear()}-${pad(clickDate.getMonth() + 1)}-${pad(clickDate.getDate())}T${pad(hour)}:${pad(minute)}:00`;
  };

  const getStartTimeFromClick = (e: React.MouseEvent<HTMLDivElement>, roomId: number) => {
    if (!onAddClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newStartTime = getStartTimeFromCoordinates(e.clientX, rect.left, rect.width);
    onAddClick(roomId, newStartTime);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, roomId: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const cellIndex = Math.max(0, Math.min(35, Math.floor(percent * 36)));
    if (dragOverCell?.roomId !== roomId || dragOverCell?.cellIndex !== cellIndex) {
      setDragOverCell({ roomId, cellIndex });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, roomId: number) => {
    e.preventDefault();
    const cellIndexToUse = dragOverCell?.cellIndex;
    setDragOverCell(null);
    const showTimeIdStr = e.dataTransfer.getData("text/plain");
    if (!showTimeIdStr) return;
    
    const showTimeId = parseInt(showTimeIdStr, 10);
    
    let newStartTime;
    if (cellIndexToUse !== undefined) {
      const roundedMinutes = cellIndexToUse * 30;
      let hour = Math.floor(roundedMinutes / 60) + 9;
      const minute = roundedMinutes % 60;
      const clickDate = new Date(selectedDate);
      if (hour >= 24) {
        hour -= 24;
        clickDate.setDate(clickDate.getDate() + 1);
      }
      const pad = (n: number) => n.toString().padStart(2, "0");
      newStartTime = `${clickDate.getFullYear()}-${pad(clickDate.getMonth() + 1)}-${pad(clickDate.getDate())}T${pad(hour)}:${pad(minute)}:00`;
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      newStartTime = getStartTimeFromCoordinates(e.clientX, rect.left, rect.width);
    }
    
    if (onUpdateShowtimeTime) {
      onUpdateShowtimeTime(showTimeId, roomId, newStartTime);
    }
  };

  const showtimesByRoom = useMemo(() => {
    const map = new Map<number, Showtime[]>();
    rooms.forEach(r => map.set(r.roomId, []));
    showtimes.forEach(st => {
      if (map.has(st.roomId)) {
        map.get(st.roomId)?.push(st);
      }
    });
    return map;
  }, [rooms, showtimes]);

  return (
    <div className="w-full overflow-x-auto border rounded-md bg-background">
      <div className="min-w-[1600px]">
        <div className="flex bg-muted text-muted-foreground text-xs font-medium sticky top-0 z-20 border-b shadow-sm">
          <div className="w-[120px] shrink-0 p-3 bg-muted border-r sticky left-0 z-20 shadow-sm font-semibold flex items-center justify-center">
            Phòng
          </div>
          <div className="flex-1 flex relative h-10">
            {times.map((time, idx) => {
              return (
                <div 
                  key={idx} 
                  className="absolute top-0 bottom-0 flex items-center justify-start border-l border-border/50 transition-colors pl-1"
                  style={{ left: `${(idx / 36) * 100}%`, width: `${(1 / 36) * 100}%` }}
                >
                  {idx < 36 && time}
                </div>
              );
            })}
          </div>
        </div>

        {rooms.map(room => (
          <div key={room.roomId} className="flex border-b min-h-[60px] group">
            <div className="w-32 flex-shrink-0 border-r p-2 font-medium text-sm flex items-center justify-center bg-muted/20">
              {room.name}
            </div>
            <div 
              className="flex-1 relative cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={(e) => getStartTimeFromClick(e, room.roomId)}
              onDragOver={(e) => handleDragOver(e, room.roomId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, room.roomId)}
            >
              {Array.from({ length: 36 }).map((_, idx) => {
                const isDragOver = dragOverCell?.roomId === room.roomId && dragOverCell?.cellIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "absolute top-0 bottom-0 border-l border-dashed pointer-events-none transition-colors",
                      isDragOver ? "bg-primary/20 border-primary border-solid z-0" : "border-border/50"
                    )}
                    style={{ left: `${(idx / 36) * 100}%`, width: `${(1 / 36) * 100}%` }}
                  />
                );
              })}

              {showtimesByRoom.get(room.roomId)?.map(st => (
                <div key={st.showTimeId} onClick={(e) => e.stopPropagation()}>
                  <GanttShowtimeBlock showtime={st} onViewDetail={onViewDetail} onEdit={onEdit} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Không có dữ liệu phòng chiếu
          </div>
        )}
      </div>
    </div>
  );
};
