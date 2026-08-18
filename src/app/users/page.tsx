"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MailPlus, RefreshCw, ShieldCheck, UserPlus, X } from "lucide-react";
import FeedbackModal from "@/components/feedback-modal";
import TablePagination from "@/components/table-pagination";
import { supabase } from "@/lib/supabase";

type StudioRole = "admin" | "staff";
type StudioUser = {
  id: string;
  email: string;
  fullName: string;
  role: StudioRole;
  active: boolean;
  createdAt: string;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  isCurrentUser: boolean;
};
type Feedback = { title: string; message: string; tone: "success" | "error" };
type AdminResponse = { error?: string; message?: string; users?: StudioUser[] };

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Never";

const functionErrorMessage = async (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Fall back to the client message.
    }
  }
  return error instanceof Error
    ? error.message
    : "The administrator request could not be completed.";
};

export default function UsersPage() {
  const [users, setUsers] = useState<StudioUser[]>([]);
  const [savedUsers, setSavedUsers] = useState<Record<string, StudioUser>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StudioRole>("staff");
  const [inviteError, setInviteError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const invokeAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke<AdminResponse>(
      "admin-users",
      { body }
    );
    if (error) throw new Error(await functionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setAccessDenied(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin" || profile.active !== true) {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }

    try {
      const data = await invokeAdmin({ action: "list" });
      const nextUsers = data?.users ?? [];
      setUsers(nextUsers);
      setSavedUsers(
        Object.fromEntries(nextUsers.map((studioUser) => [studioUser.id, studioUser]))
      );
    } catch (error) {
      setFeedback({
        title: "Team Could Not Be Loaded",
        message: error instanceof Error ? error.message : "Try again in a moment.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
    // Load once when the administrator page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(search)
    );
  }, [searchTerm, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const updateDraft = (id: string, changes: Partial<StudioUser>) => {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, ...changes } : user))
    );
  };
  const hasChanges = (user: StudioUser) => {
    const saved = savedUsers[user.id];
    return (
      !saved ||
      saved.fullName !== user.fullName ||
      saved.role !== user.role ||
      saved.active !== user.active
    );
  };

  const saveUser = async (user: StudioUser) => {
    setSavingUserId(user.id);
    try {
      await invokeAdmin({
        action: "update",
        userId: user.id,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
      });
      setSavedUsers((current) => ({ ...current, [user.id]: user }));
      setFeedback({
        title: "Team Member Updated",
        message: `${user.fullName}'s access settings were saved.`,
        tone: "success",
      });
    } catch (error) {
      if (savedUsers[user.id]) updateDraft(user.id, savedUsers[user.id]);
      setFeedback({
        title: "Team Member Not Updated",
        message: error instanceof Error ? error.message : "Try again in a moment.",
        tone: "error",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const inviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();
    if (!fullName || !email.includes("@")) {
      setInviteError("Enter the team member's name and a valid email address.");
      return;
    }
    setInviteError("");
    setIsInviting(true);
    try {
      const data = await invokeAdmin({
        action: "invite",
        fullName,
        email,
        role: inviteRole,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("staff");
      await loadUsers();
      setFeedback({
        title: "Invitation Sent",
        message: data?.message || `An invitation was sent to ${email}.`,
        tone: "success",
      });
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "The invitation failed.");
    } finally {
      setIsInviting(false);
    }
  };

  const sendPasswordReset = async (user: StudioUser) => {
    setResettingUserId(user.id);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResettingUserId(null);
    setFeedback(
      error
        ? { title: "Reset Email Not Sent", message: error.message, tone: "error" }
        : {
            title: "Reset Email Sent",
            message: `A password reset link was sent to ${user.email}.`,
            tone: "success",
          }
    );
  };

  if (accessDenied) {
    return (
      <main className="app-page">
        <div className="app-container-narrow">
          <section className="app-panel-pad text-center">
            <ShieldCheck className="mx-auto text-slate-400" size={34} />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Administrator Access Required
            </h1>
            <p className="mt-2 text-slate-600">
              Only active administrators can manage studio accounts.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-header">
          <div>
            <p className="app-eyebrow">Administration</p>
            <h1 className="app-title">Team Access</h1>
            <p className="app-subtitle">
              Invite employees, assign roles, and deactivate accounts without deleting history.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadUsers}
              className="app-button-secondary bg-white"
              disabled={isLoading}
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setInviteError("");
                setShowInviteModal(true);
              }}
              className="app-button-primary"
            >
              <UserPlus size={18} /> Invite Team Member
            </button>
          </div>
        </section>

        <input
          className="app-input"
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
        />

        <section className="app-panel overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-slate-500">Loading team accounts...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="app-table-head">
                    <tr>
                      <th className="p-4 text-sm font-semibold">Name</th>
                      <th className="p-4 text-sm font-semibold">Email</th>
                      <th className="p-4 text-sm font-semibold">Role</th>
                      <th className="p-4 text-sm font-semibold">Status</th>
                      <th className="p-4 text-sm font-semibold">Last Sign In</th>
                      <th className="p-4 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b align-top last:border-b-0">
                        <td className="p-4">
                          <input
                            className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                            value={user.fullName}
                            onChange={(event) =>
                              updateDraft(user.id, { fullName: event.target.value })
                            }
                            disabled={savingUserId === user.id}
                            aria-label={`Name for ${user.email}`}
                          />
                          {user.isCurrentUser && (
                            <span className="app-badge ml-2 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                              You
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700">
                          <p className="font-medium text-slate-900">{user.email}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.confirmedAt ? "Email confirmed" : "Invitation pending"}
                          </p>
                        </td>
                        <td className="p-4">
                          <select
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                            value={user.role}
                            onChange={(event) =>
                              updateDraft(user.id, {
                                role: event.target.value as StudioRole,
                              })
                            }
                            disabled={user.isCurrentUser || savingUserId === user.id}
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            className={`rounded-lg border px-3 py-2 font-semibold ${
                              user.active
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-slate-300 bg-slate-100 text-slate-600"
                            }`}
                            value={user.active ? "active" : "inactive"}
                            onChange={(event) =>
                              updateDraft(user.id, {
                                active: event.target.value === "active",
                              })
                            }
                            disabled={user.isCurrentUser || savingUserId === user.id}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatDate(user.lastSignInAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveUser(user)}
                              className="app-button-primary px-3 py-2 text-sm"
                              disabled={
                                !user.fullName.trim() ||
                                !hasChanges(user) ||
                                savingUserId !== null
                              }
                            >
                              {savingUserId === user.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => sendPasswordReset(user)}
                              className="app-button-secondary px-3 py-2 text-sm"
                              disabled={resettingUserId !== null || !user.email}
                            >
                              <MailPlus size={16} />
                              {resettingUserId === user.id ? "Sending..." : "Send Reset"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-slate-500">
                          No team accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={safePage}
                itemLabel="team members"
                pageSize={pageSize}
                totalItems={filteredUsers.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </section>
      </div>

      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isInviting) {
              setShowInviteModal(false);
            }
          }}
        >
          <section
            className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-user-title"
          >
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <UserPlus size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="invite-user-title" className="text-2xl font-bold text-slate-900">
                  Invite Team Member
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  They’ll receive a secure link to create their password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close invitation"
                disabled={isInviting}
              >
                <X size={20} />
              </button>
            </div>

            <form className="grid gap-5" onSubmit={inviteUser}>
              {inviteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteError}
                </div>
              )}
              <label className="grid gap-2 font-semibold text-slate-700">
                Full Name
                <input
                  className="app-input font-normal"
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                  autoComplete="name"
                  autoFocus
                  required
                  disabled={isInviting}
                />
              </label>
              <label className="grid gap-2 font-semibold text-slate-700">
                Login Email
                <input
                  type="email"
                  className="app-input font-normal"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={isInviting}
                />
              </label>
              <label className="grid gap-2 font-semibold text-slate-700">
                Role
                <select
                  className="app-input font-normal"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as StudioRole)}
                  disabled={isInviting}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Administrator</option>
                </select>
                <span className="text-sm font-normal text-slate-500">
                  Staff manage studio records. Administrators also manage accounts and eligible deletions.
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="app-button-secondary"
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="app-button-primary"
                  disabled={isInviting || !inviteName.trim() || !inviteEmail.trim()}
                >
                  {isInviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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
