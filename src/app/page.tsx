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
import {
  getLocalDateString,
  getLocalDateStringDaysFromNow,
} from "@/lib/dates";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";
import NewCustomerModal from "@/components/new-customer-modal";
import QuickActionModal from "@/components/quick-action-modal";
import NewContactPage from "@/app/contacts/new/page";
import NewWorkOrderPage from "@/app/new-work-order/page";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Users,
} from "lucide-react";
import { getProofStatusClass } from "@/lib/work-order-status";

// Types
type Job = {
  id: number;
  due_date: string | null;
  project_type: string | null;
  status: string | null;
  proof_status: string | null;
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
  const [quickAction, setQuickAction] = useState<
    "customer" | "contact" | "work-order" | null
  >(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const todayString = getLocalDateString();
      const weekString = getLocalDateStringDaysFromNow(7);

      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          due_date,
          project_type,
          status,
          proof_status,
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

  useEffect(() => {
    const handleContactCreated = (event: Event) => {
      const createdEvent = event as CustomEvent<{
        id: number;
        organization_name: string | null;
      }>;

      createdEvent.preventDefault();
      setQuickAction(null);
      setFeedback({
        title: "Contact Added",
        message: `${createdEvent.detail.organization_name || "The contact"} was added to the contact directory.`,
        tone: "success",
      });
    };

    const handleWorkOrderCreated = (event: Event) => {
      const createdEvent = event as CustomEvent<Job>;
      const job = createdEvent.detail;
      const todayString = getLocalDateString();
      const weekString = getLocalDateStringDaysFromNow(7);

      createdEvent.preventDefault();
      setQuickAction(null);

      if (job.status === "Open") {
        setOpenJobs((currentCount) => currentCount + 1);
      } else if (job.status === "In Progress") {
        setInProgressJobs((currentCount) => currentCount + 1);
      }

      if (
        job.due_date &&
        job.due_date >= todayString &&
        job.due_date <= weekString &&
        job.status !== "Done" &&
        job.status !== "Canceled" &&
        job.status !== "Archived"
      ) {
        setWeekJobs((currentJobs) =>
          [...currentJobs, job].sort((a, b) =>
            (a.due_date || "").localeCompare(b.due_date || "")
          )
        );
      }

      if (
        job.assigned_user_id === profile?.id &&
        job.status !== "Done" &&
        job.status !== "Canceled" &&
        job.status !== "Archived"
      ) {
        setMyJobs((currentJobs) =>
          [...currentJobs, job].sort((a, b) =>
            (a.due_date || "").localeCompare(b.due_date || "")
          )
        );
      }

      setFeedback({
        title: "Work Order Created",
        message: `WO-${String(job.id).padStart(6, "0")} was created successfully.`,
        tone: "success",
      });
    };

    window.addEventListener("contact-created", handleContactCreated);
    window.addEventListener("work-order-created", handleWorkOrderCreated);

    return () => {
      window.removeEventListener("contact-created", handleContactCreated);
      window.removeEventListener("work-order-created", handleWorkOrderCreated);
    };
  }, [profile?.id]);

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
            <button
              type="button"
              onClick={() => setQuickAction("work-order")}
              className="app-button-primary"
            >
              <Plus size={18} />
              New Work Order
            </button>

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
            href={{ pathname: "/work-orders", query: { status: "Active" } }}
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
            href={{ pathname: "/work-orders", query: { status: "Open" } }}
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
            href={{
              pathname: "/work-orders",
              query: { status: "In Progress" },
            }}
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
            href={{
              pathname: "/work-orders",
              query: { status: "Active", due: "soon" },
            }}
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
                  className="grid grid-cols-1 md:grid-cols-[120px_1fr_180px] gap-2 md:gap-4 p-4 hover:bg-blue-50 transition-colors"
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
                      className={`app-badge mt-1 px-3 py-1 text-xs font-semibold ${getStatusClass(
                        job.status
                      )}`}
                    >
                      {job.status || "Open"}
                    </span>
                    {job.proof_status && job.proof_status !== "Not Required" && (
                      <span
                        className={`app-badge mt-1 px-3 py-1 text-xs font-semibold md:ml-auto ${getProofStatusClass(
                          job.proof_status
                        )}`}
                      >
                        Proof: {job.proof_status}
                      </span>
                    )}
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
                <button
                  type="button"
                  onClick={() => setQuickAction("work-order")}
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Plus size={18} className="text-blue-700" />
                    New Work Order
                  </span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setQuickAction("customer")}
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Users size={18} className="text-blue-700" />
                    New Customer
                  </span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setQuickAction("contact")}
                  className="flex items-center justify-between border rounded-xl p-4 font-semibold text-slate-700 hover:bg-blue-50"
                >
                  <span className="inline-flex items-center gap-3">
                    <Users size={18} className="text-blue-700" />
                    New Contact
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {quickAction === "customer" && (
        <NewCustomerModal
          onCancel={() => setQuickAction(null)}
          onCreated={(customer) => {
            setQuickAction(null);
            setFeedback({
              title: "Customer Added",
              message: `${customer.first_name} ${customer.last_name} was added to the customer directory.`,
              tone: "success",
            });
          }}
          onError={(message) => {
            setFeedback({
              title: "Customer Save Failed",
              message,
            });
          }}
        />
      )}

      {quickAction === "contact" && (
        <QuickActionModal
          title="New Contact"
          onCancel={() => setQuickAction(null)}
        >
          <NewContactPage />
        </QuickActionModal>
      )}

      {quickAction === "work-order" && (
        <QuickActionModal
          title="New Work Order"
          onCancel={() => setQuickAction(null)}
        >
          <NewWorkOrderPage />
        </QuickActionModal>
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
