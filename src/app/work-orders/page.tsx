"use client";

/*
=========================================
Work Orders Table
=========================================
*/

// Imports
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";
import TablePagination from "@/components/table-pagination";
import {
  getLocalDateString,
  getLocalDateStringDaysFromNow,
} from "@/lib/dates";
import { getProofStatusClass } from "@/lib/work-order-status";

// Types
type WorkOrder = {
  id: number;
  due_date: string | null;
  project_type: string | null;
  project_options: string[] | null;
  status: string | null;
  payment_status: string | null;
  notification_status: string | null;
  pickup_delivery_status: string | null;
  proof_status: string | null;
  assigned_user_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
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

const statusFilters = [
  "Active",
  "All",
  "Open",
  "In Progress",
  "Done",
  "Canceled",
  "Archived",
] as const;

type StatusFilter = (typeof statusFilters)[number];
type DueDateFilter = "Any Due Date" | "Due Soon";

const getStatusFilter = (value: string | null): StatusFilter => {
  return statusFilters.includes(value as StatusFilter)
    ? (value as StatusFilter)
    : "Active";
};

function WorkOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = getStatusFilter(searchParams.get("status"));
  const dueDateFilter: DueDateFilter =
    searchParams.get("due") === "soon" ? "Due Soon" : "Any Due Date";

  // States
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadWorkOrders = async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          due_date,
          project_type,
          project_options,
          status,
          payment_status,
          notification_status,
          pickup_delivery_status,
          proof_status,
          assigned_user_id,
          profiles:assigned_user_id (
            full_name
          ),
          customers (
            first_name,
            last_name
          )
        `)
        .order("due_date", { ascending: true });

      if (error) {
        setFeedback({
          title: "Jobs Load Failed",
          message: error.message,
        });
        return;
      }

      setWorkOrders((data || []) as unknown as WorkOrder[]);
    };

    loadWorkOrders();
  }, []);


  const todayString = getLocalDateString();
  const weekString = getLocalDateStringDaysFromNow(7);

  const filteredJobs = workOrders.filter((order) => {
    const statusMatch =
      statusFilter === "Active"
        ? order.status === "Open" || order.status === "In Progress"
        : statusFilter === "All" || order.status === statusFilter;

    const dueDateMatch =
      dueDateFilter === "Any Due Date" ||
      Boolean(
        order.due_date &&
          order.due_date >= todayString &&
          order.due_date <= weekString
      );

    const search = searchTerm.toLowerCase().trim();

    const customerName = `${order.customers?.first_name || ""} ${
      order.customers?.last_name || ""
    }`.toLowerCase();

    const orderNumber = `wo-${String(order.id).padStart(6, "0")}`.toLowerCase();
    const projectType = (order.project_type || "").toLowerCase();
    const assignedPerson = (order.profiles?.full_name || "").toLowerCase();
    const status = (order.status || "").toLowerCase();
    const paymentStatus = (order.payment_status || "").toLowerCase();
    const notificationStatus = (order.notification_status || "").toLowerCase();
    const pickupDeliveryStatus = (
      order.pickup_delivery_status || ""
    ).toLowerCase();
    const proofStatus = (order.proof_status || "").toLowerCase();
    const options = (order.project_options || []).join(" ").toLowerCase();

    const searchMatch =
      search === "" ||
      customerName.includes(search) ||
      orderNumber.includes(search) ||
      projectType.includes(search) ||
      assignedPerson.includes(search) ||
      status.includes(search) ||
      paymentStatus.includes(search) ||
      notificationStatus.includes(search) ||
      pickupDeliveryStatus.includes(search) ||
      proofStatus.includes(search) ||
      options.includes(search);

    return statusMatch && dueDateMatch && searchMatch;
  });

  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusClass = (status: string | null) => {
    if (status === "Open") {
      return "bg-green-100 text-green-700";
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "Done") {
      return "bg-slate-200 text-slate-700";
    }

    if (status === "Canceled") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Archived") {
      return "bg-slate-100 text-slate-500";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getPaymentStatusClass = (status: string | null) => {
    if (status === "Paid" || status === "No Charge") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Needs Payment" || status === "Refunded") {
      return "bg-orange-100 text-orange-700";
    }

    if (status === "Partial / Deposit Paid" || status === "Bill Later") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getNotificationStatusClass = (status: string | null) => {
    if (
      status === "Notified" ||
      status === "Called" ||
      status === "Texted" ||
      status === "Emailed"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (status === "Needs Contact" || status === "Follow Up Needed") {
      return "bg-orange-100 text-orange-700";
    }

    if (status === "Left Voicemail") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getPickupDeliveryStatusClass = (status: string | null) => {
    if (status === "Picked Up" || status === "Delivered") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Ready for Pickup" || status === "Mailed") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "Holding") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const updateFilters = (
    nextStatus: StatusFilter,
    nextDueDate: DueDateFilter
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    nextParams.set("status", nextStatus);

    if (nextDueDate === "Due Soon") {
      nextParams.set("due", "soon");
    } else {
      nextParams.delete("due");
    }

    setCurrentPage(1);
    router.replace(`/work-orders?${nextParams.toString()}`, { scroll: false });
  };

  // ====================
  // PAGE LAYOUT
  // ====================
  return (
    <main className="app-page">
      <div className="app-container">
        <div className="app-header">
          <div>
            <p className="app-eyebrow">
              Studio Queue
            </p>

            <h1 className="app-title">Jobs</h1>

            <p className="app-subtitle">
              Active jobs are shown by default. Use filters to view completed,
              canceled, or archived jobs.
            </p>
          </div>

          <Link
            href="/new-work-order"
            className="app-button-primary"
          >
            + New Work Order
          </Link>
        </div>

        <section className="app-panel-pad">
          <div className="flex gap-3">
            <input
              className="app-input flex-1"
              placeholder="Search jobs, customers, WO number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="app-button-secondary py-3"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 mt-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>

                <select
                  className="app-input"
                  value={statusFilter}
                  onChange={(e) => {
                    updateFilters(e.target.value as StatusFilter, dueDateFilter);
                  }}
                >
                  {statusFilters.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>

                <select
                  className="app-input"
                  value={dueDateFilter}
                  onChange={(event) =>
                    updateFilters(
                      statusFilter,
                      event.target.value as DueDateFilter
                    )
                  }
                >
                  <option>Any Due Date</option>
                  <option>Due Soon</option>
                </select>
              </div>

            </div>
          )}
        </section>

        <section className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-sm font-semibold">WO #</th>
                <th className="p-4 text-sm font-semibold">Due Date</th>
                <th className="p-4 text-sm font-semibold">Customer</th>
                <th className="p-4 text-sm font-semibold">Job Type</th>
                <th className="p-4 text-sm font-semibold">Assigned Person</th>
                <th className="p-4 text-sm font-semibold">Status</th>
                <th className="p-4 text-sm font-semibold">Tracking</th>
              </tr>
            </thead>

            <tbody>
              {paginatedJobs.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => {
                    router.push(`/work-orders/${order.id}`);
                  }}
                  className="border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-slate-700 whitespace-nowrap font-semibold">
                    WO-{String(order.id).padStart(6, "0")}
                  </td>

                  <td className="p-4 text-slate-900 whitespace-nowrap">
                    {order.due_date || "No due date"}
                  </td>

                  <td className="p-4 text-slate-900 font-medium">
                    {order.customers
                      ? `${order.customers.first_name} ${order.customers.last_name}`
                      : "Unknown Customer"}
                  </td>

                  <td className="p-4">
                    <span className="app-badge bg-slate-100 text-slate-700 px-3 py-1 text-sm">
                      {order.project_type || "No Type"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="app-badge bg-slate-100 text-slate-700 px-3 py-1 text-sm">
                      {order.profiles?.full_name || "Unassigned"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`app-badge px-3 py-1 text-sm font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status || "Open"}
                    </span>
                  </td>

                  <td className="p-4 min-w-52">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`app-badge px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                          order.payment_status
                        )}`}
                      >
                        Pay: {order.payment_status || "Not Checked"}
                      </span>

                      <span
                        className={`app-badge px-2.5 py-1 text-xs font-semibold ${getNotificationStatusClass(
                          order.notification_status
                        )}`}
                      >
                        Contact: {order.notification_status || "Not Notified"}
                      </span>

                      <span
                        className={`app-badge px-2.5 py-1 text-xs font-semibold ${getPickupDeliveryStatusClass(
                          order.pickup_delivery_status
                        )}`}
                      >
                        Pickup: {order.pickup_delivery_status || "Not Ready"}
                      </span>

                      <span
                        className={`app-badge px-2.5 py-1 text-xs font-semibold ${getProofStatusClass(
                          order.proof_status
                        )}`}
                      >
                        Proof: {order.proof_status || "Not Required"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredJobs.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={7}>
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            itemLabel="jobs"
            pageSize={pageSize}
            totalItems={filteredJobs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }}
          />
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

export default function WorkOrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="app-page">
          <div className="app-container">
            <section className="app-panel-pad text-slate-500">
              Loading jobs...
            </section>
          </div>
        </main>
      }
    >
      <WorkOrdersContent />
    </Suspense>
  );
}
