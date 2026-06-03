import { cn } from "@/lib/utils";
import { Showtime } from "@/types/admin/showtime";
import { useState, useRef, useEffect } from "react";
import { Eye, Pencil } from "lucide-react";
import { createPortal } from "react-dom";

interface GanttShowtimeBlockProps {
  showtime: Showtime;
  onViewDetail?: (showtime: Showtime) => void;
  onEdit?: (showtime: Showtime) => void;
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const calculateMinutesDiff = (startStr: string, isoString: string) => {
  const [startHour, startMin] = startStr.split(':').map(Number);
  const targetDate = new Date(isoString);
  const startObj = new Date(targetDate);
  startObj.setHours(startHour, startMin, 0, 0);

  if (targetDate.getHours() < 9 && targetDate.getHours() >= 0) {
    startObj.setDate(startObj.getDate() - 1);
  }

  return (targetDate.getTime() - startObj.getTime()) / 60000;
};

const checkIsCrossDay = (startIso: string, endIso: string) => {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  return startDate.getDate() !== endDate.getDate() || (endDate.getHours() < 9 && startDate.getHours() >= 9);
};

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "bg-blue-500 border-blue-600 text-white",
  ONGOING:   "bg-emerald-500 border-emerald-600 text-white",
  COMPLETED: "bg-slate-400 border-slate-500 text-white opacity-70",
  CANCELLED: "bg-red-400 border-red-500 text-white opacity-80",
  FULLY_BOOKED: "bg-orange-400 border-orange-500 text-white",
};

export const GanttShowtimeBlock = ({ showtime, onViewDetail, onEdit }: GanttShowtimeBlockProps) => {
  const ganttStartStr = "09:00";
  const totalGanttMinutes = 18 * 60;

  const startOffset = calculateMinutesDiff(ganttStartStr, showtime.startTime);

  const startTime = new Date(showtime.startTime).getTime();
  const endTime = new Date(showtime.endTime).getTime();
  const duration = (endTime - startTime) / 60000 || showtime.movieDuration || 120;

  let leftPercent = (startOffset / totalGanttMinutes) * 100;
  let widthPercent = (duration / totalGanttMinutes) * 100;

  if (leftPercent < 0) leftPercent = 0;
  if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

  const isCrossDay = checkIsCrossDay(showtime.startTime, showtime.endTime);
  const statusStyle = STATUS_STYLE[showtime.showTimeStatus] ?? STATUS_STYLE.SCHEDULED;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef<boolean>(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const clickedInsideBlock = blockRef.current?.contains(e.target as Node);
      const clickedInsideMenu = menuRef.current?.contains(e.target as Node);
      if (!clickedInsideBlock && !clickedInsideMenu) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isMenuOpen]);

  return (
    <>
    <div
      ref={blockRef}
      draggable={showtime.showTimeStatus === 'SCHEDULED'}
      onDragStart={(e) => {
        hasDragged.current = true;
        if (showtime.showTimeStatus === 'SCHEDULED') {
          e.dataTransfer.setData("text/plain", showtime.showTimeId.toString());
        }
      }}
      onDragEnd={() => {
        setTimeout(() => { hasDragged.current = false; }, 100);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasDragged.current) {
          if (!isMenuOpen && blockRef.current) {
            const rect = blockRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top, left: rect.left });
          }
          setIsMenuOpen(v => !v);
        }
      }}
      className={cn(
        "absolute top-1 bottom-1 rounded-md text-xs px-2 py-1 overflow-hidden border shadow-md transition-all cursor-pointer hover:brightness-110 hover:shadow-lg",
        statusStyle,
        isCrossDay && "border-r-2 border-dashed border-white/70"
      )}
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
    >
      <div className="font-semibold truncate leading-tight">{showtime.movieTitle}</div>
      <div className="text-[10px] opacity-90 mt-0.5 truncate">
        {formatTime(showtime.startTime)} – {formatTime(showtime.endTime)}
      </div>
    </div>

    {isMenuOpen && menuPos && typeof document !== "undefined" && createPortal(
      <div
        ref={menuRef}
        style={{ position: "fixed", top: menuPos.top, left: menuPos.left, transform: "translateY(-100%)", zIndex: 10 }}
        className="mb-1 bg-popover border border-border rounded-lg shadow-xl min-w-[160px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(false);
            onViewDetail?.(showtime);
          }}
        >
          <Eye className="w-4 h-4 shrink-0" />
          Xem chi tiết
        </button>
        {showtime.showTimeStatus === "SCHEDULED" && (
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              onEdit?.(showtime);
            }}
          >
            <Pencil className="w-4 h-4 shrink-0" />
            Chỉnh sửa
          </button>
        )}
      </div>,
      document.body
    )}
    </>
  );
};
