"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Ticket, Zap, Search, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuickBooking } from "@/components/home/hooks/use-quick-booking";
import { saveBookingState } from "@/components/booking/utils/bookingStorage";
import type { Movie, Cinema, QuickBookingSlot } from "@/types";

const ROOM_TYPE_LABEL: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  PREMIUM: "Premium",
};

const formatRoomType = (roomType?: string) => ROOM_TYPE_LABEL[roomType ?? ""] || roomType || "2D";

// --- Utility component for Combobox ---
interface ComboboxFieldProps<T> {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: T[];
  getOptionValue: (opt: T) => string;
  getOptionLabel: (opt: T) => string;
  disabled: boolean;
  loading: boolean;
  placeholder: string;
}

function ComboboxField<T>({
  label,
  value,
  onChange,
  options,
  getOptionValue,
  getOptionLabel,
  disabled,
  loading,
  placeholder
}: ComboboxFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(opt => getOptionValue(opt) === value);
  const displayLabel = selectedOpt ? getOptionLabel(selectedOpt) : "";

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-none">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setOpen(!open)}
          className="
            w-full h-11 rounded-lg
            border border-border bg-card text-foreground
            text-sm px-3 pr-9 flex items-center justify-between
            focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent
            hover:border-primary/50
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted/30
            transition-colors duration-150 truncate
          "
        >
          <span className="truncate">{loading ? "Đang tải..." : (displayLabel || placeholder)}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        {open && !disabled && !loading && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center px-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-center text-muted-foreground">Không tìm thấy kết quả.</div>
              ) : (
                filteredOptions.map(opt => (
                  <button
                    key={getOptionValue(opt)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${value === getOptionValue(opt) ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                    onClick={() => {
                      onChange(value === getOptionValue(opt) ? "" : getOptionValue(opt));
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span className="truncate">{getOptionLabel(opt)}</span>
                    {value === getOptionValue(opt) && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickBookingBar() {
  const router = useRouter();

  const {
    movies,
    cinemas,
    dates,
    slots,
    selectedMovie,
    selectedCinema,
    selectedDate,
    selectedSlot,
    loadingMovies,
    loadingCinemas,
    loadingDates,
    loadingSlots,
    handleMovieChange,
    handleCinemaChange,
    handleDateChange,
    handleSlotChange,
    canBook,
  } = useQuickBooking();

  // Auto select today if dates are loaded and selectedDate is null
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      handleDateChange(dates[0].value);
    }
  }, [dates, selectedDate, handleDateChange]);

  // Removed handleBuyTicket as we now navigate immediately upon slot click

  return (
    <div className="w-full border-t-[3px] border-t-primary bg-card shadow-md dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.45)] relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col gap-5">

        {/* ── Mobile: title inline ─────────────────────── */}
        <div className="flex items-center gap-2 lg:hidden">
          <Zap className="w-4 h-4 text-primary fill-primary shrink-0" />
          <span className="text-sm font-black tracking-widest text-primary uppercase">
            Đặt Vé Nhanh
          </span>
        </div>

        {/* TẦNG 1: 3 Lựa Chọn (Phim, Rạp, Ngày) */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end w-full">
          {/* Desktop Title Block */}
          <div className="hidden lg:flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                Quick Booking
              </span>
            </div>
            <div className="h-11 flex items-center border-l-2 border-primary pl-3">
              <span className="text-[15px] font-black tracking-widest text-primary uppercase whitespace-nowrap leading-none">
                ĐẶT VÉ NHANH
              </span>
            </div>
          </div>
          
          <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />

          {/* Chọn Phim (Combobox) */}
          <ComboboxField<Movie>
            label="Chọn Phim"
            value={selectedMovie?.id.toString() ?? ""}
            onChange={handleMovieChange}
            options={movies}
            getOptionValue={(m) => m.id.toString()}
            getOptionLabel={(m) => m.title}
            disabled={loadingMovies}
            loading={loadingMovies}
            placeholder="-- Tìm hoặc chọn phim --"
          />

          {/* Chọn Rạp (Combobox) */}
          <ComboboxField<Cinema>
            label="Chọn Rạp"
            value={selectedCinema?.id.toString() ?? ""}
            onChange={handleCinemaChange}
            options={cinemas}
            getOptionValue={(c) => c.id.toString()}
            getOptionLabel={(c) => c.name}
            disabled={!selectedMovie || loadingCinemas}
            loading={loadingCinemas}
            placeholder="-- Tìm hoặc chọn rạp --"
          />

          {/* Chọn Ngày (Native Select is fine for dates as there are max 6) */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-none">
              Chọn Ngày
            </label>
            <div className="relative">
              <select
                value={selectedDate ?? ""}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!selectedCinema || loadingDates}
                className="
                  w-full h-11 rounded-lg
                  border border-border bg-card text-foreground
                  text-sm px-3 pr-9
                  appearance-none cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent
                  hover:border-primary/50
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted/30
                  transition-colors duration-150
                "
              >
                <option value="">{loadingDates ? "Đang tải..." : "-- Chọn ngày --"}</option>
                {dates.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>
        </div>

        {/* TẦNG 2: Hiển thị Suất Chiếu dạng Chips */}
        {selectedDate && (
          <div className="flex flex-col gap-3 pt-3 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {loadingSlots && <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>}
            </p>
            
            <div className="flex flex-wrap gap-3">
              {!loadingSlots && slots.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  Chưa có suất chiếu cho ngày {dates.find((d) => d.value === selectedDate)?.label}
                </span>
              ) : (
                slots.map((slot) => {
                  const isSelected = selectedSlot?.showTimeId === slot.showTimeId;
                  return (
                    <button
                      key={slot.showTimeId}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-bold border transition-all duration-200
                        flex flex-col items-center justify-center gap-1
                        ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105' : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'}
                      `}
                      onClick={() => {
                        handleSlotChange(slot.showTimeId.toString());
                        if (!selectedMovie || !selectedCinema || !selectedDate) return;
                        saveBookingState({
                          movieId: selectedMovie.id,
                          movie: selectedMovie.title,
                          movieDuration: selectedMovie.durationText,
                          moviePoster: selectedMovie.poster,
                          cinemaId: selectedCinema.id,
                          cinema: selectedCinema.name,
                          location: selectedCinema.address,
                          time: slot.startTime,
                          showTimeId: slot.showTimeId,
                          date: selectedDate,
                          roomName: slot.roomName,
                          roomType: slot.roomType,
                        });
                        router.push(`/seat-selection/${slot.showTimeId}`);
                      }}
                    >
                      <span className={`text-lg font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {slot.startTime}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {formatRoomType(slot.roomType)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
