"use client";

/**
 * USAGE EXAMPLE:
 *
 * const MOVIE_STATUS_MAP = {
 *   ACTIVE:   { label: "Hoạt động", variant: "success"     },
 *   INACTIVE: { label: "Tạm dừng",  variant: "secondary"   },
 *   BANNED:   { label: "Đã khóa",   variant: "destructive" },
 *   PENDING:  { label: "Chờ duyệt", variant: "warning"     },
 * } satisfies StatusMap;
 *
 * <StatusBadge status={row.getValue("status")} statusMap={MOVIE_STATUS_MAP} />
 */

import { Badge, type BadgeVariant } from "@/components/ui/badge";

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

export type StatusMap = Record<string, StatusConfig>;

interface StatusBadgeProps {
  status: string;
  statusMap: StatusMap;
}

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const config = statusMap[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
