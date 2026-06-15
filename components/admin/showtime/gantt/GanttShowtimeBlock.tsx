import { cn } from "@/lib/utils";
import { Showtime } from "@/types/admin/showtime";
import { useState, useRef } from "react";
import { Eye, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  SCHEDULED:    "bg-blue-500 border-blue-600 text-white",
  ONGOING:      "bg-emerald-500 border-emerald-600 text-white",
  COMPLETED:    "bg-slate-400 border-slate-500 text-white opacity-70",
  CANCELLED:    "bg-red-400 border-red-500 text-white opacity-80",
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
  const isScheduled = showtime.showTimeStatus === "SCHEDULED";

  const [isOpen, setIsOpen] = useState(false);
  const hasDragged = useRef<boolean>(false);

  const blockClassName = cn(
    "absolute top-1 bottom-1 rounded-md text-xs px-2 py-1 overflow-hidden border shadow-md transition-all cursor-pointer hover:brightness-110 hover:shadow-lg",
    statusStyle,
    isCrossDay && "border-r-2 border-dashed border-white/70"
  );
  const blockStyle = { left: `${leftPercent}%`, width: `${widthPercent}%` };

  const blockContent = (
    <>
      <div className="font-semibold truncate leading-tight">{showtime.movieTitle}</div>
      <div className="text-[10px] opacity-90 mt-0.5 truncate">
        {formatTime(showtime.startTime)} – {formatTime(showtime.endTime)}
      </div>
    </>
  );

  // Non-SCHEDULED: single action — click thẳng vào detail, không cần dropdown 1 item
  if (!isScheduled) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail?.(showtime);
        }}
        className={blockClassName}
        style={blockStyle}
      >
        {blockContent}
      </div>
    );
  }

  // SCHEDULED: dropdown với Xem chi tiết + Chỉnh sửa
  return (
    <DropdownMenu open={isOpen} onOpenChange={(v) => {
      if (hasDragged.current && v) return;
      setIsOpen(v);
    }}>
      <DropdownMenuTrigger asChild>
        <div
          draggable
          onDragStart={(e) => {
            hasDragged.current = true;
            e.dataTransfer.setData("text/plain", showtime.showTimeId.toString());
          }}
          onDragEnd={() => {
            setTimeout(() => { hasDragged.current = false; }, 100);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={blockClassName}
          style={blockStyle}
        >
          {blockContent}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40 z-[100] bg-white border-slate-200 text-slate-800" align="start">
        <DropdownMenuItem
          className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail?.(showtime);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(showtime);
          }}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
