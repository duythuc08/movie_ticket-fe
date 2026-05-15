export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const seatLabel = (row: string, num: number) =>
  `${row}${String(num).padStart(2, "0")}`;
