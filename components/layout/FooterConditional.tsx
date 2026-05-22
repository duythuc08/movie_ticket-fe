"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

const HIDDEN_PREFIXES = [
  "/admin",
  "/seat-selection/",
  "/food-selection/",
  "/payment/",
  "/payment-success/",
  "/payment-fail/",
];

export function FooterConditional() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <Footer />;
}
