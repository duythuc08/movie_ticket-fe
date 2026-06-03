"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  onFilterChange: (filters: { status: string; search: string; fromDate: string; toDate: string }) => void;
}

export function AdminBookingFilter({ onFilterChange }: Props) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleApply = () => {
    onFilterChange({ status, search, fromDate, toDate });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-admin-4" />
        </div>
        <Input
          type="text"
          placeholder="Tìm theo Mã Đơn hoặc Tên khách..."
          className="pl-10 bg-admin-surface border-admin-border text-admin placeholder:text-admin-4 w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value === "") onFilterChange({ status, search: "", fromDate, toDate });
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>

      <div className="w-full md:w-48">
        <Select value={status} onValueChange={(val) => { setStatus(val); onFilterChange({ status: val, search, fromDate, toDate }); }}>
          <SelectTrigger className="bg-admin-surface border-admin-border text-admin">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-admin-surface border-admin-border text-admin">
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
            <SelectItem value="PAID">Đã thanh toán</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
            <SelectItem value="USED">Đã sử dụng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <Input
          type="date"
          className="bg-admin-surface border-admin-border text-admin w-full md:w-40"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <span className="flex items-center text-admin-4">-</span>
        <Input
          type="date"
          className="bg-admin-surface border-admin-border text-admin w-full md:w-40"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-admin-accent hover:bg-admin-accent-h text-admin-accent-fg rounded-md text-sm font-medium transition-colors whitespace-nowrap"
        >
          Lọc
        </button>
      </div>
    </div>
  );
}
