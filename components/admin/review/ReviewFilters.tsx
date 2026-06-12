import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { AdminMovie } from "@/types/admin.type";

interface ReviewFiltersProps {
  movies: AdminMovie[];
  onFilterChange: (f: { keyword?: string; status?: string; movieId?: number }) => void;
}

export const ReviewFilters = ({ movies, onFilterChange }: ReviewFiltersProps) => {
  const [keyword, setKeyword] = useState("");
  const [status,  setStatus]  = useState("all");
  const [movieId, setMovieId] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({
        keyword: keyword || undefined,
        status:  status  !== "all" ? status            : undefined,
        movieId: movieId !== "all" ? Number(movieId)   : undefined,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [keyword, status, movieId, onFilterChange]);

  const handleClear = () => { setKeyword(""); setStatus("all"); setMovieId("all"); };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên người dùng hoặc phim..."
          className="pl-9 bg-background"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Trạng thái --</SelectItem>
          <SelectItem value="PENDING">Chờ duyệt</SelectItem>
          <SelectItem value="APPROVED">Đã duyệt</SelectItem>
          <SelectItem value="REJECTED">Từ chối</SelectItem>
          <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
        </SelectContent>
      </Select>

      <Select value={movieId} onValueChange={setMovieId}>
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Phim" />
        </SelectTrigger>
        <SelectContent data-admin="">
          <SelectItem value="all">-- Tất cả phim --</SelectItem>
          {movies.map((m) => (
            <SelectItem key={m.movieId} value={String(m.movieId)}>
              {m.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
