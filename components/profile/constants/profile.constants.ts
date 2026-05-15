export const TIER_COLORS: Record<string, string> = {
  MEMBER:  "text-slate-500",
  SILVER:  "text-blue-500",
  GOLD:    "text-amber-500",
  DIAMOND: "text-cyan-400",
};

export const TABS = [
  { key: "info"   as const, label: "Thông tin cá nhân" },
  { key: "orders" as const, label: "Đơn hàng & Vé" },
];
