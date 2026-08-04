"use client";

/*
=========================================
Work Orders Table
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

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

export default function WorkOrdersPage() {
  // States
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const router = useRouter();

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


  const filteredJobs = workOrders.filter((order) => {
    const statusMatch =
      statusFilter === "Active"
        ? order.status === "Open" || order.status === "In Progress"
        : statusFilter === "All" || order.status === statusFilter;

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
      options.includes(search);

    return statusMatch && searchMatch;
  });

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

  const [showFilters, setShowFilters] = useState(false);

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>Active</option>
                  <option>All</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Done</option>
                  <option>Canceled</option>
                  <option>Archived</option>
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
              {filteredJobs.map((order) => (
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
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                      {order.project_type || "No Type"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                      {order.profiles?.full_name || "Unassigned"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status || "Open"}
                    </span>
                  </td>

                  <td className="p-4 min-w-52">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(
                          order.payment_status
                        )}`}
                      >
                        Pay: {order.payment_status || "Not Checked"}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getNotificationStatusClass(
                          order.notification_status
                        )}`}
                      >
                        Contact: {order.notification_status || "Not Notified"}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPickupDeliveryStatusClass(
                          order.pickup_delivery_status
                        )}`}
                      >
                        Pickup: {order.pickup_delivery_status || "Not Ready"}
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
