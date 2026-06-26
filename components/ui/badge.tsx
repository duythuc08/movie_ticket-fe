import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "pending"
  | "upcoming"
  | "cancelled"
  | "paid"
  | "success"
  | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  upcoming: "bg-blue-50 text-blue-700 light:bg-blue-950/50 light:text-blue-400 border-transparent",
  default: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "border border-input bg-transparent text-foreground",
  destructive: "bg-destructive text-destructive-foreground border-transparent",
  pending: "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] border-transparent",
  cancelled: "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)] border-transparent",
  paid: "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-transparent",
  success: "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] border-transparent",
  warning: "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] border-transparent",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariantClasses[variant],
        className
      )}
      {...props}
    />
  );
}