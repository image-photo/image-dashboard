"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import AuthGuard from "@/components/AuthGuard";
import Topbar from "@/components/topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/reset-password";
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavigationOpen) return;

    const previousOverflow = document.body.style.overflow;
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileNavigationOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavigationOpen(false);
    };

    document.body.style.overflow = "hidden";
    desktopMediaQuery.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopMediaQuery.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileNavigationOpen]);

  if (isAuthPage) return children;

  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <Sidebar
          isMobileOpen={isMobileNavigationOpen}
          onMobileClose={() => setIsMobileNavigationOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <Topbar onMenuClick={() => setIsMobileNavigationOpen(true)} />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
