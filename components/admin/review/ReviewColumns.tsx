"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, CheckCircle, XCircle, EyeOff, ThumbsUp } from "lucide-react";
import type { AdminReview } from "@/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface ReviewColumnsProps {
  onApprove: (review: AdminReview) => void;
  onReject: (review: AdminReview) => void;
  onHide: (review: AdminReview) => void;
  onViewInteractions: (review: AdminReview) => void;
}

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  APPROVED: { label: "Đã duyệt", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  HIDDEN: { label: "Đã ẩn", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export function createReviewColumns({
  onApprove,
  onReject,
  onHide,
  onViewInteractions,
}: ReviewColumnsProps): ColumnDef<AdminReview>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Người dùng",
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{review.fullName}</span>
            <span className="text-xs text-muted-foreground">{review.username}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "movieTitle",
      header: "Phim",
      cell: ({ row }) => <span className="font-medium">{row.original.movieTitle}</span>,
    },
    {
      accessorKey: "rating",
      header: "Đánh giá",
      cell: ({ row }) => {
        const rating = row.original.rating;
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold">{rating}</span>
            <span className="text-yellow-500 text-sm">⭐</span>
          </div>
        );
      },
    },
    {
      accessorKey: "comment",
      header: "Nội dung",
      cell: ({ row }) => {
        const text = row.original.comment;
        return (
          <p className="max-w-[200px] truncate text-sm" title={text}>
            {text}
          </p>
        );
      },
    },
    {
      accessorKey: "reviewStatus",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.reviewStatus;
        const config = STATUS_MAP[status] || STATUS_MAP.PENDING;
        return (
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "interactions",
      header: "Tương tác",
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-blue-500">
              👍 {review.likeCount}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              👎 {review.dislikeCount}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày đăng",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const review = row.original;
        const status = review.reviewStatus;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-admin="">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onViewInteractions(review)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem lượt tương tác
              </DropdownMenuItem>

              {status === "PENDING" && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(review)} className="text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> Duyệt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReject(review)} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" /> Từ chối
                  </DropdownMenuItem>
                </>
              )}

              {status === "APPROVED" && (
                <DropdownMenuItem onClick={() => onHide(review)} className="text-gray-600">
                  <EyeOff className="mr-2 h-4 w-4" /> Ẩn bình luận
                </DropdownMenuItem>
              )}

              {status === "HIDDEN" && (
                <DropdownMenuItem onClick={() => onApprove(review)} className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" /> Khôi phục (Duyệt)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
