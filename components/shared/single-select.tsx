"use client";

import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SelectOption } from "./multi-select";

interface SingleSelectWithSearchProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    isLoading?: boolean;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
    /**
     * Khi truyền, mỗi lần gõ (debounce ~400ms) gọi callback này thay vì tự lọc
     * client trên `options` — dùng khi danh sách gốc quá lớn để tải hết
     * (server-side search). Khi không truyền, giữ hành vi cũ: lọc client.
     */
    onSearchChange?: (term: string) => void;
}

export function SingleSelectWithSearch({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    searchPlaceholder = "Tìm kiếm...",
    disabled = false,
    className,
    isLoading = false,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore,
    onSearchChange,
}: SingleSelectWithSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!onSearchChange) return;
        const t = setTimeout(() => onSearchChange(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm, onSearchChange]);

    useEffect(() => {
        function handleClickOutside(event: globalThis.MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Auto-load more when list doesn't overflow (no scrollbar to trigger onScroll)
    useEffect(() => {
        if (!isOpen || !hasMore || isLoadingMore || !onLoadMore) return;
        const el = listRef.current;
        if (!el) return;
        if (el.scrollHeight <= el.clientHeight) {
            onLoadMore();
        }
    }, [isOpen, hasMore, isLoadingMore, onLoadMore, options.length]);

    // Khi co onSearchChange, component cha da fetch dung theo searchTerm roi
    // (server-side search) -- khong loc client them de tranh loc chong loc.
    const filteredOptions = onSearchChange
        ? options
        : options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

    const selectedLabel = options.find((o) => o.value === value)?.label;

    function handleSelect(optValue: string) {
        onChange(optValue);
        setIsOpen(false);
        setSearchTerm("");
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange("");
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => { if (!disabled) setIsOpen((p) => !p); }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!disabled) setIsOpen((p) => !p);
                    }
                }}
                className={cn(
                    "flex h-10 w-full items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors cursor-default",
                    "border-input bg-background text-foreground",
                    "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-ring"
                )}
            >
                {isLoading && !selectedLabel ? (
                    <span className="text-muted-foreground select-none text-xs">Đang tải danh sách...</span>
                ) : selectedLabel ? (
                    <span className="flex-1 truncate text-foreground">{selectedLabel}</span>
                ) : (
                    <span className="flex-1 text-muted-foreground select-none">{placeholder}</span>
                )}
                <div className="ml-auto flex items-center gap-1 shrink-0">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                    <ChevronsUpDown size={14} className="text-muted-foreground" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-xl">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                        <Search size={14} className="text-muted-foreground shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm("")} className="text-muted-foreground hover:text-foreground">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <ul
                        ref={listRef}
                        className="max-h-52 overflow-y-auto py-1"
                        onScroll={(e) => {
                            if (!onLoadMore || !hasMore || isLoadingMore) return;
                            const el = e.currentTarget;
                            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
                                onLoadMore();
                            }
                        }}
                    >
                        {filteredOptions.length === 0 ? (
                            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Không tìm thấy</li>
                        ) : (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                                        option.value === value
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    {option.label}
                                </li>
                            ))
                        )}
                        {isLoadingMore && (
                            <li className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                                <Loader2 size={12} className="animate-spin" /> Đang tải thêm...
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
