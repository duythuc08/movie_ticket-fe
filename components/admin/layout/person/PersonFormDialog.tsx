"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { ImageUploadPreview } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { personFormSchema, type PersonFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminPerson } from "@/types/admin.type";

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

    return (
        <AdminFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isCreateMode ? "Thêm diễn viên / đạo diễn" : "Chỉnh sửa thông tin"}
            subtitle={!isCreateMode ? person.name : undefined}
            schema={personFormSchema}
            defaultValues={{
                name: person?.name ?? "",
                avatarUrl: person?.avatarUrl ?? "",
                movieRole: person?.movieRole ?? "ACTOR",
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isCreateMode ? "Thêm mới" : "Cập nhật"}
            readOnly={!isCreateMode}
            maxWidth="max-w-md"
        >
            {(form) => (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="person-name">
                            Họ và tên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="person-name"
                            {...form.register("name")}
                            placeholder="Nhập họ và tên đầy đủ"
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Ảnh đại diện</Label>
                        <ImageUploadPreview
                            currentImageUrl={person?.avatarUrl ?? null}
                            onFileSelect={(file) =>
                                form.setValue("avatarUrl", file, { shouldDirty: true })
                            }
                            aspectRatio="avatar"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Vai trò <span className="text-destructive">*</span></Label>
                        <div className="flex gap-4">
                            {(["DIRECTOR", "ACTOR"] as const).map((roleOption) => (
                                <label key={roleOption} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value={roleOption}
                                        checked={form.watch("movieRole") === roleOption}
                                        onChange={() => form.setValue("movieRole", roleOption)}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">
                                        {roleOption === "DIRECTOR" ? "Đạo diễn" : "Diễn viên"}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {form.formState.errors.movieRole && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.movieRole.message}
                            </p>
                        )}
                    </div>
                </>
            )}
        </AdminFormDialog>
    );
}
