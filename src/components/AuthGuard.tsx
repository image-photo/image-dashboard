"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setAccessError("The studio could not verify your account. Refresh and try again.");
        setChecking(false);
        return;
      }

      if (!profile?.active) {
        await supabase.auth.signOut({ scope: "local" });
        window.location.href = "/login?reason=inactive";
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

  if (accessError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Account Check Failed</h1>
          <p className="mt-2 text-slate-600">{accessError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="app-button-primary mt-5"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
