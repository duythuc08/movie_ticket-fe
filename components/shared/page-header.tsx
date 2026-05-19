"use client";

/**
 * USAGE EXAMPLE:
 *
 * <PageHeader title="Quản lý phim" description="Danh sách toàn bộ phim trong hệ thống">
 *   <Button onClick={handleAdd}>
 *     <Plus className="mr-2 h-4 w-4" /> Thêm phim
 *   </Button>
 * </PageHeader>
 */

import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Slot phải: nút hành động, breadcrumb, v.v. */
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
