"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, CheckCheck, Inbox, CalendarPlus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchActiveCinemasForSelect, fetchAdminCinemaById } from "@/services/admin/adminCinemaService";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { PageHeader, ConfirmDialog, SingleSelectWithSearch } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { GanttChart } from "@/components/admin/showtime/gantt/GanttChart";
import { ShowtimeDetailDialog } from "@/components/admin/showtime/ShowtimeDetailDialog";
import { ShowtimeEditDialog } from "@/components/admin/showtime/ShowtimeEditDialog";
import { DraftTimeEditDialog } from "@/components/admin/showtime/DraftTimeEditDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AdminCinema } from "@/types/admin.type";
import type { Showtime, DraftProposalCinema } from "@/types/admin/showtime";

interface CinemaProposalCardProps {
  cinema: DraftProposalCinema;
  onViewDetail: (showtime: Showtime) => void;
  onEdit: (showtime: Showtime) => void;
  onApproveDraft: (showtime: Showtime) => void;
  onEditDraftTime: (showtime: Showtime) => void;
  onDeleteDraft: (showtime: Showtime) => void;
  onApproveAllDrafts: (cinemaId: number, date: string) => Promise<void>;
  refreshKey: number;
}

function CinemaProposalCard({
  cinema,
  onViewDetail,
  onEdit,
  onApproveDraft,
  onEditDraftTime,
  onDeleteDraft,
  onApproveAllDrafts,
  refreshKey,
}: CinemaProposalCardProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDateOverride, setSelectedDateOverride] = useState<string | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  // Ngày đang chọn phải luôn là 1 ngày còn DRAFT của rạp này — nếu override không còn hợp lệ (VD
  // ngày đó vừa được duyệt hết), tự rơi về ngày đầu tiên còn lại thay vì giữ giá trị đã lỗi thời.
  const selectedDate = (selectedDateOverride && cinema.dates.some((d) => d.date === selectedDateOverride))
    ? selectedDateOverride
    : (cinema.dates[0]?.date ?? "");

  useEffect(() => {
    if (!isOpen || !token || !selectedDate) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await adminShowtimeService.getShowtimesForGantt(token, cinema.cinemaId, selectedDate);
        setShowtimes(data);
        const cinemaDetail = await fetchAdminCinemaById(token, cinema.cinemaId);
        setRooms(cinemaDetail.rooms || []);
      } catch {
        toast.error(`Lỗi tải lịch chiếu rạp ${cinema.cinemaName}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isOpen, token, cinema.cinemaId, cinema.cinemaName, selectedDate, refreshKey]);

  const draftCount = showtimes.filter((st) => st.showTimeStatus === "DRAFT").length;
  const totalDraftCount = cinema.dates.reduce((sum, d) => sum + d.count, 0);

  const handleApproveAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApprovingAll(true);
    try {
      await onApproveAllDrafts(cinema.cinemaId, selectedDate);
    } finally {
      setIsApprovingAll(false);
    }
  };

  const dateOptions = cinema.dates.map((d) => ({
    value: d.date,
    label: `${new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} (${d.count} suất DRAFT)`,
  }));

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm transition-all">
      <div
        className="bg-muted/40 px-5 py-4 cursor-pointer flex justify-between items-center hover:bg-muted/60 transition-colors"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="font-semibold text-foreground flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {cinema.cinemaName.charAt(0)}
          </div>
          {cinema.cinemaName}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
            {totalDraftCount} suất DRAFT chờ duyệt
          </span>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="w-64" onClick={(e) => e.stopPropagation()}>
              <SingleSelectWithSearch
                options={dateOptions}
                value={selectedDate}
                onChange={(v) => setSelectedDateOverride(v)}
                placeholder="Chọn ngày..."
              />
            </div>
            {draftCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200"
                disabled={isApprovingAll}
                onClick={handleApproveAll}
              >
                <CheckCheck className="w-4 h-4" />
                Duyệt {draftCount} suất DRAFT của ngày này
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Đang tải lịch chiếu...</div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">Rạp chưa có phòng chiếu</div>
          ) : (
            <GanttChart
              rooms={rooms}
              showtimes={showtimes}
              selectedDate={selectedDate ? new Date(selectedDate) : new Date()}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onApproveDraft={onApproveDraft}
              onEditDraftTime={onEditDraftTime}
              onDeleteDraft={onDeleteDraft}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminShowtimeProposalsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [cinemas, setCinemas] = useState<DraftProposalCinema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cinemaFilter, setCinemaFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [allCinemas, setAllCinemas] = useState<AdminCinema[]>([]);
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);
  const [proposeData, setProposeData] = useState<{ cinemaId: string; from: string; to: string }>({ cinemaId: "", from: "", to: "" });

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null);
  const [draftTimeEditShowtime, setDraftTimeEditShowtime] = useState<Showtime | null>(null);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<Showtime | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await adminShowtimeService.getDraftProposalCinemas(token);
      setCinemas(result);
    } catch {
      toast.error("Không thể tải danh sách đề xuất lịch chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadAllCinemas = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchActiveCinemasForSelect(token);
      setAllCinemas(result);
    } catch {
      toast.error("Không thể tải danh sách rạp chiếu");
    }
  }, [token]);

  useEffect(() => { loadAllCinemas(); }, [loadAllCinemas]);

  useEffect(() => { load(); }, [load]);

  const cinemaOptions = useMemo(
    () => [{ value: "", label: "Tất cả rạp" }, ...cinemas.map((c) => ({ value: String(c.cinemaId), label: c.cinemaName }))],
    [cinemas],
  );

  const filteredCinemas = cinemaFilter
    ? cinemas.filter((c) => String(c.cinemaId) === cinemaFilter)
    : cinemas;

  const handleViewDetail = (showtime: Showtime) => {
    setSelectedShowtimeId(showtime.showTimeId);
    setIsDetailOpen(true);
  };

  const handleEdit = (showtime: Showtime) => {
    setEditShowtime(showtime);
    setIsEditOpen(true);
  };

  const handleApproveDraft = async (showtime: Showtime) => {
    if (!token) return;
    try {
      await adminShowtimeService.approveDraft(token, showtime.showTimeId);
      toast.success("Duyệt suất chiếu thành công");
      setRefreshKey((k) => k + 1);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể duyệt suất chiếu này.");
    }
  };

  const handleApproveAllDrafts = async (cinemaId: number, date: string) => {
    if (!token) return;
    try {
      const result = await adminShowtimeService.approveDraftsByCinemaAndDate(token, cinemaId, date);
      toast.success(`Đã duyệt ${result.length} suất chiếu DRAFT`);
      setRefreshKey((k) => k + 1);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể duyệt hàng loạt.");
    }
  };

  const handleProposeSubmit = () => {
    if (!proposeData.cinemaId || !proposeData.from || !proposeData.to) {
      toast.error("Vui lòng chọn Rạp và khoảng ngày");
      return;
    }
    if (proposeData.from > proposeData.to) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    const params = new URLSearchParams({
      cinemaId: proposeData.cinemaId,
      from: proposeData.from,
      to: proposeData.to,
    });
    setIsProposeDialogOpen(false);
    router.push(`/admin/showtimes/propose?${params.toString()}`);
  };

  const handleEditDraftTime = (showtime: Showtime) => {
    setDraftTimeEditShowtime(showtime);
  };

  const handleDeleteDraft = (showtime: Showtime) => {
    setPendingDeleteDraft(showtime);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đề xuất lịch chiếu"
        description="Danh sách các rạp đang có đề xuất suất chiếu DRAFT chờ duyệt — xem trước trên sơ đồ Gantt và duyệt trước khi mở bán."
      >
        <Button
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            const weekLater = new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0];
            setProposeData({ cinemaId: "", from: today, to: weekLater });
            setIsProposeDialogOpen(true);
          }}
          className="gap-2"
        >
          <CalendarPlus className="h-4 w-4" /> Lập lịch mới
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="w-64">
          <SingleSelectWithSearch
            options={cinemaOptions}
            value={cinemaFilter}
            onChange={setCinemaFilter}
            placeholder="Lọc theo rạp..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Đang tải...</div>
      ) : filteredCinemas.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground bg-card border rounded-lg shadow-sm flex flex-col items-center gap-3">
          <Inbox className="w-10 h-10 opacity-40" />
          Không có rạp nào đang có đề xuất DRAFT chờ duyệt.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCinemas.map((cinema) => (
            <CinemaProposalCard
              key={cinema.cinemaId}
              cinema={cinema}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onApproveDraft={handleApproveDraft}
              onEditDraftTime={handleEditDraftTime}
              onDeleteDraft={handleDeleteDraft}
              onApproveAllDrafts={handleApproveAllDrafts}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      )}

      <ShowtimeDetailDialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedShowtimeId(null);
        }}
        showTimeId={selectedShowtimeId}
        onRefreshList={load}
      />

      <ShowtimeEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showtime={editShowtime}
        onSuccess={() => { load(); setRefreshKey((k) => k + 1); }}
      />

      <DraftTimeEditDialog
        showtime={draftTimeEditShowtime}
        onOpenChange={(open) => { if (!open) setDraftTimeEditShowtime(null); }}
        onSuccess={() => { setDraftTimeEditShowtime(null); load(); setRefreshKey((k) => k + 1); }}
      />

      <Dialog open={isProposeDialogOpen} onOpenChange={setIsProposeDialogOpen}>
        <DialogContent data-admin="" className="max-w-md max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">Lập lịch chiếu mới</DialogTitle>
              <p className="text-xs text-muted-foreground">Chọn rạp và khoảng ngày để cấu hình đề xuất theo từng phòng</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => setIsProposeDialogOpen(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn Rạp chiếu <span className="text-destructive">*</span></Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={proposeData.cinemaId}
                  onChange={e => setProposeData(prev => ({ ...prev, cinemaId: e.target.value }))}
                >
                  <option value="">-- Chọn Rạp --</option>
                  {allCinemas.map(c => (
                    <option key={c.cinemaId} value={c.cinemaId.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Từ ngày <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={proposeData.from}
                    onChange={e => setProposeData(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Đến ngày <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={proposeData.to}
                    onChange={e => setProposeData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs text-muted-foreground font-medium">
              Các trường đánh dấu <span className="text-destructive">*</span> không được bỏ trống.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsProposeDialogOpen(false)} className="h-9 text-xs font-semibold">Hủy bỏ</Button>
              <Button onClick={handleProposeSubmit} className="h-9 text-xs font-semibold min-w-35">Tiếp tục</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDeleteDraft}
        onOpenChange={(o) => { if (!o) setPendingDeleteDraft(null); }}
        title="Xóa đề xuất DRAFT"
        description="Bạn có chắc chắn muốn xóa suất chiếu đề xuất này? Suất chưa duyệt nên có thể xóa tự do."
        confirmLabel="Xóa đề xuất"
        confirmVariant="destructive"
        isLoading={isDeletingDraft}
        onConfirm={async () => {
          if (!pendingDeleteDraft || !token) return;
          setIsDeletingDraft(true);
          try {
            await adminShowtimeService.deleteDraft(token, pendingDeleteDraft.showTimeId);
            toast.success("Xóa đề xuất thành công");
            setRefreshKey((k) => k + 1);
            setPendingDeleteDraft(null);
            load();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi khi xóa đề xuất");
          } finally {
            setIsDeletingDraft(false);
          }
        }}
      />
    </div>
  );
}
