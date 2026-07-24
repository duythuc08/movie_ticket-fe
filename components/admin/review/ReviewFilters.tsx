import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SingleSelectWithSearch } from "@/components/shared";
import type { SelectOption } from "@/components/shared/multi-select";
import { Search, X } from "lucide-react";

interface ReviewFiltersProps {
  movieOptions: SelectOption[];
  isLoadingMovies?: boolean;
  hasMoreMovies?: boolean;
  isLoadingMoreMovies?: boolean;
  onLoadMoreMovies?: () => void;
  onSearchMovies?: (term: string) => void;
  onFilterChange: (f: { keyword?: string; status?: string; movieId?: number }) => void;
}

export const ReviewFilters = ({
  movieOptions,
  isLoadingMovies,
  hasMoreMovies,
  isLoadingMoreMovies,
  onLoadMoreMovies,
  onSearchMovies,
  onFilterChange,
}: ReviewFiltersProps) => {
  const [keyword, setKeyword] = useState("");
  const [status,  setStatus]  = useState("all");
  const [movieId, setMovieId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({
        keyword: keyword || undefined,
        status:  status  !== "all" ? status              : undefined,
        movieId: movieId !== "" ? Number(movieId)        : undefined,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [keyword, status, movieId, onFilterChange]);

  const handleClear = () => { setKeyword(""); setStatus("all"); setMovieId(""); };

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

      <SingleSelectWithSearch
        options={movieOptions}
        value={movieId}
        onChange={setMovieId}
        placeholder="-- Tất cả phim --"
        searchPlaceholder="Tìm tên phim..."
        isLoading={isLoadingMovies}
        hasMore={hasMoreMovies}
        isLoadingMore={isLoadingMoreMovies}
        onLoadMore={onLoadMoreMovies}
        onSearchChange={onSearchMovies}
        className="w-[220px]"
      />

      <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4 mr-2" /> Xoá lọc
      </Button>
    </div>
  );
};
