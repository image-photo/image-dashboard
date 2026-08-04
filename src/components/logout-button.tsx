"use client";

import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={logout}
      className="text-sm text-slate-600 hover:text-blue-700 font-semibold text-left"
    >
      Logout
    </button>
  );
}