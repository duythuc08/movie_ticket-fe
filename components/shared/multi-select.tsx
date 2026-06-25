"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

export interface SelectOption {
    label: string;
    value: string;
}

interface MultiSelectWithSearchProps {
    options: SelectOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    quickAddSlot?: ReactNode;
}

export function MultiSelectWithSearch({
    options,
    selectedValues,
    onChange,
    placeholder = "Chọn...",
    searchPlaceholder = "Tìm kiếm...",
    disabled = false,
    className,
    quickAddSlot,
}: MultiSelectWithSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const filteredOptions = options
        .filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const aSelected = selectedValues.includes(a.value);
            const bSelected = selectedValues.includes(b.value);
            if (aSelected === bSelected) return 0;
            return aSelected ? -1 : 1;
        });

    const handleToggle = useCallback(
        (value: string) => {
            onChange(
                selectedValues.includes(value)
                    ? selectedValues.filter((v) => v !== value)
                    : [...selectedValues, value]
            );
        },
        [selectedValues, onChange]
    );

    const handleRemove = useCallback(
        (value: string, e: MouseEvent) => {
            e.stopPropagation();
            onChange(selectedValues.filter((v) => v !== value));
        },
        [selectedValues, onChange]
    );

    const selectedLabels = selectedValues
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SelectOption => !!o);

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
                    "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors cursor-default",
                    "border-input bg-background text-foreground",
                    "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-ring"
                )}
            >
                {selectedLabels.length === 0 ? (
                    <span className="text-muted-foreground select-none">{placeholder}</span>
                ) : (
                    selectedLabels.map(({ value, label }) => (
                        <span
                            key={value}
                            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary border border-primary/30"
                        >
                            {label}
                            <button
                                type="button"
                                onClick={(e) => handleRemove(value, e)}
                                className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    ))
                )}
                <ChevronsUpDown size={14} className="ml-auto shrink-0 text-muted-foreground" />
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
                    {quickAddSlot && (
                        <div className="border-b border-border px-2 py-1.5">
                            {quickAddSlot}
                        </div>
                    )}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Không tìm thấy</li>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <li
                                        key={option.value}
                                        onClick={() => handleToggle(option.value)}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                                            isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <span className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                                        )}>
                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                        </span>
                                        {option.label}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
