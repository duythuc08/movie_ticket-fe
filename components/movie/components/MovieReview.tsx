"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchReviewsByMovie,
  createReview,
  updateReview,
  toggleInteraction,
  type ReviewResponse,
  type MovieReviewPageResponse,
  ApiError,
} from "@/components/movie/service/review.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const RATING_LABELS = ["", "Tệ", "Không hay", "Bình thường", "Hay", "Tuyệt vời"] as const;

interface MovieReviewProps {
  movieId: number;
  hasReviewed?: boolean;
}

export function MovieReview({ movieId, hasReviewed: initialHasReviewed }: MovieReviewProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Pick<
    MovieReviewPageResponse,
    "averageRating" | "totalReviews" | "ratingDistribution"
  > | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const [hasReviewed, setHasReviewed] = useState(initialHasReviewed ?? false);
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUnwatchedDialog, setShowUnwatchedDialog] = useState(false);

  const displayRating = hoverRating || rating;

  const loadReviews = useCallback(
    async (pageNum: number, reset = false, filter = starFilter) => {
      try {
        const data = await fetchReviewsByMovie(movieId, pageNum, 10, filter ?? undefined);
        if (reset) {
          setSummary({
            averageRating: data.averageRating,
            totalReviews: data.totalReviews,
            ratingDistribution: data.ratingDistribution,
          });
        }

        let newReviews = data.content;
        if (user) {
          const myRev = newReviews.find((r) => r.username === user.username);
          if (myRev) {
            setMyReview(myRev);
            setHasReviewed(true);
            newReviews = newReviews.filter((r) => r.reviewId !== myRev.reviewId);
          }
        }

        setReviews((prev) => (reset ? newReviews : [...prev, ...newReviews]));
        setHasMore(!data.last && data.content.length > 0);
        setPage(pageNum);
      } catch {
        toast.error("Lỗi tải bình luận phim");
      } finally {
        setLoading(false);
      }
    },
    [movieId, user, starFilter]
  );

  useEffect(() => {
    async function run() {
      await loadReviews(0, true, starFilter);
    }
    run();
  }, [movieId, starFilter, loadReviews]);

  // Tìm review của user trong nền nếu không có trong trang đầu tiên được tải
  useEffect(() => {
    if (!hasReviewed || myReview || !user || loading) return;
    let cancelled = false;

    (async () => {
      // Nếu đang lọc theo sao, trang 0 đã bị filter — cần tìm từ đầu không có filter
      // Ngược lại, trang 0 (không filter) đã được kiểm tra rồi, bắt đầu từ trang 1
      let searchPage = starFilter !== null ? 0 : 1;
      while (!cancelled) {
        try {
          const data = await fetchReviewsByMovie(movieId, searchPage, 10);
          if (cancelled) break;
          const myRev = data.content.find((r) => r.username === user.username);
          if (myRev) {
            setMyReview(myRev);
            break;
          }
          if (data.last || data.content.length === 0) break;
          searchPage++;
        } catch {
          break;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [hasReviewed, myReview, user, loading, movieId, starFilter]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Vui lòng đăng nhập để đánh giá"); return; }
    if (rating < 1) { toast.error("Vui lòng chọn số sao đánh giá"); return; }
    setIsSubmitting(true);
    try {
      if (isEditing && myReview) {
        const updated = await updateReview(myReview.reviewId, movieId, rating, comment.trim());
        setMyReview(updated);
        setIsEditing(false);
        toast.success("Cập nhật thành công. Đánh giá của bạn đang chờ duyệt.");
      } else {
        const created = await createReview(movieId, rating, comment.trim());
        setMyReview(created);
        setHasReviewed(true);
        window.dispatchEvent(new CustomEvent("review:submitted", { detail: { movieId } }));
      }
      setComment("");
      setRating(0);
    } catch (error) {
      if (error instanceof ApiError && error.code === 1081) {
        setShowUnwatchedDialog(true);
      } else if (error instanceof ApiError && error.code === 1083) {
        toast.warning("Bạn đã đặt vé nhưng chưa xem phim. Vui lòng trải nghiệm bộ phim trước khi đánh giá.");
      } else {
        toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInteraction = async (reviewId: number, type: "LIKE" | "DISLIKE", isMyReview: boolean) => {
    if (!user) { toast.error("Vui lòng đăng nhập để tương tác"); return; }
    try {
      await toggleInteraction(reviewId, type);
      const applyUpdate = (r: ReviewResponse): ReviewResponse => {
        if (r.reviewId !== reviewId) return r;
        const liking = type === "LIKE";
        const disliking = type === "DISLIKE";
        
        let newLikeCount = r.likeCount;
        let newDislikeCount = r.dislikeCount;
        let newLikedByMe = r.likedByMe;
        let newDislikedByMe = r.dislikedByMe;

        if (liking) {
          if (r.likedByMe) {
            newLikeCount = Math.max(0, newLikeCount - 1);
            newLikedByMe = false;
          } else {
            newLikeCount++;
            newLikedByMe = true;
            if (r.dislikedByMe) {
              newDislikeCount = Math.max(0, newDislikeCount - 1);
              newDislikedByMe = false;
            }
          }
        } else if (disliking) {
          if (r.dislikedByMe) {
            newDislikeCount = Math.max(0, newDislikeCount - 1);
            newDislikedByMe = false;
          } else {
            newDislikeCount++;
            newDislikedByMe = true;
            if (r.likedByMe) {
              newLikeCount = Math.max(0, newLikeCount - 1);
              newLikedByMe = false;
            }
          }
        }

        return {
          ...r,
          likeCount: newLikeCount,
          dislikeCount: newDislikeCount,
          likedByMe: newLikedByMe,
          dislikedByMe: newDislikedByMe,
        };
      };
      if (isMyReview && myReview) setMyReview(applyUpdate(myReview));
      else setReviews((prev) => prev.map(applyUpdate));
    } catch {
      toast.error("Không thể thao tác");
    }
  };

  return (
    <div id="reviews" className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">

      {/* ── Rating Summary ── */}
      {summary && summary.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 py-5 border-b border-border bg-muted/20">
          <div className="flex flex-col items-center md:border-r border-border py-1">
            <span className="text-4xl font-extrabold text-foreground">{summary.averageRating.toFixed(1)}</span>
            <div className="flex gap-0.5 my-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(summary.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{summary.totalReviews} thành viên đánh giá</span>
          </div>
          <div className="md:col-span-2 space-y-1.5 max-w-xs mx-auto md:mx-0 w-full self-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.ratingDistribution[star] ?? 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="w-3 text-right font-medium text-foreground">{star}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right">{count} lượt</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Chips ── */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center px-5 py-3 border-b border-border">
          <span className="text-xs text-muted-foreground">Lọc:</span>
          {([null, 5, 4, 3, 2, 1] as (number | null)[]).map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                starFilter === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {s === null ? "Tất cả" : `${s} Sao`}
            </button>
          ))}
        </div>
      )}


      {/* ── Form Đánh Giá (chưa đánh giá hoặc đang chỉnh sửa) ── */}
      {(!hasReviewed || isEditing) && (
        <div className="px-5 py-5 border-b border-border bg-muted/10">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {isEditing ? "Chỉnh sửa đánh giá" : "Viết đánh giá của bạn"}
          </h3>

          {/* Star selector */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                type="button"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    s <= displayRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground/25 fill-transparent"
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                {RATING_LABELS[displayRating]}
              </span>
            )}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn (tùy chọn)..."
            className="text-sm min-h-[88px] resize-none"
          />

          <div className="flex gap-2 justify-end mt-3">
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIsEditing(false); setRating(0); setComment(""); }}
                className="text-xs"
              >
                Hủy
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating < 1}
              size="sm"
              className="text-xs h-8"
            >
              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
              {isEditing ? "Cập nhật" : "Đăng đánh giá"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Danh sách bình luận ── */}
      <div className="divide-y divide-border">
        {loading && page === 0 ? (
          <div className="px-5 py-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {myReview && (
              <ReviewItem
                key={`my-${myReview.reviewId}`}
                review={myReview}
                isPinned
                onEdit={() => {
                  setRating(myReview.rating);
                  setComment(myReview.comment ?? "");
                  setIsEditing(true);
                }}
                onInteract={(type) => handleInteraction(myReview.reviewId, type, true)}
              />
            )}
            {reviews.map((r) => (
              <ReviewItem
                key={r.reviewId}
                review={r}
                onInteract={(type) => handleInteraction(r.reviewId, type, false)}
              />
            ))}

            {reviews.length === 0 && !myReview && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {starFilter != null
                    ? `Chưa có đánh giá ${starFilter} sao nào.`
                    : "Chưa có bình luận nào. Hãy là người đầu tiên!"}
                </p>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadReviews(page + 1)}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Xem thêm đánh giá
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showUnwatchedDialog} onOpenChange={setShowUnwatchedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn chưa xem phim này</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Bạn chỉ có thể đánh giá sau khi đã mua vé và xem phim. Hãy đặt vé ngay để trải nghiệm nhé!
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnwatchedDialog(false)}>Đóng</Button>
            <Button onClick={() => {
              setShowUnwatchedDialog(false);
              document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" });
            }}>Đặt vé ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewItem({
  review,
  onInteract,
  isPinned,
  onEdit,
}: {
  review: ReviewResponse;
  onInteract: (type: "LIKE" | "DISLIKE") => void;
  isPinned?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className={`px-5 py-4 flex gap-3 transition-colors hover:bg-muted/30 ${isPinned ? "bg-yellow-50/60 border-l-2 border-yellow-400" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 uppercase">
        {review.fullName?.trim().split(" ").pop()?.charAt(0) ?? review.username.charAt(0)}
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-semibold text-foreground text-xs truncate">
              {review.fullName || review.username}
            </span>
            {isPinned && (
              <span className="inline-flex items-center text-[10px] font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-full px-1.5 py-0.5 shrink-0">
                Đánh giá của bạn
              </span>
            )}
            <div className="flex shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(review.createdAt), "dd/MM/yyyy")}
            </span>
            {isPinned && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Sửa
              </button>
            )}
          </div>
        </div>

        {review.comment && (
          <p className="text-xs text-foreground/75 leading-relaxed">{review.comment}</p>
        )}

        <div className="flex gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => onInteract("LIKE")}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              review.likedByMe ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${review.likedByMe ? "fill-primary/20" : ""}`} />
            {review.likeCount}
          </button>
          <button
            type="button"
            onClick={() => onInteract("DISLIKE")}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              review.dislikedByMe ? "text-destructive font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsDown className={`w-3 h-3 ${review.dislikedByMe ? "fill-destructive/20" : ""}`} />
            {review.dislikeCount}
          </button>
        </div>
      </div>
    </div>
  );
}
