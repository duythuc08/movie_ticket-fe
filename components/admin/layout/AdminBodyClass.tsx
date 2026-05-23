"use client";

import { useEffect } from "react";

/** Set data-admin trên document.body khi ở trong /admin.
 *  Cần thiết vì Dialog dùng createPortal → render ngoài .admin-layout.
 *  data-admin trên body → tất cả portal content kế thừa admin CSS vars.
 */
export function AdminBodyClass() {
  useEffect(() => {
    document.body.setAttribute("data-admin", "");
    return () => {
      document.body.removeAttribute("data-admin");
    };
  }, []);
  return null;
}
