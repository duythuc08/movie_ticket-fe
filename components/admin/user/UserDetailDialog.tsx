import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminUserService } from "@/services/admin/adminUserService";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser, LoyaltyHistory } from "@/types/admin/user";
import type { ApiPagedResult } from "@/types/admin.type";
import { X, User, TrendingUp, TrendingDown } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
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

  useEffect(() => {
    setUser(null); setHistory([]); setHistoryPage(0); setActiveTab("info");
    if (open && userId) loadUser();
  }, [open, userId, loadUser]);

  useEffect(() => {
    if (activeTab === "loyalty" && userId && history.length === 0) loadHistory(0);
  }, [activeTab, userId, history.length, loadHistory]);

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
                    <Badge variant={USER_STATUS_VARIANT[user.userStatus] as any} className="text-xs">
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
              { key: "info",    label: "Thông tin" },
              { key: "loyalty", label: "Điểm tích lũy" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                        <div className="pt-2">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Điểm tích lũy</p>
                          <p className="text-3xl font-bold text-primary">
                            {user.loyaltyPoints.toLocaleString("vi-VN")}
                            <span className="text-sm font-normal text-muted-foreground ml-1">điểm</span>
                          </p>
                        </div>
                      </div>
                    </div>
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
