"use client";

/*
=========================================
ID - Work Orders
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

// Types
type WorkOrder = {
  id: number;
  created_at: string | null;
  due_date: string | null;
  project_type: string | null;
  project_options: string[] | null;
  description: string | null;
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
    phone: string | null;
    email: string | null;
    street_address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  active: boolean | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

const paymentStatusOptions = [
  "Not Checked",
  "Needs Payment",
  "Partial / Deposit Paid",
  "Paid",
  "Refunded",
  "Bill Later",
  "No Charge",
];

const notificationStatusOptions = [
  "Not Notified",
  "Needs Contact",
  "Called",
  "Left Voicemail",
  "Texted",
  "Emailed",
  "Notified",
  "Follow Up Needed",
];

const pickupDeliveryStatusOptions = [
  "Not Ready",
  "Ready for Pickup",
  "Picked Up",
  "Mailed",
  "Delivered",
  "Holding",
  "Not Applicable",
];

const optionChoices: Record<string, Record<string, string[]>> = {
  Transfer: {
    "Source Media": ["VHS", "Audio", "Film", "Other"],
    "Output Format": ["USB", "DVD"],
    "Extra Copies": ["None", "1 Extra", "2 Extras", "Custom"],
    "Outside Lab": ["Yes", "No"],
  },
  "Scan / Reproduction": {
    Source: ["Slides", "Photos", "Oversized Photo / Artwork", "Other"],
    "Requested Output": ["Digital Only", "Prints Only", "Digital + Prints"],
    "Digital Format": ["USB", "DVD", "Not Needed"],
    "Enhancement Work": [
      "None",
      "Basic Cleanup",
      "Restoration",
      "Colorization",
      "Restoration + Colorization",
    ],
    "Print Size": [
      "Not Needed",
      "Same Size",
      "4x6",
      "5x7",
      "8x10",
      "11x14",
      "Custom",
    ],
    "Extra Copies": ["None", "1 Extra", "2 Extras", "Custom"],
  },
  "Studio Session": {
    "Session Type": ["Passport", "Family", "Senior", "Baby", "Headshots"],
    "Appointment Status": [
      "Needs Scheduling",
      "Scheduled",
      "Photos Taken",
      "Viewing / Ordering",
      "Order Placed",
    ],
  },
};

const getProjectOptionValue = (category: string, option: string) => {
  return `${category}: ${option}`;
};

const getProjectOptionLabel = (option: string) => {
  return option.includes(": ") ? option.split(": ").slice(1).join(": ") : option;
};

const shouldShowProjectOption = (option: string) => {
  const label = getProjectOptionLabel(option);
  return label !== "None" && label !== "Not Needed";
};

const groupProjectOptions = (options: string[] | null) => {
  return (options || [])
    .filter(shouldShowProjectOption)
    .reduce<Record<string, string[]>>((groups, option) => {
      const [category, ...labelParts] = option.split(": ");
      if (!labelParts.length) return groups;

      const label = labelParts.length ? labelParts.join(": ") : option;

      return {
        ...groups,
        [category]: [...(groups[category] || []), label],
      };
    }, {});
};

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
  if (status === "Notified" || status === "Called" || status === "Texted" || status === "Emailed") {
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

const getPickupDeliveryStatusForJobStatusChange = (
  nextJobStatus: string,
  currentPickupDeliveryStatus: string | null
) => {
  if (nextJobStatus === "Canceled") {
    return "Not Applicable";
  }

  return currentPickupDeliveryStatus;
};

const getPaymentStatusForJobStatusChange = (
  nextJobStatus: string,
  currentPaymentStatus: string | null
) => {
  if (nextJobStatus !== "Canceled") {
    return currentPaymentStatus;
  }

  if (
    currentPaymentStatus === "Paid" ||
    currentPaymentStatus === "Partial / Deposit Paid"
  ) {
    return "Refunded";
  }

  return "No Charge";
};

const formatDueDateParts = (dueDate: string | null) => {
  if (!dueDate) {
    return null;
  }

  const [year, month, day] = dueDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return {
    monthDay: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }),
    year: String(year),
  };
};

const formatTimestampDateParts = (timestamp: string | null) => {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return {
    monthDay: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }),
    year: String(date.getFullYear()),
  };
};

export default function WorkOrderDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [savedWorkOrder, setSavedWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const loadWorkOrder = async () => {
      const workOrderId = Number(id);

      if (!Number.isInteger(workOrderId)) {
        setFeedback({
          title: "Work Order Load Failed",
          message: "The work order ID is invalid.",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          created_at,
          due_date,
          project_type,
          project_options,
          description,
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
            last_name,
            phone,
            email,
            street_address,
            city,
            state,
            zip_code
          )
        `)
        .eq("id", workOrderId)
        .single();

      if (error) {
        setFeedback({
          title: "Work Order Load Failed",
          message: error.message,
        });
        setIsLoading(false);
        return;
      }

      setWorkOrder(data as unknown as WorkOrder);
      setIsLoading(false);
    };

    loadWorkOrder();
  }, [id]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, active")
        .eq("active", true)
        .order("full_name");

      if (error) {
        console.error(error.message);
        return;
      }

      setUsers(data || []);
    };

    fetchUsers();
  }, []);

  const saveJob = async () => {
    if (!workOrder) return;

    const dueDate = workOrder.due_date;
    const projectType = workOrder.project_type;
    const status = workOrder.status || "Open";

    if (!dueDate || !projectType) {
      setFeedback({
        title: "Job Update Failed",
        message: "Due date and project type are required.",
      });
      return;
    }

    const { error } = await supabase
      .from("work_orders")
      .update({
        due_date: dueDate,
        project_type: projectType,
        project_options: workOrder.project_options || [],
        assigned_user_id: workOrder.assigned_user_id || null,
        description: workOrder.description || "",
        status,
        payment_status: workOrder.payment_status || "Not Checked",
        notification_status: workOrder.notification_status || "Not Notified",
        pickup_delivery_status: workOrder.pickup_delivery_status || "Not Ready",
      })
      .eq("id", workOrder.id)
      .select("id")
      .single();

    if (error) {
      setFeedback({
        title: "Job Update Failed",
        message: error.message,
      });
      return;
    }

    setFeedback({
      title: "Job Updated",
      message: "The work order has been saved successfully.",
      tone: "success",
    });
    setSavedWorkOrder(null);
    setShowEditForm(false);
  };

  const startJobEdit = () => {
    if (!workOrder) return;

    setSavedWorkOrder({
      ...workOrder,
      project_options: [...(workOrder.project_options || [])],
    });
    setShowEditForm(true);
  };

  const cancelJobEdit = () => {
    if (savedWorkOrder) {
      setWorkOrder(savedWorkOrder);
    }

    setSavedWorkOrder(null);
    setShowEditForm(false);
  };

  const toggleProjectOption = (category: string, option: string) => {
    if (!workOrder) return;

    const currentOptions = workOrder.project_options || [];
    const optionValue = getProjectOptionValue(category, option);

    setWorkOrder({
      ...workOrder,
      project_options: currentOptions.includes(optionValue)
        ? currentOptions.filter((item) => item !== optionValue)
        : [...currentOptions, optionValue],
    });
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <p className="text-slate-600">Loading job...</p>
      </main>
    );
  }

  if (!workOrder) {
    return (
      <main className="app-page">
        <div className="app-container-narrow">
          <Link href="/work-orders" className="text-blue-700 font-semibold">
            ← Back to Jobs
          </Link>

          <section className="app-panel-pad">
            <h1 className="text-2xl font-bold text-slate-900">Job unavailable</h1>
            <p className="mt-2 text-slate-600">
              This work order could not be loaded.
            </p>
          </section>

          {feedback && (
            <FeedbackModal
              title={feedback.title}
              message={feedback.message}
              tone={feedback.tone}
              onClose={() => setFeedback(null)}
            />
          )}
        </div>
      </main>
    );
  }

  const customerName = workOrder.customers
    ? `${workOrder.customers.first_name} ${workOrder.customers.last_name}`
    : "Unknown Customer";

  const groupedProjectOptions = groupProjectOptions(workOrder.project_options);
  const dueDateParts = formatDueDateParts(workOrder.due_date);
  const createdDateParts = formatTimestampDateParts(workOrder.created_at);

    // ====================
    // PAGE LAYOUT
    // ====================

  return (
    <main className="app-page">
      <div className="app-container-narrow">
        <Link href="/work-orders" className="text-blue-700 font-semibold">
          ← Back to Jobs
        </Link>

        <section className="app-header">
          <div>
            <p className="app-eyebrow">
              Order No. WO-{String(workOrder.id).padStart(6, "0")}
            </p>

            <h1 className="app-title">
              {customerName}
            </h1>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 items-start">
          <section className="app-panel-pad">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-slate-900">Job Ticket</h2>

              <button
                onClick={showEditForm ? cancelJobEdit : startJobEdit}
                className="app-button-primary"
              >
                {showEditForm ? "Close Edit Job" : "Edit Job"}
              </button>
            </div>

            {showEditForm ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Edit Job
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Due Date
                    </label>

                    <input
                      className="app-input py-2"
                      type="date"
                      value={workOrder.due_date || ""}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          due_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Status
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.status || "Open"}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          status: e.target.value,
                          payment_status: getPaymentStatusForJobStatusChange(
                            e.target.value,
                            workOrder.payment_status
                          ),
                          pickup_delivery_status:
                            getPickupDeliveryStatusForJobStatusChange(
                              e.target.value,
                              workOrder.pickup_delivery_status
                            ),
                        })
                      }
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Done</option>
                      <option>Canceled</option>
                      <option>Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Payment Status
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.payment_status || "Not Checked"}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          payment_status: e.target.value,
                        })
                      }
                    >
                      {paymentStatusOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Customer Notification
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.notification_status || "Not Notified"}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          notification_status: e.target.value,
                        })
                      }
                    >
                      {notificationStatusOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Pickup / Delivery
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.pickup_delivery_status || "Not Ready"}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          pickup_delivery_status: e.target.value,
                        })
                      }
                    >
                      {pickupDeliveryStatusOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Project Type
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.project_type || ""}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          project_type: e.target.value,
                          project_options: [],
                        })
                      }
                    >
                      <option value="">Select project type</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Scan / Reproduction">
                        Scan / Reproduction
                      </option>
                      <option value="Studio Session">Studio Session</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Assigned Person
                    </label>

                    <select
                      className="app-input py-2"
                      value={workOrder.assigned_user_id || ""}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          assigned_user_id: e.target.value || null,
                          profiles:
                            users.find((user) => user.id === e.target.value) ||
                            null,
                        })
                      }
                    >
                      <option value="">Unassigned</option>

                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || "Unnamed User"} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {workOrder.project_type &&
                    Object.keys(
                      optionChoices[workOrder.project_type] || {}
                    ).length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-4 text-slate-700">
                        Project Details
                      </label>

                      <div className="grid gap-4">
                        {Object.entries(
                          optionChoices[workOrder.project_type] || {}
                        ).map(([category, options]) => (
                          <div
                            key={category}
                            className="bg-white border rounded-xl p-4"
                          >
                            <h3 className="font-semibold text-slate-900 mb-3">
                              {category}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {options.map((option) => {
                                const optionValue = getProjectOptionValue(
                                  category,
                                  option
                                );

                                return (
                                  <label
                                    key={optionValue}
                                    className="flex items-center gap-2 text-slate-900"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={(
                                        workOrder.project_options || []
                                      ).includes(optionValue)}
                                      onChange={() =>
                                        toggleProjectOption(category, option)
                                      }
                                    />

                                    {option}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">
                      Description / Notes
                    </label>

                    <textarea
                      className="app-input min-h-28 py-2"
                      value={workOrder.description || ""}
                      maxLength={250}
                      onChange={(e) =>
                        setWorkOrder({
                          ...workOrder,
                          description: e.target.value,
                        })
                      }
                    />

                    <p className="text-sm text-slate-500 mt-1">
                      {(workOrder.description || "").length}/250 characters
                    </p>
                  </div>
                </div>

                <button
                  onClick={saveJob}
                  className="mt-6 app-button-primary"
                >
                  Save Job
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Created
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {createdDateParts ? (
                        <>
                          {createdDateParts.monthDay}{" "}
                          <span className="text-sm font-semibold text-slate-500">
                            {createdDateParts.year}
                          </span>
                        </>
                      ) : (
                        "No created date"
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Due Date
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {dueDateParts ? (
                        <>
                          {dueDateParts.monthDay}{" "}
                          <span className="text-sm font-semibold text-slate-500">
                            {dueDateParts.year}
                          </span>
                        </>
                      ) : (
                        "No due date"
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Type
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {workOrder.project_type || "No type"}
                    </p>
                  </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-3">
                      Tracking
                    </p>
                    <div className="flex flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Status
                    </p>
                    <p
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                        workOrder.status
                      )}`}
                    >
                      {workOrder.status || "No status"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Payment
                    </p>
                    <p
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusClass(
                        workOrder.payment_status
                      )}`}
                    >
                      {workOrder.payment_status || "Not Checked"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Customer
                    </p>
                    <p
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getNotificationStatusClass(
                        workOrder.notification_status
                      )}`}
                    >
                      {workOrder.notification_status || "Not Notified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Pickup
                    </p>
                    <p
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getPickupDeliveryStatusClass(
                        workOrder.pickup_delivery_status
                      )}`}
                    >
                      {workOrder.pickup_delivery_status || "Not Ready"}
                    </p>
                  </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-2">
                    Job Details
                  </p>

                  <div className="border rounded-xl overflow-hidden">
                    {Object.keys(groupedProjectOptions).length ? (
                      Object.entries(groupedProjectOptions).map(
                        ([category, options]) => (
                          <div
                            key={category}
                            className="grid grid-cols-1 sm:grid-cols-[180px_1fr] border-b last:border-b-0"
                          >
                            <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                              {category}
                            </div>
                            <div className="px-4 py-3 font-semibold text-slate-900">
                              {options.map(getProjectOptionLabel).join(", ")}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="p-4 text-slate-500">No options selected</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-2">
                    Description / Notes
                  </p>

                  <div className="border rounded-xl p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {workOrder.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="app-panel-pad">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-5">
                  Assignment
                </h2>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Assigned Person
                  </p>
                  <p className="font-semibold text-slate-900">
                    {workOrder.profiles?.full_name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-5">
                <h2 className="text-xl font-bold text-slate-900 mb-5">
                  Customer Contact
                </h2>

                <div className="grid gap-4 text-slate-700">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Phone
                    </p>
                    <p className="font-semibold text-slate-900">
                      {workOrder.customers?.phone || "No phone"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Email
                    </p>
                    <p className="font-semibold text-slate-900 break-words">
                      {workOrder.customers?.email || "No email"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Address
                    </p>
                    <p className="font-semibold text-slate-900">
                      {workOrder.customers?.street_address || "No address"}
                      {workOrder.customers?.city
                        ? `, ${workOrder.customers.city}`
                        : ""}
                      {workOrder.customers?.state
                        ? `, ${workOrder.customers.state}`
                        : ""}
                      {workOrder.customers?.zip_code
                        ? ` ${workOrder.customers.zip_code}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
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
      </div>
    </main>
  );
}
