"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AdminReview } from "@/types/admin.type";
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  hideReview,
} from "@/services/admin/adminReviewService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { DataTable, PageHeader } from "@/components/shared";
import type { SelectOption } from "@/components/shared/multi-select";
import { createReviewColumns } from "@/components/admin/review/ReviewColumns";
import { ReviewFilters } from "@/components/admin/review/ReviewFilters";
import { ReviewInteractionsDialog } from "@/components/admin/review/ReviewInteractionsDialog";

const MOVIE_OPTIONS_PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const { token } = useAuth();

  const [reviews, setReviews]       = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [filters, setFilters]       = useState<{ keyword?: string; status?: string; movieId?: number }>({});
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);
  const [selectedReview, setSelectedReview]         = useState<AdminReview | null>(null);

  // ── Dropdown chọn phim cho filter — lazy load 20 phim/trang, hoặc tìm theo tên qua API ──
  const [movieOptions,      setMovieOptions]      = useState<SelectOption[]>([]);
  const [movieOptionsPage,  setMovieOptionsPage]  = useState(0);
  const [movieOptionsTotalPages, setMovieOptionsTotalPages] = useState(1);
  const [isLoadingMovies,     setIsLoadingMovies]     = useState(false);
  const [isLoadingMoreMovies, setIsLoadingMoreMovies] = useState(false);
  const [movieSearchTerm, setMovieSearchTerm] = useState("");

  const loadMovieOptions = useCallback(async (targetPage: number, append: boolean, titleSearch = "") => {
    if (!token) return;
    if (append) setIsLoadingMoreMovies(true); else setIsLoadingMovies(true);
    try {
      const result = await fetchAdminMovies(token, {
        page: targetPage,
        size: MOVIE_OPTIONS_PAGE_SIZE,
        sort: "title,asc",
        title: titleSearch || undefined,
      });
      const newOptions = result.content.map((m) => ({ value: String(m.movieId), label: m.title }));
      setMovieOptions((prev) => (append ? [...prev, ...newOptions] : newOptions));
      setMovieOptionsPage(result.currentPage);
      setMovieOptionsTotalPages(result.totalPages);
    } catch {
      // dropdown phim là tùy chọn, không chặn trang review nếu lỗi
    } finally {
      if (append) setIsLoadingMoreMovies(false); else setIsLoadingMovies(false);
    }
  }, [token]);

  const handleLoadMoreMovies = useCallback(() => {
    if (movieOptionsPage + 1 < movieOptionsTotalPages) {
      loadMovieOptions(movieOptionsPage + 1, true, movieSearchTerm);
    }
  }, [loadMovieOptions, movieOptionsPage, movieOptionsTotalPages, movieSearchTerm]);

  const handleSearchMovies = useCallback((term: string) => {
    setMovieSearchTerm(term);
    loadMovieOptions(0, false, term);
  }, [loadMovieOptions]);

  const loadReviews = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminReviews(token, {
        page: targetPage,
        size: 10,
        status:  filters.status,
        movieId: filters.movieId,
      });
      setReviews(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.status, filters.movieId]);

  const handleFilterChange = useCallback((newFilters: { keyword?: string; status?: string; movieId?: number }) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  useEffect(() => { loadMovieOptions(0, false, ""); }, [loadMovieOptions]);
  useEffect(() => { loadReviews(0); }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    if (!filters.keyword) return reviews;
    const kw = filters.keyword.toLowerCase();
    return reviews.filter(
      (r) =>
        r.fullName.toLowerCase().includes(kw) ||
        r.movieTitle.toLowerCase().includes(kw)
    );
  }, [reviews, filters.keyword]);

  const handleApprove = async (review: AdminReview) => {
    if (!token) return;
    try {
      await approveReview(token, review.reviewId);
      toast.success("Đã duyệt đánh giá");
      loadReviews(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi duyệt đánh giá");
    }
  };

  const handleReject = async (review: AdminReview) => {
    if (!token) return;
    try {
      await rejectReview(token, review.reviewId);
      toast.success("Đã từ chối đánh giá");
      loadReviews(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi từ chối đánh giá");
    }
  };

  const handleHide = async (review: AdminReview) => {
    if (!token) return;
    try {
      await hideReview(token, review.reviewId);
      toast.success("Đã ẩn đánh giá");
      loadReviews(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi ẩn đánh giá");
    }
  };

  const handleViewInteractions = (review: AdminReview) => {
    setSelectedReview(review);
    setIsInteractionsOpen(true);
  };

  const columns = useMemo(
    () =>
      createReviewColumns({
        onApprove:         handleApprove,
        onReject:          handleReject,
        onHide:            handleHide,
        onViewInteractions: handleViewInteractions,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Đánh giá (Review)"
        description="Quản lý và kiểm duyệt đánh giá phim từ người dùng"
      />

      <ReviewFilters
        movieOptions={movieOptions}
        isLoadingMovies={isLoadingMovies}
        hasMoreMovies={movieOptionsPage + 1 < movieOptionsTotalPages}
        isLoadingMoreMovies={isLoadingMoreMovies}
        onLoadMoreMovies={handleLoadMoreMovies}
        onSearchMovies={handleSearchMovies}
        onFilterChange={handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={filteredReviews}
        isLoading={isLoading}
        emptyText="Chưa có đánh giá nào."
        serverPagination={{
          page: page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => {
            setPage(newPage);
            loadReviews(newPage);
          },
        }}
      />

      <ReviewInteractionsDialog
        open={isInteractionsOpen}
        onOpenChange={(open) => {
          setIsInteractionsOpen(open);
          if (!open) setSelectedReview(null);
        }}
        review={selectedReview}
      />
    </div>
  );
}
