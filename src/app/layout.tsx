"use client";

// Imports
import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import AuthGuard from "@/components/AuthGuard";
import Topbar from "@/components/topbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body>
        {isLoginPage ? (
          children
        ) : (
          <AuthGuard>
            <div className="min-h-screen flex">
              <Sidebar />

              <div className="flex-1 min-w-0">
                <Topbar />

                {children}
              </div>
            </div>
          </AuthGuard>
        )}
      </body>
    </html>
  );
}
