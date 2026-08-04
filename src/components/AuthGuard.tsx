"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (pathname === "/login") {
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      setChecking(false);
    };

    checkSession();
  }, [pathname]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Checking login...</p>
      </main>
    );
  }

  return <>{children}</>;
}