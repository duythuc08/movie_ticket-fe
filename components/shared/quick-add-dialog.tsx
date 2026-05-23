"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── QuickAdd Genre ────────────────────────────────────────────────────────────

interface QuickAddGenreProps {
    onCreated: (genreName: string) => void;
    onCreateRequest: (name: string, description: string) => Promise<void>;
}

export function QuickAddGenreButton({ onCreated, onCreateRequest }: QuickAddGenreProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpen() { setName(""); setDescription(""); setError(null); setIsOpen(true); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { setError("Tên thể loại không được để trống"); return; }
        setIsSubmitting(true);
        setError(null);
        try {
            await onCreateRequest(name.trim(), description.trim());
            onCreated(name.trim());
            setIsOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tạo thể loại thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                title="Thêm thể loại mới"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
            >
                <Plus size={16} />
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thêm thể loại mới</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="quick-genre-name">Tên thể loại <span className="text-destructive">*</span></Label>
                            <Input id="quick-genre-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Hành động..." autoFocus />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-genre-desc">Mô tả</Label>
                            <Input id="quick-genre-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn..." />
                        </div>
                        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Hủy</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo thể loại"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
    const [name, setName] = useState("");
    const [role, setRole] = useState<"DIRECTOR" | "ACTOR">(defaultRole);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpen() { setName(""); setRole(defaultRole); setError(null); setIsOpen(true); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { setError("Tên không được để trống"); return; }
        setIsSubmitting(true);
        setError(null);
        try {
            const created = await onCreateRequest(name.trim(), role);
            onCreated(created.id, created.name);
            setIsOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tạo thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    const roleLabel = defaultRole === "DIRECTOR" ? "đạo diễn" : "diễn viên";

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                title={`Thêm ${roleLabel} mới`}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
            >
                <Plus size={16} />
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="capitalize">Thêm {roleLabel} mới</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Họ và tên <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên..." autoFocus />
                        </div>
                        <div className="space-y-2">
                            <Label>Vai trò</Label>
                            <div className="flex gap-4">
                                {(["DIRECTOR", "ACTOR"] as const).map((r) => (
                                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-primary" />
                                        <span className="text-sm">{r === "DIRECTOR" ? "Đạo diễn" : "Diễn viên"}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Hủy</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}