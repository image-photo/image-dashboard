"use client";

/*
=========================================
Studio Calendar Page
Shows work orders on a monthly calendar based on due_date.
=========================================
*/

// ====================
// TOP OF FILE
// ====================

// Imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

// Types
type Job = {
  id: number;
  due_date: string | null;
  project_type: string | null;
  status: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

// ====================
// Components
// ====================

export default function CalendarPage() {
  //States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const todayString = today.toISOString().split("T")[0];

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  // Build the current month calendar grid
  const calendarDays = [
    ...Array.from({ length: startingDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  // Load jobs that have a due date so they can appear on the calendar
  useEffect(() => {
    const loadJobs = async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          due_date,
          project_type,
          status,
          customers (
            first_name,
            last_name
          )
        `)
        .not("due_date", "is", null);

      if (error) {
        setFeedback({
          title: "Calendar Load Failed",
          message: error.message,
        });
        return;
      }

      setJobs((data || []) as unknown as Job[]);
    };

    loadJobs();
  }, []);

  // Find all jobs due on one specific calendar day
  const getJobsForDay = (day: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    return jobs.filter(
      (job) =>
        job.due_date === dateString &&
        job.status !== "Canceled" &&
        job.status !== "Archived"
    );
  };

  // Controls calendar job badge colors
  // Red = overdue, Blue = in progress, Gray = done, Green = open/default
  const getCalendarJobClass = (
    status: string | null,
    dueDate: string | null
  ) => {
    const isOverdue =
      dueDate &&
      dueDate < todayString &&
      status !== "Done" &&
      status !== "Canceled" &&
      status !== "Archived";

    if (isOverdue) {
      return "bg-red-100 text-red-700 hover:bg-red-200";
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    }

    if (status === "Done") {
      return "bg-slate-200 text-slate-700 hover:bg-slate-300";
    }

    return "bg-green-100 text-green-700 hover:bg-green-200";
  };

  // Button Functions
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

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
            Due Date Overview
          </p>

          <h1 className="app-title">
            Calendar
          </h1>

          <p className="app-subtitle">
            At-a-glance view of jobs coming due this month.
          </p>
          </div>
        </section>

        {/* Calendar Card */}
        <section className="app-panel overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="border px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-50"
              >
                Previous
              </button>

              <h2 className="text-xl font-bold text-slate-900 min-w-48 text-center">
                {monthName}
              </h2>

              <button
                onClick={goToNextMonth}
                className="border px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-50"
              >
                Next
              </button>

              <button
                onClick={goToCurrentMonth}
                className="border px-3 py-1 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Today
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                Overdue
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                Open
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                In Progress
              </span>
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-semibold">
                Done
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 bg-slate-900 text-white text-sm font-semibold">
            <div className="p-4">Sun</div>
            <div className="p-4">Mon</div>
            <div className="p-4">Tue</div>
            <div className="p-4">Wed</div>
            <div className="p-4">Thu</div>
            <div className="p-4">Fri</div>
            <div className="p-4">Sat</div>
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className="min-h-32 border-r border-b p-3 bg-white"
              >
                {day && (
                  <>
                    <p
                      className={`text-sm font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                          ? "bg-blue-700 text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </p>

                    <div className="grid gap-2">
                      {getJobsForDay(day).map((job) => (
                        <Link
                          key={job.id}
                          href={`/work-orders/${job.id}`}
                          className={`block rounded-lg text-xs p-2 transition-colors ${getCalendarJobClass(
                            job.status,
                            job.due_date
                          )}`}
                        >
                          <p className="font-semibold">
                            {job.project_type || "Job"}
                          </p>

                          <p>
                            {job.customers
                              ? `${job.customers.first_name} ${job.customers.last_name}`
                              : "Unknown Customer"}
                          </p>

                        </Link>

                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

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
