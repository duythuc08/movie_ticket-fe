import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "pending"
  | "cancelled"
  | "paid"
  | "success"
  | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "border border-input bg-transparent text-foreground",
  destructive: "bg-destructive text-destructive-foreground border-transparent",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent",
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