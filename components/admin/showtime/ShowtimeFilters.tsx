import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { AdminCinema } from "@/types/admin.type";

interface ShowtimeFiltersProps {
  cinemas: AdminCinema[];
  onFilterChange: (filters: { cinemaId?: string; status?: string; date?: string; keyword?: string }) => void;
  initialDate?: string;
  viewMode?: "table" | "gantt";
}

export const ShowtimeFilters = ({ cinemas, onFilterChange, initialDate, viewMode = "table" }: ShowtimeFiltersProps) => {
  const [cinemaId, setCinemaId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [date, setDate] = useState<string>(initialDate || "");
  const [keyword, setKeyword] = useState<string>("");

  useEffect(() => {
    if (initialDate && !date) {
      setDate(initialDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onFilterChange({ 
        cinemaId: cinemaId === "all" ? undefined : cinemaId, 
        status: status === "all" ? undefined : status, 
        date: date || undefined, 
        keyword: keyword || undefined 
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [cinemaId, status, date, keyword, onFilterChange]);

  const handleClear = () => {
    setCinemaId("all");
    setStatus("all");
    setDate("");
    setKeyword("");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm tên phim..." 
          className="pl-9 bg-background"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      {viewMode === "table" && (
        <>
          <Select value={cinemaId} onValueChange={setCinemaId}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Chọn rạp" />
            </SelectTrigger>
            <SelectContent data-admin="">
              <SelectItem value="all">-- Tất cả rạp --</SelectItem>
              {cinemas.map(c => (
                <SelectItem key={c.cinemaId} value={c.cinemaId.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent data-admin="">
              <SelectItem value="all">-- Trạng thái --</SelectItem>
              <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              <SelectItem value="ONGOING">Đang chiếu</SelectItem>
              <SelectItem value="COMPLETED">Đã chiếu xong</SelectItem>
              <SelectItem value="FULLY_BOOKED">Full ghế</SelectItem>
              <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}

      <div className="relative">
        <Input 
          type="date" 
          className="w-[180px] bg-background"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
