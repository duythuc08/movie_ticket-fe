"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, EyeOff, Eye, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  hideReview,
} from "@/services/admin/adminReviewService";
import { ReviewInteractionsDialog } from "@/components/admin/review/ReviewInteractionsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminReview } from "@/types/admin.type";

const STATUS_MAP = {
  PENDING:  { label: "Chờ duyệt", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  APPROVED: { label: "Đã duyệt",  color: "bg-green-500/10 text-green-500 border-green-500/20"  },
  REJECTED: { label: "Từ chối",   color: "bg-red-500/10 text-red-500 border-red-500/20"        },
  HIDDEN:   { label: "Đã ẩn",     color: "bg-gray-500/10 text-gray-500 border-gray-500/20"     },
};

interface MovieReviewsTabProps {
  movieId: number;
}

export function MovieReviewsTab({ movieId }: MovieReviewsTabProps) {
  const { token } = useAuth();
  const [reviews,   setReviews]   = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected,  setSelected]  = useState<AdminReview | null>(null);
  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminReviews(token, { page: 0, size: 9999, movieId });
      setReviews(result.content);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [token, movieId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (review: AdminReview) => {
    if (!token) return;
    try {
      await approveReview(token, review.reviewId);
      toast.success("Đã duyệt đánh giá");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi duyệt đánh giá");
    }
  };

  const handleReject = async (review: AdminReview) => {
    if (!token) return;
    try {
      await rejectReview(token, review.reviewId);
      toast.success("Đã từ chối đánh giá");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi từ chối đánh giá");
    }
  };

  const handleHide = async (review: AdminReview) => {
    if (!token) return;
    try {
      await hideReview(token, review.reviewId);
      toast.success("Đã ẩn đánh giá");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi ẩn đánh giá");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Star className="w-8 h-8 opacity-30" />
        <p className="text-sm">Chưa có đánh giá nào cho phim này.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{reviews.length} đánh giá</p>

        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {reviews.map((review) => {
            const statusCfg = STATUS_MAP[review.reviewStatus] ?? STATUS_MAP.PENDING;
            return (
              <div key={review.reviewId} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-card hover:bg-muted/30 transition-colors">

                {/* User + meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{review.fullName}</span>
                    <span className="text-xs text-muted-foreground">@{review.username}</span>
                    <Badge variant="outline" className={`text-[11px] px-1.5 py-0 ${statusCfg.color}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{review.comment}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>👍 {review.likeCount}</span>
                    <span>👎 {review.dislikeCount}</span>
                    <span>{format(new Date(review.createdAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setSelected(review); setIsInteractionsOpen(true); }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Tương tác
                  </Button>

                  {review.reviewStatus === "PENDING" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(review)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Duyệt
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(review)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                      </Button>
                    </>
                  )}

                  {review.reviewStatus === "APPROVED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                      onClick={() => handleHide(review)}
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Ẩn
                    </Button>
                  )}

                  {review.reviewStatus === "HIDDEN" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(review)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Khôi phục
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReviewInteractionsDialog
        open={isInteractionsOpen}
        onOpenChange={(open) => { setIsInteractionsOpen(open); if (!open) setSelected(null); }}
        review={selected}
      />
    </>
  );
}
