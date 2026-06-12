"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Edit2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchReviewsByMovie,
  createReview,
  updateReview,
  toggleInteraction,
  type ReviewResponse,
  type MovieReviewPageResponse,
} from "@/components/movie/service/review.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MovieReviewProps {
  movieId: number;
  hasReviewed?: boolean;
}

export function MovieReview({ movieId, hasReviewed: initialHasReviewed }: MovieReviewProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Pick<MovieReviewPageResponse, "averageRating" | "totalReviews" | "ratingDistribution"> | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const [hasReviewed, setHasReviewed] = useState(initialHasReviewed || false);
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null);
  
  // Trạng thái Form thu gọn
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showFullForm, setShowFullForm] = useState(false); // Dùng để thu gọn/mở rộng form giống Shopee
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadReviews = useCallback(async (pageNum: number, reset = false, filter = starFilter) => {
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
  }, [movieId, user, starFilter]);

  useEffect(() => {
    setLoading(true);
    loadReviews(0, true, starFilter);
  }, [movieId, starFilter, loadReviews]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Vui lòng đăng nhập để đánh giá"); return; }
    if (!comment.trim()) { toast.error("Vui lòng nhập nội dung đánh giá"); return; }
    setIsSubmitting(true);
    try {
      if (isEditing && myReview) {
        const updated = await updateReview(myReview.reviewId, movieId, rating, comment);
        setMyReview(updated);
        setIsEditing(false);
        toast.success("Cập nhật thành công. Đánh giá của bạn đang chờ duyệt.");
      } else {
        const created = await createReview(movieId, rating, comment);
        setMyReview(created);
        setHasReviewed(true);
      }
      setComment("");
      setShowFullForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInteraction = async (reviewId: number, type: "LIKE" | "DISLIKE", isMyReview: boolean) => {
    if (!user) { toast.error("Vui lòng đăng nhập để tương tác"); return; }
    try {
      await toggleInteraction(reviewId, type);
      const update = (r: ReviewResponse) => {
        if (r.reviewId !== reviewId) return r;
        const liking = type === "LIKE";
        const disliking = type === "DISLIKE";
        return {
          ...r,
          likeCount: liking ? (r.likedByMe ? r.likeCount - 1 : r.likeCount + 1) : (r.dislikedByMe ? r.likeCount - 1 : r.likeCount),
          dislikeCount: disliking ? (r.dislikedByMe ? r.dislikeCount - 1 : r.dislikeCount + 1) : (r.likedByMe ? r.dislikeCount - 1 : r.dislikeCount),
          likedByMe: liking ? !r.likedByMe : false,
          dislikedByMe: disliking ? !r.dislikedByMe : false,
        };
      };
      if (isMyReview && myReview) setMyReview(update(myReview));
      else setReviews((prev) => prev.map(update));
    } catch { toast.error("Không thể thao tác"); }
  };

  return (
    <div className="w-full space-y-6" id="review-section">
      {/* Khối thống kê nhỏ gọn chia 2 cột trái phải */}
      {summary && summary.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-zinc-900/40 border border-white/5 rounded-xl items-center">
          <div className="flex flex-col items-center md:border-r border-white/10 py-2">
            <span className="text-4xl font-extrabold text-white">{summary.averageRating.toFixed(1)}</span>
            <div className="flex gap-0.5 my-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(summary.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{summary.totalReviews} thành viên đánh giá</span>
          </div>
          
          <div className="md:col-span-2 space-y-1.5 max-w-xs mx-auto md:mx-0 w-full">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.ratingDistribution[star] ?? 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="w-3 text-right font-medium">{star}</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right">{count} lượt</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BỘ FILTER TINH GỌN (CHIPS) ── */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center pb-2 border-b border-white/5">
          <span className="text-xs text-muted-foreground mr-2">Bộ lọc:</span>
          {([null, 5, 4, 3, 2, 1] as (number | null)[]).map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all border
                ${starFilter === s
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"}`}
            >
              {s === null ? "Tất cả bình luận" : `${s} Sao`}
            </button>
          ))}
        </div>
      )}

      {/* ── FORM REVIEW SIÊU GỌN THEO KIỂU SHOPEE / TIKI ── */}
      {(!hasReviewed || isEditing) && (
        <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{isEditing ? "Chỉnh sửa đánh giá của bạn" : "Bạn đã xem phim này? Chia sẻ cảm nhận ngay"}</h3>
              <p className="text-xs text-muted-foreground">Chọn số sao để mở rộng khung viết bình luận.</p>
            </div>
            {/* Nhấp chọn sao trực tiếp */}
            <div className="flex gap-1 bg-zinc-950/60 p-2 rounded-lg border border-white/5 self-start sm:self-auto">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => { setRating(s); setShowFullForm(true); }} 
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-5 h-5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Ô Textarea chỉ trượt ra khi user click chọn sao */}
          {(showFullForm || isEditing) && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Phim có hay không? Diễn viên diễn xuất thế nào? Chia sẻ tại đây nhé..."
                className="bg-zinc-950 border-zinc-800 text-white text-sm min-h-[80px] focus-visible:ring-yellow-400/50 resize-none"
              />
              <div className="flex gap-2 justify-end items-center">
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setShowFullForm(false); }} className="text-xs text-zinc-400">
                    Hủy
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()} size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-xs h-8">
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                  {isEditing ? "Cập nhật" : "Đăng đánh giá"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BANNER ĐÁNH GIÁ CỦA BẠN KHI ĐÃ SUBMIT (GỌN GÀNG) ── */}
      {myReview && !isEditing && (
        <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Đánh giá của bạn</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < myReview.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{format(new Date(myReview.createdAt), "dd/MM/yyyy")}</span>
            </div>
            <p className="text-sm text-zinc-300 italic">"{myReview.comment}"</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setRating(myReview.rating); setComment(myReview.comment); setIsEditing(true); }} 
            className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs h-7 px-2.5 hover:bg-zinc-800"
          >
            <Edit2 className="w-3 h-3 mr-1" /> Sửa
          </Button>
        </div>
      )}

      {/* ── DANH SÁCH BÌNH LUẬN KHÁCH HÀNG ── */}
      <div className="space-y-3 pt-2">
        {loading && page === 0 ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
          </div>
        ) : (
          <>
            {reviews.map((r) => (
              <ReviewItem key={r.reviewId} review={r} onInteract={(type) => handleInteraction(r.reviewId, type, false)} />
            ))}

            {reviews.length === 0 && !myReview && (
              <div className="text-center py-10 text-zinc-500 border border-dashed border-white/5 rounded-xl">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  {starFilter != null ? `Không có đánh giá ${starFilter} sao nào.` : "Chưa có bình luận nào cho phim này."}
                </p>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  onClick={() => loadReviews(page + 1)}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Xem thêm đánh giá cũ hơn
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── COMPONENT CON: DÒNG COMMENT TINH GIẢN (ReviewItem) ── */
function ReviewItem({ review, onInteract }: { review: ReviewResponse; onInteract: (type: "LIKE" | "DISLIKE") => void; }) {
  return (
    <div className="p-4 bg-zinc-900/20 border border-white/5 rounded-xl flex gap-4 transition-all hover:bg-zinc-900/40">
      {/* Avatar Chữ cái cuối (LastName) */}
      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0 uppercase">
        {review.fullName?.trim().split(" ").pop()?.charAt(0) ?? review.username.charAt(0)}
      </div>
      
      {/* Nội dung cụm bên phải */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-xs">{review.fullName || review.username}</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`} />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-zinc-500">{format(new Date(review.createdAt), "dd/MM/yyyy")}</span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-normal">{review.comment}</p>

        {/* Nút Like / Dislike Mini */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onInteract("LIKE")}
            className={`flex items-center gap-1 text-[11px] transition-colors ${review.likedByMe ? "text-blue-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <ThumbsUp className={`w-3 h-3 ${review.likedByMe ? "fill-blue-400/20" : ""}`} /> {review.likeCount}
          </button>
          <button
            onClick={() => onInteract("DISLIKE")}
            className={`flex items-center gap-1 text-[11px] transition-colors ${review.dislikedByMe ? "text-red-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <ThumbsDown className={`w-3 h-3 ${review.dislikedByMe ? "fill-red-400/20" : ""}`} /> {review.dislikeCount}
          </button>
        </div>
      </div>
    </div>
  );
}