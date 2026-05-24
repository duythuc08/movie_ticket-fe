"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { genreFormSchema, type GenreFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminGenre } from "@/types/admin.type";

interface GenreFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    genre?: AdminGenre | null;
    onSubmit: (data: GenreFormSchema) => Promise<void>;
    isSubmitting: boolean;
}

export function GenreFormDialog({
    open,
    onOpenChange,
    genre,
    onSubmit,
    isSubmitting,
}: GenreFormDialogProps) {
    const isCreateMode = !genre;

    return (
        <AdminFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isCreateMode ? "Thêm thể loại mới" : "Chi tiết thể loại"}
            subtitle={!isCreateMode ? genre.name : undefined}
            schema={genreFormSchema}
            defaultValues={{
                name: genre?.name ?? "",
                description: genre?.description ?? "",
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Tạo thể loại"
            readOnly={!isCreateMode}
            maxWidth="max-w"
        >
            {(form) => (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="genre-name">
                            Tên thể loại <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="genre-name"
                            {...form.register("name")}
                            placeholder="VD: Hành động, Tình cảm, Kinh dị..."
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="genre-description">Mô tả</Label>
                        <Textarea
                            id="genre-description"
                            {...form.register("description")}
                            placeholder="Mô tả ngắn về thể loại phim..."
                            rows={4}
                        />
                    </div>
                </>
            )}
        </AdminFormDialog>
    );
}
