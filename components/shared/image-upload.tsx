"use client";

import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadPreviewProps {
    currentImageUrl?: string | null;
    onFileSelect: (file: File | null) => void;
    className?: string;
    aspectRatio?: "poster" | "banner" | "avatar";
}

const ASPECT_CLASSES: Record<string, string> = {
    poster: "aspect-[2/3]",
    banner: "aspect-[16/5]",
    avatar: "aspect-square",
};

export function ImageUploadPreview({
    currentImageUrl,
    onFileSelect,
    className,
    aspectRatio = "poster",
}: ImageUploadPreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayUrl = previewUrl ?? currentImageUrl;

    const handleFileSelect = useCallback((file: File | undefined | null) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Vui lòng chọn file ảnh"); return; }
        if (file.size > 10 * 1024 * 1024) { toast.error("Kích thước tối đa 10MB"); return; }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onFileSelect(file);
    }, [previewUrl, onFileSelect]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [previewUrl, onFileSelect]);

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(e.dataTransfer.files[0]);
                }}
                className={cn(
                    "relative w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors",
                    ASPECT_CLASSES[aspectRatio],
                    isDragging ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-ring"
                )}
            >
                {displayUrl ? (
                    <>
                        <Image
                            src={displayUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                            sizes="100vw"
                            unoptimized={displayUrl.startsWith("blob:")}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-center gap-1 text-white">
                                <Upload size={20} />
                                <span className="text-xs">Thay ảnh</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80 shadow-md"
                        >
                            <X size={12} />
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon size={32} />
                        <div className="text-center px-4">
                            <p className="text-sm font-medium">Nhấn để chọn ảnh</p>
                            <p className="text-xs mt-0.5">hoặc kéo & thả</p>
                            <p className="text-xs mt-1 opacity-60">JPG, PNG, WEBP — tối đa 10MB</p>
                        </div>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {previewUrl && (
                <p className="text-xs text-amber-500">Ảnh sẽ được tải lên khi bạn nhấn Lưu.</p>
            )}
        </div>
    );
}
