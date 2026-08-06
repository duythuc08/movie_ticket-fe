import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { useAuth } from "@/context/AuthContext";
import { ShowtimeDetail } from "@/types/admin/showtime";
import type { SelectionResponse } from "@/types";
import { ShowtimePriceEdit } from "./ShowtimePriceEdit";
import { AdminSeatGrid } from "./AdminSeatGrid";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { X, MonitorPlay, Film, Building2, Map } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowtimeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTimeId: number | null;
  onRefreshList: () => void;
}

export const ShowtimeDetailDialog = ({ open, onOpenChange, showTimeId, onRefreshList }: ShowtimeDetailDialogProps) => {
  const { token } = useAuth();
  const [detail, setDetail] = useState<ShowtimeDetail | null>(null);
  const [seatData, setSeatData] = useState<SelectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!token || !showTimeId) return;
    setIsLoading(true);
    try {
      const data = await adminShowtimeService.getShowtimeDetail(token, showTimeId);
      setDetail(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải chi tiết suất chiếu");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, showTimeId, onOpenChange]);

  const loadSeats = useCallback(async () => {
    if (!token || !showTimeId) return;
    try {
      const data = await adminShowtimeService.getSeatSelection(token, showTimeId);
      setSeatData(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải sơ đồ ghế");
    }
  }, [token, showTimeId]);

  useEffect(() => {
    if (open && showTimeId) {
      loadDetail();
    } else {
      setDetail(null);
      setSeatData(null);
      setActiveTab("general");
    }
  }, [open, showTimeId, loadDetail]);

  useEffect(() => {
    if (activeTab === "seats" && !seatData) {
      loadSeats();
    }
  }, [activeTab, loadSeats, seatData]);

  // SSE — cập nhật sơ đồ ghế real-time khi tab "Sơ đồ ghế" đang mở
  useEffect(() => {
    if (!open || activeTab !== "seats" || !showTimeId || !token) return;

    // EventSource không hỗ trợ custom header nên phải gắn token qua query param.
    // Gọi thẳng backend thay vì qua rewrite /api-proxy vì Next.js rewrite buffer
    // response và không stream được text/event-stream tới client.
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const es = new EventSource(`${apiBase}/seatShowTimes/selection/${showTimeId}/stream?token=${token}`);

    es.addEventListener("seat-update", (e: MessageEvent) => {
      try {
        const seats = JSON.parse(e.data);
        setSeatData((prev) => prev ? { ...prev, seats } : prev);
      } catch {
        // silent
      }
    });

    es.onerror = () => es.close();

    return () => es.close();
  }, [open, activeTab, showTimeId, token]);

  const handleCancelShowtime = () => setConfirmCancel(true);

  const seatStats = useMemo(() => {
    if (seatData?.seats) {
      let available = 0, sold = 0, blocked = 0;
      for (const seat of seatData.seats) {
        if (seat.seatShowTimeStatus === "AVAILABLE") available++;
        else if (seat.seatShowTimeStatus === "SOLD" || seat.seatShowTimeStatus === "RESERVED") sold++;
        else blocked++;
      }
      return { available, sold, blocked };
    }
    return {
      available: detail?.seatSummary?.available || 0,
      sold: detail?.seatSummary?.sold || 0,
      blocked: detail?.seatSummary?.blocked || 0
    };
  }, [seatData, detail]);

  const pieData = useMemo(() => {
    return [
      { name: 'Trống', value: seatStats.available, color: '#4ade80' },
      { name: 'Đã bán', value: seatStats.sold, color: '#f87171' },
      { name: 'Khóa', value: seatStats.blocked, color: '#94a3b8' }
    ];
  }, [seatStats]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-primary" />
                Chi tiết suất chiếu #{detail?.showTimeId}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate max-w-xl">
                {detail?.movies?.title} — {detail?.rooms?.cinemas?.name}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-0 bg-background flex flex-col">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Đang tải chi tiết...</div>
            ) : detail ? (
              <>
                {detail.showTimeStatus !== "DRAFT" && (
                  <div className="flex border-b bg-card sticky top-0 z-10 px-6 pt-4">
                    <button 
                      onClick={() => setActiveTab("general")} 
                      className={cn("px-4 py-2 border-b-2 font-medium text-sm transition-colors", activeTab === "general" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                      Thông tin chung
                    </button>
                    <button 
                      onClick={() => setActiveTab("seats")} 
                      className={cn("px-4 py-2 border-b-2 font-medium text-sm transition-colors", activeTab === "seats" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                      Sơ đồ ghế
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === "general" && (
                  <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="p-5 space-y-4">
                        <h3 className="font-semibold border-b pb-2 flex items-center gap-2">
                          <Film className="w-4 h-4 text-primary" /> Thông tin suất chiếu
                        </h3>
                        <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Tên Phim</p>
                            <p className="font-bold text-base">{detail.movies?.title}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Phòng</p>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {detail.rooms?.name}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Trạng thái</p>
                            <Badge variant="outline" className="font-bold">{detail.showTimeStatus}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Bắt đầu</p>
                            <p className="font-medium text-emerald-600">
                              {new Date(detail.startTime).toLocaleString("vi-VN", { hour12: false })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Kết thúc</p>
                            <p className="font-medium text-rose-600">
                              {new Date(detail.endTime).toLocaleString("vi-VN", { hour12: false })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-semibold border-b pb-2 flex items-center gap-2 mb-4">
                          <Badge className="px-1.5 py-0 rounded-sm">Giá</Badge> Bảng giá áp dụng
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead className="bg-muted/50 text-left">
                              <tr>
                                <th className="p-2 border-b text-xs font-medium uppercase text-muted-foreground tracking-wider">Loại ghế</th>
                                <th className="p-2 border-b text-xs font-medium uppercase text-muted-foreground tracking-wider text-right">Giá vé</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.prices?.map((price) => (
                                <tr key={price.id ?? price.seatType} className="border-b hover:bg-muted/30 transition-colors">
                                  <td className="p-2 font-medium">{price.seatType}</td>
                                  <td className="p-2 text-right">
                                    <ShowtimePriceEdit
                                      showTimeId={detail.showTimeId}
                                      price={price}
                                      onSuccess={loadDetail}
                                    />
                                  </td>
                                </tr>
                              ))}
                              {(!detail.prices || detail.prices.length === 0) && (
                                <tr>
                                  <td colSpan={2} className="p-8 text-center text-muted-foreground bg-muted/10 rounded-b-lg">
                                    Chưa có cấu hình giá vé cho suất chiếu này
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {activeTab === "seats" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 border rounded-xl p-5 bg-card shadow-sm h-fit">
                      <h3 className="font-semibold border-b pb-2 flex items-center gap-2 mb-4">
                        <Map className="w-4 h-4 text-primary" /> Thống kê ghế ngồi
                      </h3>
                      <div className="py-2">
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid hsl(var(--border))', 
                                backgroundColor: 'hsl(var(--background))',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                              }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle" 
                              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-center text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Đã bán</p>
                          <p className="font-bold text-primary">{seatStats.sold}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Còn trống</p>
                          <p className="font-bold text-emerald-600">{seatStats.available}</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 border rounded-xl p-5 bg-card shadow-sm">
                      {!seatData ? (
                        <div className="p-12 text-center text-muted-foreground">Đang tải sơ đồ ghế...</div>
                      ) : (
                        <div className="max-w-3xl mx-auto">
                          <div className="mb-6">
                            <div className="relative h-2 rounded-t-[50%] overflow-hidden bg-gradient-to-b from-primary/30 to-transparent shadow-[0_-6px_18px_rgba(0,0,0,0.1)]" />
                            <p className="text-center text-[10px] text-muted-foreground tracking-[0.3em] uppercase mt-1.5 font-medium">
                              Màn hình
                            </p>
                          </div>
                          <AdminSeatGrid items={seatData.seats} />
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
          
          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-end gap-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-semibold px-6">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Huỷ suất chiếu"
        description="Bạn có chắc chắn muốn huỷ suất chiếu này không? Hành động này không thể hoàn tác và sẽ hoàn tiền cho các vé đã bán."
        confirmLabel="Huỷ suất chiếu"
        confirmVariant="destructive"
        isLoading={isCancelling}
        onConfirm={async () => {
          if (!token || !detail) return;
          setIsCancelling(true);
          try {
            await adminShowtimeService.cancelShowtime(token, detail.showTimeId);
            toast.success("Huỷ suất chiếu thành công");
            setConfirmCancel(false);
            loadDetail();
            onRefreshList();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi khi huỷ suất chiếu");
          } finally {
            setIsCancelling(false);
          }
        }}
      />
    </Dialog>
  );
};

