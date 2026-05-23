"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <AuthProvider>
      {isAdmin ? (
        <>
          <Toaster richColors position="top-right" />
          {children}
        </>
      ) : (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster richColors position="top-right" />
          {children}
        </ThemeProvider>
      )}
    </AuthProvider>
  );
}
