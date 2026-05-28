export const SEAT_STYLES: Record<
  string,
  { label: string; idle: string; legend: string; suggested: string }
> = {
  STANDARD: {
    label: "Ghế thường",
    idle: "bg-slate-200 hover:bg-slate-300 border border-slate-300",
    legend: "bg-slate-200 border border-slate-300",
    suggested: "ring-2 ring-slate-400 ring-offset-1 shadow-[0_0_12px_rgba(148,163,184,0.8)]",
  },
  VIP: {
    label: "Ghế VIP",
    idle: "bg-amber-200 hover:bg-amber-300 border border-amber-300",
    legend: "bg-amber-200 border border-amber-300",
    suggested: "ring-2 ring-amber-400 ring-offset-1 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
  },
  COUPLE: {
    label: "Ghế đôi",
    idle: "bg-rose-200 hover:bg-rose-300 border border-rose-300",
    legend: "bg-rose-200 border border-rose-300",
    suggested: "ring-2 ring-rose-400 ring-offset-1 shadow-[0_0_12px_rgba(251,113,133,0.8)]",
  },
  DEFAULT: {
    label: "Ghế",
    idle: "bg-slate-200 hover:bg-slate-300 border border-slate-300",
    legend: "bg-slate-200",
    suggested: "ring-2 ring-slate-400 ring-offset-1 shadow-[0_0_12px_rgba(148,163,184,0.8)]",
  },
};
