import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePicker24hProps {
  value: string; // format "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimePicker24h = ({ value, onChange, disabled }: TimePicker24hProps) => {
  const [hour, minute] = value ? value.split(":") : ["", ""];

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  // Chỉ cho chọn phút bội số 5 (00, 05, 10, ..., 55) — khớp quy ước làm tròn giờ chiếu toàn hệ thống.
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute || "00"}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour || "00"}:${newMinute}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select key={`hour-${hour}`} value={hour || ""} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="w-[70px] bg-background">
          <SelectValue placeholder="Giờ" />
        </SelectTrigger>
        <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-md">
          {hours.map((h) => (
            <SelectItem key={h} value={h} className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer">{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-bold">:</span>
      <Select key={`minute-${minute}`} value={minute || ""} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="w-[70px] bg-background">
          <SelectValue placeholder="Phút" />
        </SelectTrigger>
        <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-md">
          {minutes.map((m) => (
            <SelectItem key={m} value={m} className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer">{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
