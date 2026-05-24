"use client";

import { useState, useCallback } from "react";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { personFormSchema, type PersonFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminPerson } from "@/types/admin.type";
import { ShieldAlert, Camera, Clapperboard, User2, RefreshCw } from "lucide-react";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import Cropper from "react-easy-crop";

interface PersonFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    person?: AdminPerson | null;
    onSubmit: (data: PersonFormSchema) => Promise<void>;
    isSubmitting: boolean;
}

export function PersonFormDialog({
    open,
    onOpenChange,
    person,
    onSubmit,
    isSubmitting,
}: PersonFormDialogProps) {
    const isCreateMode = !person;

    // Quản lý trạng thái Cắt ảnh (Crop) giống Facebook
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Xử lý khi Admin chọn ảnh từ máy tính
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, onChangeForm: (file: File) => void) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Đút file trực tiếp vào form gốc của bạn
            onChangeForm(file);

            // Tạo đường dẫn tạm thời để hiển thị lên khung kéo thả Cropper
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
        // Mẹo: Trong thực tế, bạn có thể xuất croppedAreaPixels này ra file nếu Backend yêu cầu tọa độ cắt,
        // Hoặc giữ nguyên hệ thống của bạn là gửi nguyên file ảnh gốc lên Server, còn ở đây đóng vai trò căn chỉnh View!
    }, []);

    return (
        <AdminFormDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) setImageSrc(null); // Reset ảnh khi đóng ứng dụng
                onOpenChange(isOpen);
            }}
            title={isCreateMode ? "Thêm nhân sự mới" : "Cập nhật thông tin nhân sự"}
            subtitle={!isCreateMode ? `Đang chỉnh sửa: ${person.name}` : "Điền thông tin diễn viên hoặc đạo diễn"}
            schema={personFormSchema}
            defaultValues={{
                name: person?.name ?? "",
                avatarUrl: person?.avatarUrl ?? "",
                movieRole: person?.movieRole ?? "ACTOR",
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isCreateMode ? "Thêm mới" : "Lưu thay đổi"}
            maxWidth="max-w-md"
        >
            {(form) => (
                <div className="space-y-6 py-2">

                    {/* 1. KHU VỰC AVATAR CAO CẤP: Kéo thả căn chỉnh chuẩn Facebook */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-muted/40 to-muted/10 border border-border/60 rounded-2xl shadow-sm">

                        {!imageSrc ? (
                            /* TRẠNG THÁI 1: Chưa chọn ảnh mới - Hiển thị Avatar tròn sang trọng */
                            <label className="relative w-28 h-28 rounded-full border-2 border-dashed border-green-500/40 hover:border-green-500 bg-background shadow-sm flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-all duration-300">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        // Đăng ký trực tiếp vào react-hook-form thông qua setValue ẩn
                                        if (e.target.files?.[0]) {
                                            form.setValue("avatarUrl", e.target.files[0], { shouldDirty: true });
                                            onFileChange(e, () => { });
                                        }
                                    }}
                                />

                                {person?.avatarUrl ? (
                                    <img
                                        src={person.avatarUrl}
                                        alt=""
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="text-muted-foreground group-hover:text-primary flex flex-col items-center transition-colors">
                                        <User2 size={28} strokeWidth={1.5} />
                                    </div>
                                )}

                                {/* Lớp kính mờ phủ khi hover */}
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Camera size={18} />
                                    <span className="text-[10px] font-medium mt-1">Thay ảnh</span>
                                </div>
                            </label>
                        ) : (
                            /* TRẠNG THÁI 2: ĐÃ CHỌN ẢNH - Kích hoạt bộ kéo thả căn chỉnh (Cropper) */
                            <div className="w-full space-y-4">
                                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border bg-neutral-950">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={false}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>

                                {/* Thanh điều khiển Zoom ảnh linh hoạt */}
                                <div className="space-y-1.5 px-1">
                                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                                        <span>Thanh thu phóng (Zoom)</span>
                                        <span>{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        aria-label="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                {/* Nút bấm để chọn lại ảnh khác */}
                                <div className="flex justify-center">
                                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full cursor-pointer transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    form.setValue("avatarUrl", e.target.files[0], { shouldDirty: true });
                                                    onFileChange(e, () => { });
                                                }
                                            }}
                                        />
                                        <RefreshCw size={12} /> Chọn ảnh khác
                                    </label>
                                </div>
                            </div>
                        )}

                        {!imageSrc && (
                            <p className="text-[11px] font-medium text-muted-foreground mt-3">
                                Nhấp để tải lên ảnh nhân sự (Hỗ trợ kéo thả căn chỉnh)
                            </p>
                        )}
                    </div>

                    {/* 2. Trường nhập họ và tên */}
                    <div className="space-y-1.5">
                        <Label htmlFor="person-name" className="text-sm font-semibold text-foreground">
                            Họ và tên nhân sự <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="person-name"
                            {...form.register("name")}
                            placeholder="Nhập họ và tên đầy đủ..."
                            className="h-10 bg-background border-border/80 shadow-sm focus-visible:ring-primary/20 rounded-lg"
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                <ShieldAlert size={12} /> {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* 3. Trường lựa chọn vai trò cấu trúc lại dứt điểm lỗi click */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                            Vai trò chính trong đoàn phim <span className="text-destructive">*</span>
                        </Label>

                        <Controller
                            name="movieRole"
                            control={form.control}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 gap-3">

                                    {/* Ô chọn DIỄN VIÊN */}
                                    <div
                                        onClick={() => field.onChange("ACTOR")}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer select-none transition-all duration-200 bg-background hover:bg-muted/50",
                                            field.value === "ACTOR"
                                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                                : "border-border/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            field.value === "ACTOR" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <User2 size={16} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold text-foreground">Diễn viên</span>
                                            <span className="text-[10px] text-muted-foreground">Cast / Actor</span>
                                        </div>
                                    </div>

                                    {/* Ô chọn ĐẠO DIỄN */}
                                    <div
                                        onClick={() => field.onChange("DIRECTOR")}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer select-none transition-all duration-200 bg-background hover:bg-muted/50",
                                            field.value === "DIRECTOR"
                                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                                : "border-border/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            field.value === "DIRECTOR" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Clapperboard size={16} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold text-foreground">Đạo diễn</span>
                                            <span className="text-[10px] text-muted-foreground">Director</span>
                                        </div>
                                    </div>

                                </div>
                            )}
                        />

                        {form.formState.errors.movieRole && (
                            <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                <ShieldAlert size={12} /> {form.formState.errors.movieRole.message}
                            </p>
                        )}
                    </div>

                </div>
            )}
        </AdminFormDialog>
    );
}