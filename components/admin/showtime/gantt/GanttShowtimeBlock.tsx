import { cn } from "@/lib/utils";
import { Showtime } from "@/types/admin/showtime";
import { useState, useRef } from "react";
import { Eye, Pencil, Check, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GanttShowtimeBlockProps {
  showtime: Showtime;
  /** Giờ bắt đầu lưới Gantt (0-23) — mặc định 9, đồng bộ với GanttChart. */
  ganttStartHour?: number;
  /** true = chỉ cho chọn để hoán đổi (click-to-select), không có dropdown action (Preview chưa lưu DB). */
  dragOnly?: boolean;
  /** true = khối này đang được chọn làm vế đầu của thao tác hoán đổi — hiện viền nổi bật. */
  isSelectedForSwap?: boolean;
  /** Click vào khối DRAFT khi ở chế độ dragOnly — dùng để chọn/hoán đổi, không kéo-thả nữa. */
  onSelectForSwap?: (showtime: Showtime) => void;
  onViewDetail?: (showtime: Showtime) => void;
  onEdit?: (showtime: Showtime) => void;
  onApproveDraft?: (showtime: Showtime) => void;
  onEditDraftTime?: (showtime: Showtime) => void;
  onDeleteDraft?: (showtime: Showtime) => void;
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const calculateMinutesDiff = (ganttStartHour: number, isoString: string) => {
  const targetDate = new Date(isoString);
  const startObj = new Date(targetDate);
  startObj.setHours(ganttStartHour, 0, 0, 0);

  if (targetDate.getHours() < ganttStartHour && targetDate.getHours() >= 0) {
    startObj.setDate(startObj.getDate() - 1);
  }

  return (targetDate.getTime() - startObj.getTime()) / 60000;
};

const checkIsCrossDay = (ganttStartHour: number, startIso: string, endIso: string) => {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  return startDate.getDate() !== endDate.getDate()
    || (endDate.getHours() < ganttStartHour && startDate.getHours() >= ganttStartHour);
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-violet-500/80 border-violet-500 border-dashed text-white",
  SCHEDULED: "bg-blue-500 border-blue-600 text-white",
  ONGOING: "bg-emerald-500 border-emerald-600 text-white",
  COMPLETED: "bg-slate-400 border-slate-500 text-white opacity-70",
  CANCELLED: "bg-red-400 border-red-500 text-white opacity-80",
  FULLY_BOOKED: "bg-orange-400 border-orange-500 text-white",
};

export const GanttShowtimeBlock = ({
  showtime,
  ganttStartHour = 9,
  dragOnly = false,
  isSelectedForSwap = false,
  onSelectForSwap,
  onViewDetail,
  onEdit,
  onApproveDraft,
  onEditDraftTime,
  onDeleteDraft,
}: GanttShowtimeBlockProps) => {
  const totalGanttMinutes = 18 * 60;

  const startOffset = calculateMinutesDiff(ganttStartHour, showtime.startTime);

  const startTime = new Date(showtime.startTime).getTime();
  const endTime = new Date(showtime.endTime).getTime();
  const duration = (endTime - startTime) / 60000 || showtime.movieDuration || 120;

  let leftPercent = (startOffset / totalGanttMinutes) * 100;
  let widthPercent = (duration / totalGanttMinutes) * 100;

  if (leftPercent < 0) leftPercent = 0;
  if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

  const isCrossDay = checkIsCrossDay(ganttStartHour, showtime.startTime, showtime.endTime);
  const statusStyle = STATUS_STYLE[showtime.showTimeStatus] ?? STATUS_STYLE.SCHEDULED;
  const isScheduled = showtime.showTimeStatus === "SCHEDULED";
  const isDraft = showtime.showTimeStatus === "DRAFT";

  const [isOpen, setIsOpen] = useState(false);
  const hasDragged = useRef<boolean>(false);

  const blockClassName = cn(
    "absolute top-1 bottom-1 rounded-md text-xs px-2 py-1 overflow-hidden border shadow-md transition-all cursor-pointer hover:brightness-110 hover:shadow-lg",
    statusStyle,
    isCrossDay && "border-r-2 border-dashed border-white/70",
    isSelectedForSwap && "ring-4 ring-amber-400 ring-offset-1 z-10"
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

  // Bản nháp Preview (dryRun, chưa lưu DB) — click để chọn, chọn thêm 1 khối DRAFT khác sẽ hỏi
  // hoán đổi vị trí (xử lý ở component cha). Không có dropdown action vì suất chưa tồn tại thật.
  if (dragOnly && isDraft) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectForSwap?.(showtime);
        }}
        className={blockClassName}
        style={blockStyle}
        title={isSelectedForSwap ? "Đang chọn — click 1 khối DRAFT khác để hoán đổi" : "Click để chọn, chọn thêm 1 khối khác để hoán đổi vị trí"}
      >
        {blockContent}
      </div>
    );
  }

  if (dragOnly && !isDraft) {
    return (
      <div className={blockClassName} style={blockStyle} title="Suất chiếu đã có sẵn — chỉ xem để đối chiếu">
        {blockContent}
      </div>
    );
  }

  // DRAFT: dropdown riêng — Duyệt / Sửa giờ / Xóa đề xuất (chưa có ghế, không cần cảnh báo "có active seats")
  if (isDraft) {
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
            onClick={(e) => e.stopPropagation()}
            className={blockClassName}
            style={blockStyle}
            title="Đề xuất DRAFT — chưa mở bán"
          >
            {blockContent}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-44 z-[100] bg-white border-slate-200 text-slate-800" align="start">
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
              onApproveDraft?.(showtime);
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Duyệt suất này
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-red-50 focus:text-red-600 cursor-pointer text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDraft?.(showtime);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa đề xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Non-SCHEDULED (COMPLETED/CANCELLED/FULLY_BOOKED): single action — click thẳng vào detail
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
