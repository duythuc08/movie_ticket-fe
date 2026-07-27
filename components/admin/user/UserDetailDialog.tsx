/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { adminUserService } from "@/services/admin/adminUserService";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser, AdminUserRecommendation, LoyaltyHistory, UserReviewHistoryItem } from "@/types/admin/user";
import type { ApiPagedResult } from "@/types/admin.type";
import { X, User, TrendingUp, TrendingDown, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const USER_STATUS_LABELS: Record<string, string> = {
  UNVERIFIED: "Chưa xác minh",
  VERIFIED:   "Đã xác minh",
  BANNED:     "Bị cấm",
};

const USER_STATUS_VARIANT: Record<string, string> = {
  UNVERIFIED: "warning",
  VERIFIED:   "success",
  BANNED:     "destructive",
};

const ENTITY_STATUS_LABELS: Record<string, string> = {
  ACTIVE:   "Hoạt động",
  INACTIVE: "Vô hiệu hóa",
};

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export const UserDetailDialog = ({ open, onOpenChange, userId }: UserDetailDialogProps) => {
  const { token } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<LoyaltyHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [recommendation, setRecommendation] = useState<AdminUserRecommendation | null>(null);
  const [reviews, setReviews] = useState<UserReviewHistoryItem[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const loadUser = useCallback(async () => {
    if (!token || !userId) return;
    setIsLoading(true);
    try {
      setUser(await adminUserService.getUserById(token, userId));
    } catch {
      toast.error("Không thể tải thông tin người dùng");
      onOpenChange(false);
    } finally { setIsLoading(false); }
  }, [token, userId, onOpenChange]);

  const loadHistory = useCallback(async (page = 0) => {
    if (!token || !userId) return;
    setIsHistoryLoading(true);
    try {
      const res: ApiPagedResult<LoyaltyHistory> = await adminUserService.getLoyaltyHistory(token, userId, page, 10);
      if (page === 0) {
        setHistory(res.content);
      } else {
        setHistory((prev) => [...prev, ...res.content]);
      }
      setHistoryTotal(res.totalElements);
      setHistoryPage(page);
    } catch { toast.error("Không thể tải lịch sử điểm"); }
    finally { setIsHistoryLoading(false); }
  }, [token, userId]);

  const loadRecommendation = useCallback(async () => {
    if (!token || !userId) return;
    setIsRecommendLoading(true);
    try {
      setRecommendation(await adminUserService.getUserRecommendations(token, userId));
    } catch { toast.error("Không thể tải gợi ý phim"); }
    finally { setIsRecommendLoading(false); }
  }, [token, userId]);

  const loadReviews = useCallback(async (page = 0) => {
    if (!token || !userId) return;
    setIsReviewsLoading(true);
    try {
      const res: ApiPagedResult<UserReviewHistoryItem> = await adminUserService.getReviewHistory(token, userId, page, 12);
      if (page === 0) {
        setReviews(res.content);
      } else {
        setReviews((prev) => [...prev, ...res.content]);
      }
      setReviewsTotal(res.totalElements);
      setReviewsPage(page);
    } catch { toast.error("Không thể tải lịch sử đánh giá"); }
    finally { setIsReviewsLoading(false); }
  }, [token, userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  function handleTabChange(key: string) {
    setActiveTab(key);
    if (key === "loyalty" && userId && history.length === 0) loadHistory(0);
    if (key === "recommend" && userId && !recommendation) loadRecommendation();
    if (key === "reviews" && userId && reviews.length === 0) loadReviews(0);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short", hour12: false });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* HEADER */}
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {user ? [user.firstname, user.lastname].filter(Boolean).join(" ") || user.username : "Chi tiết người dùng"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {user && (
                  <>
                    <span className="text-xs text-muted-foreground">{user.username}</span>
                    <Badge variant={USER_STATUS_VARIANT[user.userStatus] as BadgeVariant} className="text-xs">
                      {USER_STATUS_LABELS[user.userStatus]}
                    </Badge>
                    <Badge variant={user.entityStatus === "ACTIVE" ? "secondary" : "outline"} className="text-xs">
                      {ENTITY_STATUS_LABELS[user.entityStatus]}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button" variant="ghost" size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          {/* TAB BAR */}
          <div className="flex border-b bg-card px-6 pt-4 shrink-0">
            {[
              { key: "info",      label: "Thông tin" },
              { key: "loyalty",   label: "Điểm tích lũy" },
              { key: "recommend", label: "Phim phù hợp" },
              { key: "reviews",   label: "Lịch sử đánh giá" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "px-4 py-2 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Đang tải...</div>
            ) : user && (
              <>
                {activeTab === "info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                      <div className="p-4 border-b bg-muted/20">
                        <h3 className="text-sm font-semibold">Thông tin cá nhân</h3>
                      </div>
                      <div className="p-4 space-y-3 text-sm">
                        <InfoRow label="Email" value={user.username} />
                        <InfoRow label="Họ tên" value={[user.firstname, user.lastname].filter(Boolean).join(" ") || "—"} />
                        <InfoRow label="Điện thoại" value={user.phoneNumber || "—"} />
                        <InfoRow label="Ngày sinh" value={user.birthday || "—"} />
                        <InfoRow label="Vai trò" value={
                          <div className="flex gap-1">
                            {user.roles.map((r) => (
                              <Badge key={r.name} variant={r.name === "ADMIN" ? "default" : "outline"} className="text-xs">{r.name}</Badge>
                            ))}
                          </div>
                        } />
                      </div>
                    </div>

                    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                      <div className="p-4 border-b bg-muted/20">
                        <h3 className="text-sm font-semibold">Thành viên & Điểm</h3>
                      </div>
                      <div className="p-4 space-y-3 text-sm">
                        <InfoRow label="Hạng thành viên" value={
                          user.memberShipTierName
                            ? <Badge variant="secondary">{user.memberShipTierName}</Badge>
                            : <span className="text-muted-foreground italic">Chưa có hạng</span>
                        } />
                        <div className="pt-2 flex justify-between items-center">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">Điểm tích lũy</p>
                          <p className="text-3xl font-bold text-primary">
                            {user.loyaltyPoints.toLocaleString("vi-VN")}
                            <span className="text-sm font-normal text-muted-foreground ml-1">điểm</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "recommend" && (
                  <div className="space-y-4">
                    {isRecommendLoading ? (
                      <div className="p-12 text-center text-muted-foreground">Đang tải...</div>
                    ) : !recommendation ? null : (
                      <>
                        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                          <div className="p-4 border-b bg-muted/20 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Các thể loại yêu thích của {user.firstname} {user.lastname}</h3>
                          </div>
                          <div className="p-4">
                            {recommendation.genreProfile.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Chưa có dữ liệu tương tác</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {recommendation.genreProfile.map((g, i) => (
                                  <div key={g.genreName} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/30 text-sm">
                                    <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                                    <span className="font-medium">{g.genreName}</span>
                                    <span className="text-xs text-muted-foreground">({g.likedCount} phim · {g.weightPct}%)</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation table */}
                        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-primary" />
                              <h3 className="text-sm font-semibold">Top phim đề xuất</h3>
                            </div>
                            {recommendation.usedColdStart && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Phim nổi bật (khách hàng mới)
                              </Badge>
                            )}
                          </div>
                          {recommendation.recommendations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">Chưa có phim đề xuất</div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">#</th>
                                  <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Phim</th>
                                  <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Thời lượng</th>
                                  <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Đánh giá TB</th>
                                  <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Điểm dự đoán</th>
                                  <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Nguồn</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {recommendation.recommendations.map((movie, idx) => (
                                  <tr key={movie.movieId} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-3">
                                        {movie.posterUrl ? (
                                          <img src={movie.posterUrl} alt={movie.title} className="w-9 h-12 object-cover rounded shrink-0" />
                                        ) : (
                                          <div className="w-9 h-12 rounded bg-muted shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                          <p className="font-medium truncate max-w-40">{movie.title}</p>
                                          {movie.genres && movie.genres.length > 0 && (
                                            <p
                                              className="text-xs text-muted-foreground truncate max-w-40"
                                              title={movie.genres.join(" · ")}
                                            >
                                              {movie.genres.join(" · ")}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3 text-right text-muted-foreground">
                                      {movie.duration ? `${movie.duration} phút` : "—"}
                                    </td>
                                    <td className="p-3 text-right">
                                      {movie.averageRating > 0 ? (
                                        <span className="flex items-center justify-end gap-1">
                                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                          {movie.averageRating.toFixed(1)}
                                        </span>
                                      ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-primary">
                                      {movie.predictedScore.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-right">
                                      <Badge variant={movie.source === "cf" ? "secondary" : "outline"} className="text-xs">
                                        {movie.source === "cf" ? "CF" : "Nổi bật"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "loyalty" && (
                  <div className="space-y-2">
                    {isHistoryLoading && history.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">Đang tải lịch sử...</div>
                    ) : history.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border rounded-xl bg-muted/10">
                        Chưa có lịch sử điểm
                      </div>
                    ) : (
                      <>
                        <div className="border rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Thay đổi</th>
                                <th className="p-3 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Mô tả</th>
                                <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Số dư</th>
                                <th className="p-3 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Thời gian</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {history.map((h) => (
                                <tr key={h.historyId} className="hover:bg-muted/20 transition-colors">
                                  <td className="p-3">
                                    <div className={cn(
                                      "flex items-center gap-1.5 font-semibold",
                                      h.pointsChange > 0 ? "text-emerald-600" : "text-destructive"
                                    )}>
                                      {h.pointsChange > 0
                                        ? <TrendingUp className="w-4 h-4" />
                                        : <TrendingDown className="w-4 h-4" />}
                                      {h.pointsChange > 0 ? "+" : ""}{h.pointsChange}
                                    </div>
                                  </td>
                                  <td className="p-3 text-muted-foreground">{h.description}</td>
                                  <td className="p-3 text-right">
                                    <span className="text-muted-foreground">{h.oldBalance}</span>
                                    <span className="mx-1 text-muted-foreground">→</span>
                                    <span className="font-medium">{h.newBalance}</span>
                                  </td>
                                  <td className="p-3 text-right text-xs text-muted-foreground">
                                    {formatDate(h.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {history.length < historyTotal && (
                          <div className="text-center pt-2">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => loadHistory(historyPage + 1)}
                              disabled={isHistoryLoading}
                              className="text-xs"
                            >
                              {isHistoryLoading ? "Đang tải..." : `Tải thêm (${historyTotal - history.length} còn lại)`}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {isReviewsLoading && reviews.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">Đang tải lịch sử đánh giá...</div>
                    ) : reviews.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border rounded-xl bg-muted/10">
                        Người dùng chưa đánh giá phim nào
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {reviews.map((r) => (
                            <div key={r.reviewId} className="border rounded-xl bg-card shadow-sm overflow-hidden">
                              {r.posterUrl ? (
                                <img src={r.posterUrl} alt={r.movieTitle} className="w-full aspect-2/3 object-cover" />
                              ) : (
                                <div className="w-full aspect-2/3 bg-muted" />
                              )}
                              <div className="p-3 space-y-1.5">
                                <p className="font-medium text-sm truncate" title={r.movieTitle}>{r.movieTitle}</p>
                                {r.genres.length > 0 && (
                                  <p className="text-xs text-muted-foreground truncate" title={r.genres.join(" · ")}>
                                    {r.genres.join(" · ")}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 pt-0.5">
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-semibold">{r.rating}/5</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {reviews.length < reviewsTotal && (
                          <div className="text-center pt-2">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => loadReviews(reviewsPage + 1)}
                              disabled={isReviewsLoading}
                              className="text-xs"
                            >
                              {isReviewsLoading ? "Đang tải..." : `Tải thêm (${reviewsTotal - reviews.length} còn lại)`}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-end gap-4 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-semibold px-6">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground text-xs uppercase tracking-wider shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
