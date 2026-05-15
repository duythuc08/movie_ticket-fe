export function formatLoyaltyPoints(points: number): string {
  return points.toLocaleString("vi-VN");
}

export function getMembershipLabel(tierName: string): string {
  const labels: Record<string, string> = {
    MEMBER:  "Thành viên",
    SILVER:  "Bạc",
    GOLD:    "Vàng",
    DIAMOND: "Kim cương",
  };
  return labels[tierName] ?? tierName;
}

export function getMembershipColor(tierName: string): string {
  const colors: Record<string, string> = {
    MEMBER:  "text-slate-500",
    SILVER:  "text-blue-500",
    GOLD:    "text-amber-500",
    DIAMOND: "text-cyan-400",
  };
  return colors[tierName] ?? "text-slate-500";
}

export function getMembershipBarColor(tierName: string): string {
  const bars: Record<string, string> = {
    MEMBER:  "bg-slate-400",
    SILVER:  "bg-blue-500",
    GOLD:    "bg-amber-500",
    DIAMOND: "bg-cyan-400",
  };
  return bars[tierName] ?? "bg-slate-400";
}
