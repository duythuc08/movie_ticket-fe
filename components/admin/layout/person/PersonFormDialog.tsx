"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { personFormSchema, type PersonFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminPerson } from "@/types/admin.type";
import { Camera, Clapperboard, RefreshCw, ShieldAlert, User2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Controller } from "react-hook-form";

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

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    }, [open, person?.id]);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, onChangeForm: (file: File) => void) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            onChangeForm(file);

            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    return (
        <AdminFormDialog
            key={person?.id ?? "create"}
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) setImageSrc(null);
                onOpenChange(isOpen);
            }}
            title={isCreateMode ? "Thêm nhân sự mới" : "Cập nhật thông tin nhân sự"}
            subtitle={!isCreateMode ? `Đang chỉnh sửa: ${person.name}` : "Điền thông tin diễn viên hoặc đạo diễn"}
            resetKey={person?.id ?? "create"}
            schema={personFormSchema}
            defaultValues={{
                name: person?.name ?? "",
                avatarUrl: person?.avatarUrl ?? "",
                movieRole: person?.movieRole ?? ["ACTOR"],
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isCreateMode ? "Thêm mới" : "Lưu thay đổi"}
            maxWidth="max-w-md"
        >
            {(form) => (
                <div className="space-y-6 py-2">

                    <div className="flex flex-col items-center justify-center p-6 bg-linear-to-b from-muted/40 to-muted/10 border border-border/60 rounded-2xl shadow-sm">

                        {!imageSrc ? (
                            <label className="relative w-28 h-28 rounded-full border-2 border-dashed border-green-500/40 hover:border-green-500 bg-background shadow-sm flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-all duration-300">
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

                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Camera size={18} />
                                    <span className="text-[10px] font-medium mt-1">Thay ảnh</span>
                                </div>
                            </label>
                        ) : (
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

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                            Vai trò trong đoàn phim <span className="text-destructive">*</span>
                        </Label>

                        <Controller
                            name="movieRole"
                            control={form.control}
                            render={({ field }) => {
                                const selected = Array.isArray(field.value) ? field.value : [field.value];
                                const toggle = (role: "ACTOR" | "DIRECTOR") => {
                                    if (selected.includes(role)) {
                                        field.onChange(selected.filter((r) => r !== role));
                                    } else {
                                        field.onChange([...selected, role]);
                                    }
                                };
                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            onClick={() => toggle("ACTOR")}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer select-none transition-all duration-200 bg-background hover:bg-muted/50",
                                                selected.includes("ACTOR")
                                                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                                    : "border-border/80"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                selected.includes("ACTOR") ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                <User2 size={16} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-bold text-foreground">Diễn viên</span>
                                                <span className="text-[10px] text-muted-foreground">Cast / Actor</span>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => toggle("DIRECTOR")}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer select-none transition-all duration-200 bg-background hover:bg-muted/50",
                                                selected.includes("DIRECTOR")
                                                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                                    : "border-border/80"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                selected.includes("DIRECTOR") ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Clapperboard size={16} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-bold text-foreground">Đạo diễn</span>
                                                <span className="text-[10px] text-muted-foreground">Director</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
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
