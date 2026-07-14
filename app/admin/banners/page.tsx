"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

const BANNER_TYPE_FILTER = [
  { label: "Phim",     value: "MOVIE" },
  { label: "Sự kiện", value: "EVENT" },
];

const ACTIVE_FILTER = [
  { label: "Hiển thị", value: "true"  },
  { label: "Ẩn",       value: "false" },
];

export default function AdminBannersPage() {
  const { token } = useAuth();

  const [banners,        setBanners]        = useState<AdminBanner[]>([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isBulkOpen,     setIsBulkOpen]     = useState(false);
  const [isEditOpen,     setIsEditOpen]     = useState(false);
  const [isDetailOpen,   setIsDetailOpen]   = useState(false);
  const [isDeleteOpen,   setIsDeleteOpen]   = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<AdminBanner | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [isDeleting,     setIsDeleting]     = useState(false);

  const loadBanners = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminBanners(token, { page: 0, size: 999 });
      setBanners(result.content);
    } catch {
      toast.error("Không thể tải danh sách banner");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadBanners(); }, [loadBanners]);

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
      loadBanners();
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
        imageUrl:    finalImageUrl,
        title:       data.title,
        description: data.description || undefined,
        linkUrl:     data.linkUrl     || undefined,
        priority:    data.priority,
        active:      data.active,
        bannerType:  data.bannerType,
        movieId:     data.movieId    ?? undefined,
        eventId:     data.eventId    ?? undefined,
      });
      toast.success(`Đã cập nhật banner "${data.title}"`);
      setIsEditOpen(false);
      setSelectedBanner(null);
      loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu banner thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(banner: AdminBanner) {
    if (!token) return;
    const nextState = banner.active ? "ẩn" : "hiển thị";
    try {
      await toggleBannerActive(token, banner.id, banner.active);
      toast.success(`Đã ${nextState} banner "${banner.title}"`);
      loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${nextState} banner`);
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
      loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa banner");
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useMemo(
    () => createBannerColumns({
      onViewDetail:   handleViewDetail,
      onEdit:         handleEdit,
      onDelete:       handleDeleteClick,
      onToggleActive: handleToggleActive,
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

      <DataTable
        columns={columns}
        data={banners}
        searchKey="title"
        searchPlaceholder="Tìm theo tiêu đề banner..."
        filters={[
          { key: "bannerType", label: "Loại",      options: BANNER_TYPE_FILTER },
          { key: "active",     label: "Hiển thị",  options: ACTIVE_FILTER     },
        ]}
        isLoading={isLoading}
        emptyText="Chưa có banner nào."
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
        onSubmit={async () => {}}
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
