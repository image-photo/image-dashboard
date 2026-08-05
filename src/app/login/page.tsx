"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const timer = window.setTimeout(() => {
      if (params.get("password") === "updated") {
        setSuccessMessage("Your password was updated. Sign in with your new password.");
      } else if (params.get("reason") === "inactive") {
        setErrorMessage(
          "This account is inactive. Ask an administrator to restore access."
        );
      }

      if (params.size) {
        window.history.replaceState({}, "", "/login");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsSigningIn(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.location.href = "/";
  };

  const sendRecoveryEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = recoveryEmail.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setRecoveryError("Enter the email address used for your studio account.");
      return;
    }

    setRecoveryError("");
    setIsSendingRecovery(true);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSendingRecovery(false);

    if (error) {
      setRecoveryError(error.message);
      return;
    }

    setRecoverySent(true);
  };

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecoveryError("");
    setRecoverySent(false);
    setShowRecovery(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5 sm:p-8">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow sm:p-8">
        <p className="mb-2 text-sm font-semibold text-blue-700">Studio Login</p>
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Sign In</h1>
        <p className="mb-6 text-slate-500">
          Access customers, contacts, and studio work orders.
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        <form className="grid gap-4" onSubmit={login}>
          <div className="grid gap-2">
            <label htmlFor="login-email" className="font-semibold text-slate-700">
              Email Address
            </label>
            <input
              id="login-email"
              className="app-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSigningIn}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={openRecovery}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              className="app-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isSigningIn}
            />
          </div>

          <button
            type="submit"
            className="app-button-primary mt-1 w-full py-3"
            disabled={isSigningIn || !email.trim() || !password}
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </section>

      {showRecovery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSendingRecovery) {
              setShowRecovery(false);
            }
          }}
        >
          <section
            className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
          >
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <KeyRound size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="recovery-title" className="text-2xl font-bold text-slate-900">
                  Reset Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  We’ll email a secure link to your studio account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close password recovery"
                disabled={isSendingRecovery}
              >
                <X size={20} />
              </button>
            </div>

            {recoverySent ? (
              <div className="grid gap-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                  <p className="font-semibold">Check your inbox</p>
                  <p className="mt-1 text-sm">
                    If that address belongs to an account, Supabase will send a password reset link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="app-button-primary w-full py-3"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={sendRecoveryEmail}>
                {recoveryError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {recoveryError}
                  </div>
                )}

                <div className="grid gap-2">
                  <label
                    htmlFor="recovery-email"
                    className="font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="recovery-email"
                      className="app-input pl-10"
                      type="email"
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      autoComplete="email"
                      autoFocus
                      required
                      disabled={isSendingRecovery}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(false)}
                    className="app-button-secondary"
                    disabled={isSendingRecovery}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="app-button-primary"
                    disabled={isSendingRecovery || !recoveryEmail.trim()}
                  >
                    {isSendingRecovery ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
