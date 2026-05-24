"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    genreFormSchema, type GenreFormSchema,
    quickAddPersonSchema, type QuickAddPersonSchema,
} from "@/lib/validations/admin.schemas";

// ─── QuickAdd Genre ────────────────────────────────────────────────────────────

interface QuickAddGenreProps {
    onCreated: (genreName: string) => void;
    onCreateRequest: (name: string, description: string) => Promise<void>;
}

export function QuickAddGenreButton({ onCreated, onCreateRequest }: QuickAddGenreProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(data: GenreFormSchema) {
        setIsSubmitting(true);
        try {
            await onCreateRequest(data.name, data.description || "");
            onCreated(data.name);
            setIsOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Tạo thể loại thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                <Plus size={14} className="shrink-0" />
                Tạo thể loại mới
            </button>

            <AdminFormDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title="Thêm thể loại mới"
                schema={genreFormSchema}
                defaultValues={{ name: "", description: "" }}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Tạo thể loại"
                maxWidth="max-w-md"
            >
                {(form) => (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="quick-genre-name">
                                Tên thể loại <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-genre-name"
                                {...form.register("name")}
                                placeholder="VD: Hành động, Tình cảm, Kinh dị..."
                                autoFocus
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-genre-desc">Mô tả</Label>
                            <Textarea
                                id="quick-genre-desc"
                                {...form.register("description")}
                                placeholder="Mô tả ngắn về thể loại phim..."
                                rows={4}
                            />
                        </div>
                    </>
                )}
            </AdminFormDialog>
        </>
    );
}

// ─── QuickAdd Person ───────────────────────────────────────────────────────────

interface QuickAddPersonProps {
    defaultRole: "DIRECTOR" | "ACTOR";
    onCreated: (personId: number, personName: string) => void;
    onCreateRequest: (name: string, role: "DIRECTOR" | "ACTOR") => Promise<{ id: number; name: string }>;
}

export function QuickAddPersonButton({ defaultRole, onCreated, onCreateRequest }: QuickAddPersonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roleLabel = defaultRole === "DIRECTOR" ? "đạo diễn" : "diễn viên";

    async function handleSubmit(data: QuickAddPersonSchema) {
        setIsSubmitting(true);
        try {
            const created = await onCreateRequest(data.name, data.movieRole);
            onCreated(created.id, created.name);
            setIsOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Tạo thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                <Plus size={14} className="shrink-0" />
                Tạo {roleLabel} mới
            </button>

            <AdminFormDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title={`Thêm ${roleLabel} mới`}
                schema={quickAddPersonSchema}
                defaultValues={{ name: "", movieRole: defaultRole, avatarUrl: "" }}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel={`Thêm ${roleLabel}`}
                maxWidth="max-w-md"
            >
                {(form) => (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="quick-person-name">
                                Họ và tên <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-person-name"
                                {...form.register("name")}
                                placeholder="Nhập họ và tên đầy đủ"
                                autoFocus
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Vai trò <span className="text-destructive">*</span>
                            </Label>
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
        </>
    );
}
