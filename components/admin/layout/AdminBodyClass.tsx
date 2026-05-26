"use client";

import { useEffect } from "react";

export function AdminBodyClass() {
  useEffect(() => {
    document.body.setAttribute("data-admin", "");
    return () => {
      document.body.removeAttribute("data-admin");
    };
  }, []);
  return null;
}
