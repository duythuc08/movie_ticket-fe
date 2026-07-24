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
  | "warning"
  | "in_progress"
  | "expired"
  | "used";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  upcoming: "bg-blue-50 text-blue-700 light:bg-blue-950/50 light:text-blue-400 border-transparent",
  default: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "border border-input bg-transparent text-foreground",
  destructive: "bg-destructive text-destructive-foreground border-transparent",
  pending: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/30 border",
  cancelled: "bg-rose-500/20 text-rose-600 dark:text-rose-500 border-rose-500/30 border",
  paid: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border-emerald-500/30 border",
  success: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border-emerald-500/30 border",
  warning: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/30 border",
  in_progress: "bg-blue-500/20 text-blue-600 dark:text-blue-500 border-blue-500/30 border",
  expired: "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 border",
  used: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 border",
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