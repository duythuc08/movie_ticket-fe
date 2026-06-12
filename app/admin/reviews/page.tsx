"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AdminReview, AdminMovie } from "@/types/admin.type";
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  hideReview,
} from "@/services/admin/adminReviewService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { DataTable, PageHeader } from "@/components/shared";
import { createReviewColumns } from "@/components/admin/review/ReviewColumns";
import { ReviewFilters } from "@/components/admin/review/ReviewFilters";
import { ReviewInteractionsDialog } from "@/components/admin/review/ReviewInteractionsDialog";

export default function AdminReviewsPage() {
  const { token } = useAuth();

  const [reviews, setReviews]   = useState<AdminReview[]>([]);
  const [movies,  setMovies]    = useState<AdminMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters]   = useState<{ keyword?: string; status?: string; movieId?: number }>({});

  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);
  const [selectedReview, setSelectedReview]         = useState<AdminReview | null>(null);

  const loadMovies = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchAdminMovies(token, { page: 0, size: 999 });
      setMovies(result.content);
    } catch {
      // movies list is optional for the filter
    }
  }, [token]);

  const loadReviews = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminReviews(token, {
        page: 0,
        size: 10,
        status:  filters.status,
        movieId: filters.movieId,
      });
      setReviews(result.content);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.status, filters.movieId]);

  useEffect(() => { loadMovies();  }, [loadMovies]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

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
      loadReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi duyệt đánh giá");
    }
  };

  const handleReject = async (review: AdminReview) => {
    if (!token) return;
    try {
      await rejectReview(token, review.reviewId);
      toast.success("Đã từ chối đánh giá");
      loadReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi từ chối đánh giá");
    }
  };

  const handleHide = async (review: AdminReview) => {
    if (!token) return;
    try {
      await hideReview(token, review.reviewId);
      toast.success("Đã ẩn đánh giá");
      loadReviews();
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

      <ReviewFilters movies={movies} onFilterChange={setFilters} />

      <DataTable
        columns={columns}
        data={filteredReviews}
        isLoading={isLoading}
        emptyText="Chưa có đánh giá nào."
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
