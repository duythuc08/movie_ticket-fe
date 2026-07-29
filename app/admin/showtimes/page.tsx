"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Table, CalendarRange, X, CalendarPlus, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchActiveCinemasForSelect, fetchAdminCinemaById } from "@/services/admin/adminCinemaService";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { DataTable, PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { createShowtimeColumns } from "@/components/admin/showtime/ShowtimeColumns";
import { ShowtimeFilters } from "@/components/admin/showtime/ShowtimeFilters";
import { ShowtimeFormDialog } from "@/components/admin/showtime/ShowtimeFormDialog";
import { ShowtimeDetailDialog } from "@/components/admin/showtime/ShowtimeDetailDialog";
import { ShowtimeEditDialog } from "@/components/admin/showtime/ShowtimeEditDialog";
import { DraftTimeEditDialog } from "@/components/admin/showtime/DraftTimeEditDialog";
import { GanttChart } from "@/components/admin/showtime/gantt/GanttChart";
import type { AdminCinema } from "@/types/admin.type";
import type { Showtime } from "@/types/admin/showtime";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CinemaGanttSection = ({
  cinema,
  selectedDate,
  keyword,
  token,
  onAddClick,
  onUpdateShowtimeTime,
  isExpanded,
  onViewDetail,
  onEdit,
  onApproveDraft,
  onEditDraftTime,
  onDeleteDraft,
  onApproveAllDrafts,
  refreshKey,
}: any) => {
  const [isOpen, setIsOpen] = useState(isExpanded);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setIsOpen(true);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isOpen && token && selectedDate) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const dateStr = selectedDate || new Date().toISOString().split("T")[0];
          const data = await adminShowtimeService.getShowtimesForGantt(token, cinema.cinemaId, dateStr);

          let filtered = data;
          if (keyword) {
            filtered = data.filter(st => st.movieTitle.toLowerCase().includes(keyword.toLowerCase()));
          }
          setShowtimes(filtered);

          const cinemaDetail = await fetchAdminCinemaById(token, cinema.cinemaId);
          setRooms(cinemaDetail.rooms || []);
        } catch (error) {
          toast.error(`Lỗi tải gantt cho rạp ${cinema.name}`);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, selectedDate, keyword, token, cinema.cinemaId, cinema.name, refreshKey]);

  const draftCount = showtimes.filter(st => st.showTimeStatus === "DRAFT").length;

  const handleApproveAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApprovingAll(true);
    try {
      await onApproveAllDrafts(cinema.cinemaId, selectedDate);
    } finally {
      setIsApprovingAll(false);
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm transition-all">
      <div
        className="bg-muted/40 px-5 py-4 cursor-pointer flex justify-between items-center hover:bg-muted/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-semibold text-foreground flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {cinema.name.charAt(0)}
          </div>
          {cinema.name}
        </div>
        <div className="flex items-center gap-3">
          {isOpen && draftCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200"
              disabled={isApprovingAll}
              onClick={handleApproveAll}
            >
              <CheckCheck className="w-4 h-4" />
              Duyệt {draftCount} suất DRAFT của rạp này
            </Button>
          )}
          <div className="text-muted-foreground">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-border">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Đang tải lịch chiếu rạp {cinema.name}...</div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">Rạp chưa có phòng chiếu</div>
          ) : (
            <GanttChart
              rooms={rooms}
              showtimes={showtimes}
              selectedDate={selectedDate ? new Date(selectedDate) : new Date()}
              onAddClick={onAddClick}
              onUpdateShowtimeTime={onUpdateShowtimeTime}
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
};

export default function AdminShowtimesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [ganttRooms, setGanttRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<"table" | "gantt">("gantt");

  const [isInitialAddOpen, setIsInitialAddOpen] = useState(false);
  const [initialAddData, setInitialAddData] = useState<{ cinemaId: string; date: string }>({ cinemaId: "", date: "" });
  const [expandedCinemaId, setExpandedCinemaId] = useState<number | null>(null);

  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);
  const [proposeData, setProposeData] = useState<{ cinemaId: string; from: string; to: string }>({ cinemaId: "", from: "", to: "" });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const [draftTimeEditShowtime, setDraftTimeEditShowtime] = useState<Showtime | null>(null);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<Showtime | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  const [formInitialRoom, setFormInitialRoom] = useState<number | undefined>();
  const [formInitialTime, setFormInitialTime] = useState<string | undefined>();
  const [pendingCancel, setPendingCancel] = useState<Showtime | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [filters, setFilters] = useState<{ cinemaId?: string; status?: string; date?: string; keyword?: string }>({});
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);

  const loadCinemas = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchActiveCinemasForSelect(token);
      setCinemas(result);
    } catch {
      toast.error("Không thể tải danh sách rạp chiếu");
    }
  }, [token]);

  const loadShowtimes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (viewMode === "table") {
        const filterParts = [];
        if (filters.cinemaId) filterParts.push(`rooms.cinemas.cinemaId:${filters.cinemaId}`);
        if (filters.status) filterParts.push(`showTimeStatus:'${filters.status}'`);
        if (filters.date) {
          const startOfDay = new Date(filters.date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(filters.date);
          endOfDay.setHours(23, 59, 59, 999);
          filterParts.push(`startTime>'${startOfDay.toISOString()}'`);
          filterParts.push(`startTime<'${endOfDay.toISOString()}'`);
        }
        if (filters.keyword) filterParts.push(`movieTitle~'${filters.keyword}'`);

        const filterString = filterParts.join(" and ");

        const result = await adminShowtimeService.getShowtimes(token, 0, 100, filterString || undefined);
        
        const statusOrder: Record<string, number> = {
          "SCHEDULED": 1,
          "ONGOING": 2,
          "COMPLETED": 3,
          "FULLY_BOOKED": 4,
          "CANCELLED": 5
        };
        
        const sortedData = [...result.content].sort((a, b) => {
          const orderA = statusOrder[a.showTimeStatus] || 99;
          const orderB = statusOrder[b.showTimeStatus] || 99;
          return orderA - orderB;
        });

        setShowtimes(sortedData);
      }
    } catch {
      toast.error("Không thể tải danh sách suất chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters, viewMode]);

  useEffect(() => {
    loadCinemas();
  }, [loadCinemas]);

  useEffect(() => {
    if (viewMode === "gantt" && !filters.date) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset*60*1000));
      setFilters(prev => ({ ...prev, date: localToday.toISOString().split('T')[0] }));
      return; 
    }
    loadShowtimes();
  }, [loadShowtimes, viewMode, filters.date]);

  const handleViewDetail = (showtime: Showtime) => {
    setSelectedShowtimeId(showtime.showTimeId);
    setIsDetailOpen(true);
  };

  const handleCancelShowtime = (showtime: Showtime) => {
    setPendingCancel(showtime);
  };

  const handleGanttAddClick = (roomId: number, startTimeStr: string) => {
    const d = new Date(startTimeStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setFormInitialRoom(roomId);
    setFormInitialTime(localISOTime);
    setIsFormOpen(true);
  };

  const handleGanttUpdateShowtime = async (showTimeId: number, roomId: number, newStartTime: string) => {
    if (!token) return;
    try {
      const detail = await adminShowtimeService.getShowtimeDetail(token, showTimeId);
      await adminShowtimeService.updateShowtime(token, showTimeId, {
        movieId: detail.movies.movieId,
        roomId,
        startTime: newStartTime,
      });
      toast.success("Cập nhật lịch chiếu thành công");
      setGanttRefreshKey(k => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật lịch chiếu. Hãy thử lại.");
    }
  };

  const handleGanttViewDetail = (showtime: Showtime) => {
    setSelectedShowtimeId(showtime.showTimeId);
    setIsDetailOpen(true);
  };

  const handleGanttEditShowtime = (showtime: Showtime) => {
    setEditShowtime(showtime);
    setIsEditOpen(true);
  };

  const handleApproveDraft = async (showtime: Showtime) => {
    if (!token) return;
    try {
      await adminShowtimeService.approveDraft(token, showtime.showTimeId);
      toast.success("Duyệt suất chiếu thành công");
      setGanttRefreshKey(k => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể duyệt suất chiếu này.");
    }
  };

  const handleApproveAllDrafts = async (cinemaId: number, date: string) => {
    if (!token) return;
    try {
      const result = await adminShowtimeService.approveDraftsByCinemaAndDate(token, cinemaId, date);
      toast.success(`Đã duyệt ${result.length} suất chiếu DRAFT`);
      setGanttRefreshKey(k => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể duyệt hàng loạt.");
    }
  };

  const handleEditDraftTime = (showtime: Showtime) => {
    setDraftTimeEditShowtime(showtime);
  };

  const handleDeleteDraft = (showtime: Showtime) => {
    setPendingDeleteDraft(showtime);
  };

  const handleInitialAddSubmit = () => {
    if (!initialAddData.cinemaId || !initialAddData.date) {
      toast.error("Vui lòng chọn Rạp và Ngày");
      return;
    }
    const cId = parseInt(initialAddData.cinemaId, 10);
    setFilters(prev => ({ ...prev, date: initialAddData.date }));
    setExpandedCinemaId(cId);
    setViewMode("gantt");
    setIsInitialAddOpen(false);
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

  const columns = useMemo(
    () => createShowtimeColumns({
      onViewDetail: handleViewDetail,
      onCancel: handleCancelShowtime,
    }),
    [token] // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Suất chiếu"
        description="Quản lý danh sách, xem chi tiết và cấu hình giá vé cho các suất chiếu"
      >
        <div className="flex items-center gap-4">
          <div className="flex bg-muted p-1 rounded-md">
            <Button 
              variant={viewMode === "table" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setFilters({}); setExpandedCinemaId(null); setViewMode("table"); setFilterResetKey(k => k + 1); }}
              className={`px-4 ${viewMode === "table" ? "bg-primary text-primary-foreground shadow-sm" : ""}`}
            >
              <Table className="w-4 h-4 mr-2" /> Bảng
            </Button>
            <Button 
              variant={viewMode === "gantt" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setViewMode("gantt"); setExpandedCinemaId(null); }}
              className={`px-4 relative group overflow-visible ${viewMode === "gantt" ? "bg-primary text-primary-foreground shadow-sm" : ""}`}
            >
              <CalendarRange className="w-4 h-4 mr-2" /> Gantt
              <div className="ml-2 w-4 h-4 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center font-bold text-white shadow-sm border border-primary-foreground/30">!</div>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 w-48 whitespace-normal text-center font-normal">
                Kéo thả khối giờ để Cập nhật. Click vào ô trống để Thêm mới.
              </div>
            </Button>
          </div>
          <Button variant="outline" onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            const weekLater = new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0];
            setProposeData({ cinemaId: "", from: today, to: weekLater });
            setIsProposeDialogOpen(true);
          }} className="gap-2">
            <CalendarPlus className="h-4 w-4" /> Lập lịch mới
          </Button>
          <Button onClick={() => {
            setInitialAddData({ cinemaId: "", date: filters.date || new Date().toISOString().split("T")[0] });
            setIsInitialAddOpen(true);
          }} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm suất chiếu
          </Button>
        </div>
      </PageHeader>

      <ShowtimeFilters key={filterResetKey} cinemas={cinemas} onFilterChange={setFilters} initialDate={viewMode === "gantt" ? filters.date : undefined} viewMode={viewMode} />

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={showtimes}
          isLoading={isLoading}
          emptyText="Không tìm thấy suất chiếu nào."
        />
      ) : (
        <div className="space-y-4">
          {(expandedCinemaId !== null ? cinemas.filter(c => c.cinemaId === expandedCinemaId) : cinemas).map(cinema => (
            <CinemaGanttSection
              key={cinema.cinemaId}
              cinema={cinema}
              selectedDate={filters.date}
              keyword={filters.keyword}
              token={token}
              isExpanded={expandedCinemaId === cinema.cinemaId}
              onAddClick={handleGanttAddClick}
              onUpdateShowtimeTime={handleGanttUpdateShowtime}
              onViewDetail={handleGanttViewDetail}
              onEdit={handleGanttEditShowtime}
              onApproveDraft={handleApproveDraft}
              onEditDraftTime={handleEditDraftTime}
              onDeleteDraft={handleDeleteDraft}
              onApproveAllDrafts={handleApproveAllDrafts}
              refreshKey={ganttRefreshKey}
            />
          ))}
          {cinemas.length === 0 && (
            <div className="p-10 text-center text-muted-foreground bg-card border rounded-lg shadow-sm">Không có rạp chiếu nào</div>
          )}
        </div>
      )}

      <ShowtimeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => { loadShowtimes(); setGanttRefreshKey(k => k + 1); }}
        initialRoomId={formInitialRoom}
        initialStartTime={formInitialTime}
      />

      <ShowtimeDetailDialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedShowtimeId(null);
        }}
        showTimeId={selectedShowtimeId}
        onRefreshList={loadShowtimes}
      />

      <ShowtimeEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showtime={editShowtime}
        onSuccess={() => { loadShowtimes(); setGanttRefreshKey(k => k + 1); }}
      />

      <Dialog open={isInitialAddOpen} onOpenChange={setIsInitialAddOpen}>
        <DialogContent data-admin="" className="max-w-md max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">Thêm suất chiếu mới</DialogTitle>
              <p className="text-xs text-muted-foreground">Chọn rạp và ngày để chuyển sang chế độ Gantt</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => setIsInitialAddOpen(false)}
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
                  value={initialAddData.cinemaId}
                  onChange={e => setInitialAddData(prev => ({ ...prev, cinemaId: e.target.value }))}
                >
                  <option value="">-- Chọn Rạp --</option>
                  {cinemas.map(c => (
                    <option key={c.cinemaId} value={c.cinemaId.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ngày chiếu <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={initialAddData.date}
                  onChange={e => setInitialAddData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs text-muted-foreground font-medium">
              Các trường đánh dấu <span className="text-destructive">*</span> không được bỏ trống.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsInitialAddOpen(false)} className="h-9 text-xs font-semibold">Hủy bỏ</Button>
              <Button onClick={handleInitialAddSubmit} className="h-9 text-xs font-semibold min-w-[140px]">Tiếp tục</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  {cinemas.map(c => (
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
              <Button onClick={handleProposeSubmit} className="h-9 text-xs font-semibold min-w-[140px]">Tiếp tục</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DraftTimeEditDialog
        showtime={draftTimeEditShowtime}
        onOpenChange={(open) => { if (!open) setDraftTimeEditShowtime(null); }}
        onSuccess={() => { setDraftTimeEditShowtime(null); setGanttRefreshKey(k => k + 1); }}
      />

      <ConfirmDialog
        open={!!pendingCancel}
        onOpenChange={(o) => { if (!o) setPendingCancel(null); }}
        title="Huỷ suất chiếu"
        description="Bạn có chắc chắn muốn huỷ suất chiếu này? Hành động này không thể hoàn tác."
        confirmLabel="Huỷ suất chiếu"
        confirmVariant="destructive"
        isLoading={isCancelling}
        onConfirm={async () => {
          if (!pendingCancel || !token) return;
          setIsCancelling(true);
          try {
            await adminShowtimeService.cancelShowtime(token, pendingCancel.showTimeId);
            toast.success("Huỷ suất chiếu thành công");
            loadShowtimes();
            setPendingCancel(null);
          } catch {
            toast.error("Lỗi khi huỷ suất chiếu");
          } finally {
            setIsCancelling(false);
          }
        }}
      />

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
            setGanttRefreshKey(k => k + 1);
            setPendingDeleteDraft(null);
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
