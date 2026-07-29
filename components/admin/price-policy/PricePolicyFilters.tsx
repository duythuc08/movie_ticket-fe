import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface PricePolicyFiltersProps {
  onFilterChange: (f: { keyword?: string; isActive?: string }) => void;
}

export const PricePolicyFilters = ({ onFilterChange }: PricePolicyFiltersProps) => {
  const [keyword, setKeyword] = useState("");
  const [isActive, setIsActive] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({
        keyword: keyword || undefined,
        isActive: isActive !== "all" ? isActive : undefined,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [keyword, isActive, onFilterChange]);

  const handleClear = () => { setKeyword(""); setIsActive("all"); };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm tên chính sách..." className="pl-9 bg-background" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <Select value={isActive} onValueChange={setIsActive}>
        <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Trạng thái --</SelectItem>
          <SelectItem value="true">Đang áp dụng</SelectItem>
          <SelectItem value="false">Chưa áp dụng</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
