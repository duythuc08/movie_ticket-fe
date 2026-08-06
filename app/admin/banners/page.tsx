"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminBanner } from "@/types/admin.type";
import type { BannerFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAdminBanners,
  createBannersBulk,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
} from "@/services/admin/adminBannerService";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";
import { DataTable, PageHeader, DeleteDialog } from "@/components/shared";
import { BannerFormDialog } from "@/components/admin/banner/BannerFormDialog";
import { BannerBulkDialog } from "@/components/admin/banner/BannerBulkDialog";
import type { BannerBulkPayload } from "@/components/admin/banner/BannerBulkDialog";
import { createBannerColumns } from "@/components/admin/banner/BannerColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BANNER_TYPE_FILTER = [
  { label: "Phim", value: "MOVIE" },
  { label: "Sự kiện", value: "EVENT" },
];

const ACTIVE_FILTER = [
  { label: "Hiển thị", value: "true" },
  { label: "Ẩn", value: "false" },
];

const PAGE_SIZE = 10;

export default function AdminBannersPage() {
  const { token } = useAuth();

  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<AdminBanner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [bannerType, setBannerType] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setKeyword(keywordInput), 500);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const loadBanners = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminBanners(token, {
        page: targetPage,
        size: PAGE_SIZE,
        bannerType: bannerType as AdminBanner["bannerType"] | undefined,
        active: activeFilter !== undefined ? activeFilter === "true" : undefined,
        title: keyword || undefined,
      });
      setBanners(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách banner");
    } finally {
      setIsLoading(false);
    }
  }, [token, bannerType, activeFilter, keyword]);

  useEffect(() => { setPage(0); loadBanners(0); }, [loadBanners]);

  function handleViewDetail(banner: AdminBanner) {
    setSelectedBanner(banner);
    setIsDetailOpen(true);
  }

  function handleEdit(banner: AdminBanner) {
    setSelectedBanner(banner);
    setIsEditOpen(true);
  }

  function handleDeleteClick(banner: AdminBanner) {
    setSelectedBanner(banner);
    setIsDeleteOpen(true);
  }

  async function handleBulkSubmit(items: BannerBulkPayload[]) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const payloads = await Promise.all(
        items.map(async (item) => ({
          imageUrl: await uploadFileAndGetUrl(token, item.imageFile),
          title: item.title,
          description: item.description,
          linkUrl: item.linkUrl,
          priority: item.priority,
          active: item.active,
          bannerType: item.bannerType,
          movieId: item.movieId ?? undefined,
          eventId: item.eventId ?? undefined,
        }))
      );
      const created = await createBannersBulk(token, payloads);
      toast.success(`Đã thêm ${created.length} banner thành công`);
      setIsBulkOpen(false);
      loadBanners(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thêm banner thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(data: BannerFormSchema) {
    if (!token || !selectedBanner) return;
    setIsSubmitting(true);
    try {
      let finalImageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";
      if (data.imageUrl instanceof File) {
        finalImageUrl = await uploadFileAndGetUrl(token, data.imageUrl);
      }
      await updateBanner(token, selectedBanner.id, {
        imageUrl: finalImageUrl,
        title: data.title,
        description: data.description || undefined,
        linkUrl: data.linkUrl || undefined,
        priority: data.priority,
        active: data.active,
        bannerType: data.bannerType,
        movieId: data.movieId ?? undefined,
        eventId: data.eventId ?? undefined,
      });
      toast.success(`Đã cập nhật banner "${data.title}"`);
      setIsEditOpen(false);
      setSelectedBanner(null);
      loadBanners(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu banner thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(banner: AdminBanner) {
    if (!token) return;
    const isCurrentlyActive = banner.entityStatus === "ACTIVE";
    const nextState = isCurrentlyActive ? "vô hiệu hóa" : "kích hoạt";
    try {
      await toggleBannerActive(token, banner.id, isCurrentlyActive);
      toast.success(`Đã ${nextState} banner "${banner.title}"`);
      loadBanners(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${nextState} banner`);
    }
  }

  async function handleToggleHome(banner: AdminBanner) {
    if (!token) return;
    const nextState = banner.active ? "ẩn khỏi trang chủ" : "hiển thị trên trang chủ";
    try {
      await updateBanner(token, banner.id, {
        imageUrl: banner.imageUrl,
        title: banner.title,
        description: banner.description || undefined,
        linkUrl: banner.linkUrl || undefined,
        priority: banner.priority,
        active: !banner.active,
        bannerType: banner.bannerType,
        movieId: banner.movies?.movieId ?? null,
        eventId: banner.event?.id ?? null,
      });
      toast.success(`Đã ${nextState} banner "${banner.title}"`);
      loadBanners(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể thay đổi hiển thị banner`);
    }
  }

  async function handleDeleteConfirm() {
    if (!token || !selectedBanner) return;
    setIsDeleting(true);
    try {
      await deleteBanner(token, selectedBanner.id);
      toast.success(`Đã xóa banner "${selectedBanner.title}"`);
      setIsDeleteOpen(false);
      setSelectedBanner(null);
      loadBanners(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa banner");
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useMemo(
    () => createBannerColumns({
      onViewDetail: handleViewDetail,
      onEdit: handleEdit,
      onDelete: handleDeleteClick,
      onToggleActive: handleToggleActive,
      onToggleHome: handleToggleHome,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Banner"
        description="Quản lý banner hiển thị trên trang chủ hệ thống"
      >
        <Button onClick={() => setIsBulkOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm Banner
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề banner..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={bannerType ?? "__all__"}
          onValueChange={(value) => setBannerType(value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent data-admin="">
            {BANNER_TYPE_FILTER.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="__all__">Tất cả</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={activeFilter ?? "__all__"}
          onValueChange={(value) => setActiveFilter(value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Hiển thị" />
          </SelectTrigger>
          <SelectContent data-admin="">
            {ACTIVE_FILTER.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="__all__">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={banners}
        isLoading={isLoading}
        emptyText="Chưa có banner nào."
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => {
            setPage(newPage);
            loadBanners(newPage);
          },
        }}
      />

      <BannerBulkDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        onSubmit={handleBulkSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Dialog chỉnh sửa */}
      <BannerFormDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedBanner(null);
        }}
        banner={selectedBanner}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Dialog xem chi tiết (read-only) */}
      <BannerFormDialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedBanner(null);
        }}
        banner={selectedBanner}
        onSubmit={async () => { }}
        isSubmitting={false}
        readOnly
        onEdit={() => {
          setIsDetailOpen(false);
          setIsEditOpen(true);
        }}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        itemName={selectedBanner?.title}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
