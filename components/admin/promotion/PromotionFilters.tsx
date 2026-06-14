import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface PromotionFiltersProps {
  onFilterChange: (f: { keyword?: string; status?: string; type?: string }) => void;
}

export const PromotionFilters = ({ onFilterChange }: PromotionFiltersProps) => {
  const [keyword, setKeyword] = useState("");
  const [status,  setStatus]  = useState("all");
  const [type,    setType]    = useState("all");

  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({
        keyword: keyword || undefined,
        status:  status !== "all" ? status : undefined,
        type:    type   !== "all" ? type   : undefined,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [keyword, status, type, onFilterChange]);

  const handleClear = () => { setKeyword(""); setStatus("all"); setType("all"); };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm mã hoặc tên..." className="pl-9 bg-background" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Trạng thái --</SelectItem>
          <SelectItem value="DRAFT">Nháp</SelectItem>
          <SelectItem value="PUBLISHED">Đang chạy</SelectItem>
          <SelectItem value="PAUSED">Tạm dừng</SelectItem>
          <SelectItem value="EXPIRED">Hết hạn</SelectItem>
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Loại giảm" /></SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Giảm theo --</SelectItem>
          <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
          <SelectItem value="FIXED_AMOUNT">Cố định (đ)</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
