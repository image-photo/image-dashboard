"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    const markSessionReady = () => {
      if (!isActive) return;
      setHasRecoverySession(true);
      setIsChecking(false);
      window.history.replaceState({}, "", "/reset-password");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        markSessionReady();
      }
    });

    const loadRecoverySession = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashError = hash.get("error_description");

      if (hashError) {
        if (!isActive) return;
        setErrorMessage(hashError);
        setIsChecking(false);
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isActive) return;

      if (session) {
        markSessionReady();
        return;
      }

      setErrorMessage(
        error?.message || "This password link is invalid or has expired. Request a new link from the sign-in page."
      );
      setIsChecking(false);
    };

    loadRecoverySession();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setErrorMessage("Use at least 8 characters for your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Enter the same new password in both fields.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/login?password=updated";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5 sm:p-8">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow sm:p-8">
        <span className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
          <LockKeyhole size={26} />
        </span>
        <p className="mb-2 text-sm font-semibold text-blue-700">Account Recovery</p>
        <h1 className="text-3xl font-bold text-slate-900">Choose a New Password</h1>
        <p className="mt-2 text-slate-500">
          Use a unique password with at least 8 characters.
        </p>

        {isChecking ? (
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-slate-600">
            Verifying your secure link...
          </p>
        ) : hasRecoverySession ? (
          <form className="mt-6 grid gap-5" onSubmit={updatePassword}>
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="recovery-new-password" className="font-semibold text-slate-700">
                New Password
              </label>
              <input
                id="recovery-new-password"
                className="app-input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="recovery-confirm-password"
                className="font-semibold text-slate-700"
              >
                Confirm New Password
              </label>
              <input
                id="recovery-confirm-password"
                className="app-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isSaving}
              />
            </div>

            <button
              type="submit"
              className="app-button-primary w-full py-3"
              disabled={isSaving || !newPassword || !confirmPassword}
            >
              {isSaving ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="mt-6 grid gap-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
            <Link href="/login" className="app-button-primary w-full py-3">
              Return to Sign In
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
