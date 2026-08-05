"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import FeedbackModal from "@/components/feedback-modal";
import { supabase } from "@/lib/supabase";

type Feedback = {
  title: string;
  message: string;
  tone: "success" | "error";
};

export default function SettingsPage() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<
    "name" | "email" | "password" | null
  >(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAccount = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (userError || !user) {
        setFeedback({
          title: "Unable to load account",
          message: userError?.message || "Your signed-in account could not be found.",
          tone: "error",
        });
        setIsLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      setSavedEmail(user.email || "");
      setAuthEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!isActive) return;

      if (profileError) {
        setFeedback({
          title: "Unable to load profile",
          message: profileError.message,
          tone: "error",
        });
      } else {
        const fullName = profile?.full_name || "";
        setName(fullName);
        setSavedName(fullName);
      }

      setIsLoading(false);
    };

    loadAccount();

    return () => {
      isActive = false;
    };
  }, []);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = name.trim();

    if (!fullName) {
      setFeedback({
        title: "Name required",
        message: "Enter the name you would like displayed in the app.",
        tone: "error",
      });
      return;
    }

    if (!userId) return;

    setSavingSection("name");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    setSavingSection(null);

    if (error) {
      setFeedback({
        title: "Name not updated",
        message: error.message,
        tone: "error",
      });
      return;
    }

    setName(fullName);
    setSavedName(fullName);
    window.dispatchEvent(
      new CustomEvent("profile-updated", { detail: { fullName } })
    );
    setFeedback({
      title: "Name updated",
      message: "Your display name has been saved.",
      tone: "success",
    });
  };

  const saveEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEmail = email.trim().toLowerCase();

    if (!nextEmail || !nextEmail.includes("@")) {
      setFeedback({
        title: "Valid email required",
        message: "Enter the email address you would like to use to sign in.",
        tone: "error",
      });
      return;
    }

    setSavingSection("email");
    const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
    setSavingSection(null);

    if (error) {
      setFeedback({
        title: "Email not updated",
        message: error.message,
        tone: "error",
      });
      return;
    }

    setEmail(nextEmail);
    setSavedEmail(nextEmail);
    setAuthEmail(data.user.email || authEmail);
    setFeedback({
      title: "Check your email",
      message:
        "Your email change was requested. Follow the confirmation link Supabase sends before using the new address to sign in.",
      tone: "success",
    });
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setFeedback({
        title: "Current password required",
        message: "Enter your current password before choosing a new one.",
        tone: "error",
      });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        title: "Password is too short",
        message: "Use at least 8 characters for your new password.",
        tone: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        title: "Passwords do not match",
        message: "Re-enter the same new password in both fields.",
        tone: "error",
      });
      return;
    }

    if (!authEmail) {
      setFeedback({
        title: "Account email unavailable",
        message: "Reload the page and try again.",
        tone: "error",
      });
      return;
    }

    setSavingSection("password");

    const { error } = await supabase.auth.updateUser({
      email: authEmail,
      password: newPassword,
      current_password: currentPassword,
    });

    if (error) {
      setSavingSection(null);
      setFeedback({
        title: "Password not updated",
        message: error.message,
        tone: "error",
      });
      return;
    }

    const { error: sessionError } = await supabase.auth.signOut({
      scope: "others",
    });

    setSavingSection(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (sessionError) {
      setFeedback({
        title: "Password updated",
        message:
          "Your password was changed, but other signed-in devices could not be closed automatically. Sign out everywhere before continuing.",
        tone: "error",
      });
      return;
    }

    setFeedback({
      title: "Password updated",
      message:
        "Your new password is ready to use, and all other signed-in devices have been closed.",
      tone: "success",
    });
  };

  return (
    <main className="app-page">
      <div className="app-container-narrow">
        <section className="app-header">
          <div>
            <p className="app-eyebrow">Account</p>
            <h1 className="app-title">Account Settings</h1>
            <p className="app-subtitle">
              Manage your display name, login email, and password.
            </p>
          </div>
        </section>

        {isLoading ? (
          <section className="app-panel-pad text-slate-500">
            Loading account settings...
          </section>
        ) : (
          <section className="app-panel divide-y divide-slate-200 overflow-hidden">
            <form onSubmit={saveName} className="grid gap-5 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <UserRound size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Name</h2>
                  <p className="text-sm text-slate-500">
                    This name appears in the navigation and throughout the app.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="account-name" className="font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="account-name"
                  className="app-input max-w-xl"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  disabled={!userId || savingSection !== null}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="app-button-primary"
                  disabled={
                    !userId ||
                    !name.trim() ||
                    name.trim() === savedName ||
                    savingSection !== null
                  }
                >
                  {savingSection === "name" ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>

            <form onSubmit={saveEmail} className="grid gap-5 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <Mail size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Login Email</h2>
                  <p className="text-sm text-slate-500">
                    Changing this may require confirmation before the new email can be used.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="account-email" className="font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="account-email"
                  type="email"
                  className="app-input max-w-xl"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={!userId || savingSection !== null}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="app-button-primary"
                  disabled={
                    !userId ||
                    !email.trim() ||
                    email.trim().toLowerCase() === savedEmail.toLowerCase() ||
                    savingSection !== null
                  }
                >
                  {savingSection === "email" ? "Requesting..." : "Update Email"}
                </button>
              </div>
            </form>

            <form onSubmit={savePassword} className="grid gap-5 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <LockKeyhole size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Password</h2>
                  <p className="text-sm text-slate-500">
                    Confirm your current password, then choose at least 8 characters.
                  </p>
                </div>
              </div>

              <div className="grid max-w-xl gap-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="current-password"
                    className="font-semibold text-slate-700"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    className="app-input"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={!userId || savingSection !== null}
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="new-password" className="font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="app-input"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={!userId || savingSection !== null}
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="confirm-password"
                    className="font-semibold text-slate-700"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="app-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={!userId || savingSection !== null}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="app-button-primary"
                  disabled={
                    !userId ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    savingSection !== null
                  }
                >
                  {savingSection === "password" ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      {feedback && (
        <FeedbackModal
          title={feedback.title}
          message={feedback.message}
          tone={feedback.tone}
          onClose={() => setFeedback(null)}
        />
      )}
    </main>
  );
}
