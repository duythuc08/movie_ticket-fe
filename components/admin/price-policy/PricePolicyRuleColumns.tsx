"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { PricePolicyRule } from "@/types/admin/pricePolicy";
import { ActionMenu, StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface PricePolicyRuleColumnsProps {
  onDelete: (rule: PricePolicyRule) => void;
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  PREMIUM: "Premium",
};

const SEAT_TYPE_LABEL: Record<string, string> = {
  STANDARD: "Thường",
  VIP: "VIP",
  COUPLE: "Đôi",
};

const RULE_TYPE_MAP: StatusMap = {
  WEEKDAY_LIST: { label: "Theo ngày trong tuần", variant: "in_progress" },
  HOLIDAY: { label: "Ngày lễ", variant: "warning" },
  DEFAULT: { label: "Giá mặc định", variant: "secondary" },
};

const WEEKDAY_LABEL: Record<string, string> = {
  MONDAY: "T2", TUESDAY: "T3", WEDNESDAY: "T4", THURSDAY: "T5",
  FRIDAY: "T6", SATURDAY: "T7", SUNDAY: "CN",
};

function ConditionCell({ rule }: { rule: PricePolicyRule }) {
  if (rule.ruleType === "WEEKDAY_LIST") {
    return (
      <div className="flex flex-wrap gap-1">
        {(rule.weekdays ?? []).map((d) => (
          <Badge key={d} variant="secondary" className="text-xs">{WEEKDAY_LABEL[d]}</Badge>
        ))}
      </div>
    );
  }
  if (rule.ruleType === "HOLIDAY") {
    if (!rule.holidays || rule.holidays.length === 0) {
      return <span className="text-xs text-destructive font-medium">Chưa gắn kỳ nghỉ nào</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {rule.holidays.map((h) => (
          <Badge key={h.holidayId} variant="warning" className="text-xs">{h.name}</Badge>
        ))}
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground italic">Áp dụng khi không rule nào khớp</span>;
}

export const createPricePolicyRuleColumns = ({
  onDelete,
}: PricePolicyRuleColumnsProps): ColumnDef<PricePolicyRule>[] => [
    {
      id: "room",
      header: "Loại phòng",
      cell: ({ row }) => <span className="text-sm">{ROOM_TYPE_LABEL[row.original.roomType]}</span>,
    },
    {
      id: "seat",
      header: "Loại ghế",
      cell: ({ row }) => <span className="text-sm">{SEAT_TYPE_LABEL[row.original.seatType]}</span>,
    },
    {
      accessorKey: "ruleType",
      header: "Loại rule",
      cell: ({ row }) => <StatusBadge status={row.original.ruleType} statusMap={RULE_TYPE_MAP} />,
    },
    {
      id: "condition",
      header: "Điều kiện áp dụng",
      cell: ({ row }) => <ConditionCell rule={row.original} />,
    },
    {
      id: "hours",
      header: "Khung giờ",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.startHour && row.original.endHour
            ? `${row.original.startHour.slice(0, 5)} - ${row.original.endHour.slice(0, 5)}`
            : "Cả ngày"}
        </span>
      ),
    },
    {
      accessorKey: "basePrice",
      header: "Giá",
      cell: ({ row }) => (
        <span className="font-semibold text-sm">{row.original.basePrice.toLocaleString("vi-VN")} đ</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionMenu
          actions={[
            { label: "Xóa", icon: Trash2, variant: "destructive", onClick: () => onDelete(row.original) },
          ]}
        />
      ),
    },
  ];

