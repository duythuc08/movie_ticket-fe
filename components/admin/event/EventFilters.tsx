import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

const EVENT_TYPE_OPTIONS = [
  { value: "PREMIERE", label: "Ra mắt phim" },
  { value: "FESTIVAL", label: "Liên hoan phim" },
  { value: "SPECIAL_SCREENING", label: "Chiếu đặc biệt" },
  { value: "PROMOTION", label: "Sự kiện khuyến mãi" },
];

interface EventFiltersProps {
  onFilterChange: (f: { keyword?: string; eventType?: string }) => void;
}

export const EventFilters = ({ onFilterChange }: EventFiltersProps) => {
  const [keyword, setKeyword] = useState("");
  const [eventType, setEventType] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({
        keyword:   keyword || undefined,
        eventType: eventType !== "all" ? eventType : undefined,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [keyword, eventType, onFilterChange]);

  const handleClear = () => { setKeyword(""); setEventType("all"); };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm tên sự kiện..." className="pl-9 bg-background" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <Select value={eventType} onValueChange={setEventType}>
        <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Loại sự kiện" /></SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Loại sự kiện --</SelectItem>
          {EVENT_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
