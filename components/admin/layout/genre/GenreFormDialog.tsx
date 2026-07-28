"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { genreFormSchema, type GenreFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminGenre } from "@/types/admin.type";
import { useState, useEffect } from "react";

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
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsEditMode(false);
        }
    }, [open]);

    const isReadOnly = !isCreateMode && !isEditMode;

    return (
        <AdminFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isCreateMode ? "Thêm thể loại mới" : isEditMode ? "Cập nhật thể loại" : "Chi tiết thể loại"}
            subtitle={!isCreateMode ? genre.name : undefined}
            schema={genreFormSchema}
            defaultValues={{
                name: genre?.name ?? "",
                description: genre?.description ?? "",
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isCreateMode ? "Thêm mới" : "Cập nhật"}
            readOnly={isReadOnly}
            onEdit={isReadOnly ? () => setIsEditMode(true) : undefined}
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
