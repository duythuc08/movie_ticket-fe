"use client";

/**
 * USAGE EXAMPLE:
 *
 * <ActionMenu
 *   actions={[
 *     { label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(row.original) },
 *     { label: "Xem chi tiết", icon: Eye, onClick: () => onView(row.original) },
 *     { label: "Xóa", icon: Trash2, onClick: () => onDelete(row.original), variant: "destructive" },
 *   ]}
 * />
 */

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
}

export function ActionMenu({ actions }: ActionMenuProps) {
  const visible = actions.filter((a) => !a.hidden);
  const defaultActions = visible.filter((a) => a.variant !== "destructive");
  const destructiveActions = visible.filter((a) => a.variant === "destructive");
  const hasSeparator = defaultActions.length > 0 && destructiveActions.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <span className="sr-only">Mở menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-admin="">
        {defaultActions.map((action) => (
          <ActionMenuItem key={action.label} action={action} />
        ))}

        {hasSeparator && <DropdownMenuSeparator />}

        {destructiveActions.map((action) => (
          <ActionMenuItem key={action.label} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionMenuItem({ action }: { action: ActionItem }) {
  const Icon = action.icon;
  return (
    <DropdownMenuItem
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(action.variant === "destructive" && "text-destructive focus:text-destructive")}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {action.label}
    </DropdownMenuItem>
  );
}
