export const SEAT_STYLES: Record<
  string,
  { label: string; idle: string; legend: string }
> = {
  STANDARD: {
    label: "Ghế thường",
    idle: "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 border border-slate-300 dark:border-slate-500",
    legend: "bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-500",
  },
  VIP: {
    label: "Ghế VIP",
    idle: "bg-amber-200 hover:bg-amber-300 dark:bg-amber-700 dark:hover:bg-amber-600 border border-amber-300 dark:border-amber-600",
    legend: "bg-amber-200 dark:bg-amber-700 border border-amber-300 dark:border-amber-600",
  },
  COUPLE: {
    label: "Ghế đôi",
    idle: "bg-rose-200 hover:bg-rose-300 dark:bg-rose-800 dark:hover:bg-rose-700 border border-rose-300 dark:border-rose-700",
    legend: "bg-rose-200 dark:bg-rose-800 border border-rose-300 dark:border-rose-700",
  },
  DEFAULT: {
    label: "Ghế",
    idle: "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 border border-slate-300 dark:border-slate-500",
    legend: "bg-slate-200 dark:bg-slate-600",
  },
};
