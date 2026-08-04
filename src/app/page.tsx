"use client";

/*
=========================================
Studio Dashboard

This page is the main landing page after login.
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Users,
} from "lucide-react";

// Types
type Job = {
  id: number;
  due_date: string | null;
  project_type: string | null;
  status: string | null;
  assigned_user_id: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

// ====================
// COMPONENTS
// ====================

export default function HomePage() {
  // States
  const [openJobs, setOpenJobs] = useState(0);
  const [inProgressJobs, setInProgressJobs] = useState(0);
  const [weekJobs, setWeekJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const todayString = today.toISOString().split("T")[0];
      const weekString = sevenDaysFromNow.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          due_date,
          project_type,
          status,
          assigned_user_id,
          customers (
            first_name,
            last_name
          )
        `)
        .order("due_date", { ascending: true });

      if (error) {
        setFeedback({
          title: "Dashboard Load Failed",
          message: error.message,
        });
        return;
      }

      const jobs = (data || []) as unknown as Job[];

      setOpenJobs(jobs.filter((job) => job.status === "Open").length);

      setInProgressJobs(
        jobs.filter((job) => job.status === "In Progress").length
      );

      setWeekJobs(
        jobs.filter(
          (job) =>
            job.due_date &&
            job.due_date >= todayString &&
            job.due_date <= weekString &&
            job.status !== "Canceled" &&
            job.status !== "Archived" &&
            job.status !== "Done"
        )
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentUserId = user?.id;

      setMyJobs(
        jobs.filter(
          (job) =>
            job.assigned_user_id === currentUserId &&
            job.status !== "Done" &&
            job.status !== "Canceled" &&
            job.status !== "Archived"
        )
      );

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);
      }
    };

    loadDashboard();
  }, []);

  // Helpers
  // Controls the badge colors for job statuses
  const getStatusClass = (status: string | null) => {
    if (status === "Open")
      return "bg-green-100 text-green-700";

    if (status === "In Progress")
      return "bg-blue-100 text-blue-700";

    if (status === "Done")
      return "bg-slate-200 text-slate-700";

    if (status === "Canceled")
      return "bg-red-100 text-red-700";

    if (status === "Past Due")
      return "bg-orange-100 text-orange-700";

    return "bg-slate-100 text-slate-700";
  };

  const getCustomerName = (job: Job) => {
    return job.customers
      ? `${job.customers.first_name || ""} ${job.customers.last_name || ""}`.trim()
      : "Unknown Customer";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const activeJobs = openJobs + inProgressJobs;

  // ====================
  // Page Layout
  // ====================

  return (
    <main className="app-page">
      <div className="app-container">
        {/* Header */}
        <section className="app-header">
          <div>
            <p className="app-eyebrow">
              Studio Dashboard
            </p>

            <h1 className="app-title">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>

            <p className="app-subtitle">
              Active work, assigned jobs, and upcoming deadlines at a glance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/new-work-order"
              className="app-button-primary"
            >
              <Plus size={18} />
              New Work Order
            </Link>

            <Link
              href="/work-orders"
              className="app-button-secondary"
            >
              <Briefcase size={18} />
              View Jobs
            </Link>
          </div>
        </section>

        {/* Status Summary */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/work-orders"
            className="app-panel-pad hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Active Jobs</p>
              <Briefcase size={20} className="text-blue-700" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mt-4">
              {activeJobs}
            </p>
          </Link>

          <Link
            href="/work-orders"
            className="app-panel-pad hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Open</p>
              <Clock3 size={20} className="text-green-700" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mt-4">
              {openJobs}
            </p>
          </Link>

          <Link
            href="/work-orders"
            className="app-panel-pad hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                In Progress
              </p>
              <CheckCircle2 size={20} className="text-blue-700" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mt-4">
              {inProgressJobs}
            </p>
          </Link>

          <Link
            href="/calendar"
            className="app-panel-pad hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Due Soon</p>
              <CalendarDays size={20} className="text-slate-700" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mt-4">
              {weekJobs.length}
            </p>
          </Link>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] gap-6 items-start">
          {/* My Assigned Jobs */}
          <section className="app-panel overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-5 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Jobs</h2>
                <p className="text-sm text-slate-500">
                  Active jobs assigned to you.
                </p>
              </div>

              <Link
                href="/work-orders"
                className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:text-blue-800"
              >
                All Jobs
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y">
              {myJobs.slice(0, 6).map((job) => (
                <Link
                  key={job.id}
                  href={`/work-orders/${job.id}`}
                  className="grid grid-cols-1 md:grid-cols-[120px_1fr_120px] gap-2 md:gap-4 p-4 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-blue-700">
                    WO-{String(job.id).padStart(6, "0")}
                  </p>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {getCustomerName(job)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {job.project_type || "No project type"}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(job.due_date)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                        job.status
                      )}`}
                    >
                      {job.status || "Open"}
                    </span>
                  </div>
                </Link>
              ))}

              {myJobs.length === 0 && (
                <div className="p-6 text-slate-500">
                  No active jobs assigned to you.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6">
            {/* Week At A Glance */}
            <section className="app-panel overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5 border-b">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Due This Week
                  </h2>
                  <p className="text-sm text-slate-500">
                    Active jobs due in the next 7 days.
                  </p>
                </div>

                <Link
                  href="/calendar"
                  className="text-blue-700 font-semibold hover:text-blue-800"
                >
                  Calendar
                </Link>
              </div>

              <div className="divide-y">
                {weekJobs.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    href={`/work-orders/${job.id}`}
                    className="flex items-start justify-between gap-4 p-4 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {getCustomerName(job)}
                      </p>
                      <p className="text-sm text-slate-500">
                        WO-{String(job.id).padStart(6, "0")} ·{" "}
                        {job.project_type || "No project type"}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(job.due_date)}
                    </p>
                  </Link>
                ))}

                {weekJobs.length === 0 && (
                  <div className="p-6 text-slate-500">
                    No active jobs due in the next 7 days.
                  </div>
                )}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="app-panel-pad">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid gap-3">
                <Link
                  href="/new-work-order"
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Plus size={18} className="text-blue-700" />
                    New Work Order
                  </span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Users size={18} className="text-blue-700" />
                    View Customers
                  </span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/contacts"
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Users size={18} className="text-blue-700" />
                    View Contacts
                  </span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          </div>
        </div>
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
