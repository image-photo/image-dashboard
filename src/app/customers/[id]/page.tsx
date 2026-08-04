"use client";

/*
=========================================
Individual Customer Page

Information for individual customers and their related work orders.
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

// Types
type Customer = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
};

type WorkOrder = {
  id: number;
  due_date: string | null;
  project_type: string | null;
  status: string | null;
  payment_status: string | null;
  notification_status: string | null;
  pickup_delivery_status: string | null;
  description: string | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

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

// ====================
// Components
// ====================

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [savedCustomer, setSavedCustomer] = useState<Customer | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  const formatZipCode = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  useEffect(() => {
    const loadCustomer = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setFeedback({
          title: "Customer Load Failed",
          message: error.message,
        });
        setIsLoading(false);
        return;
      }

      setCustomer(data);
      setIsLoading(false);
    };

    const loadWorkOrders = async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(
          "id, due_date, project_type, status, payment_status, notification_status, pickup_delivery_status, description"
        )
        .eq("customer_id", id)
        .order("id", { ascending: false });

      if (error) {
        setFeedback({
          title: "Job History Load Failed",
          message: error.message,
        });
        return;
      }

      setWorkOrders(data || []);
    };

    loadCustomer();
    loadWorkOrders();
  }, [id]);

  

  const saveCustomer = async () => {
    if (!customer) return;

    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
    };

    if (!customer.first_name?.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!customer.last_name?.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!customer.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);

    if (newErrors.firstName || newErrors.lastName || newErrors.phone) {
      return;
    }

    const { error } = await supabase
      .from("customers")
      .update({
        first_name: customer.first_name,
        last_name: customer.last_name,
        street_address: customer.street_address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code,
        phone: customer.phone,
        email: customer.email,
      })
      .eq("id", customer.id)
      .select("id")
      .single();

    if (error) {
      setFeedback({
        title: "Customer Update Failed",
        message: error.message,
      });
      return;
    }

    setFeedback({
      title: "Customer Updated",
      message: "The customer record has been saved successfully.",
      tone: "success",
    });
    setSavedCustomer(null);
    setShowEditForm(false);
  };

  const startCustomerEdit = () => {
    if (!customer) return;

    setSavedCustomer({ ...customer });
    setShowEditForm(true);
  };

  const cancelCustomerEdit = () => {
    if (savedCustomer) {
      setCustomer(savedCustomer);
    }

    setSavedCustomer(null);
    setErrors({ firstName: "", lastName: "", phone: "" });
    setShowEditForm(false);
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <p className="text-slate-600">Loading customer...</p>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="app-page">
        <div className="app-container-narrow">
          <Link href="/customers" className="text-blue-700 font-semibold">
            ← Back to Customers
          </Link>

          <section className="app-panel-pad">
            <h1 className="text-2xl font-bold text-slate-900">
              Customer unavailable
            </h1>
            <p className="mt-2 text-slate-600">
              This customer record could not be loaded.
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

  const addressLine = [
    customer.street_address,
    [customer.city, customer.state].filter(Boolean).join(", "),
    customer.zip_code,
  ]
    .filter(Boolean)
    .join(" ");

  // ====================
  // PAGE LAYOUT
  // ====================

  return (
    <main className="app-page">
      
      <div className="app-container-narrow">
        
        <Link href="/customers" className="text-blue-700 font-semibold">
          ← Back to Customers
        </Link>

        {/*Profile Card*/}
        <section className="app-panel-pad">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="app-eyebrow">
                Customer Profile
              </p>

              <h1 className="app-title">
                {customer.first_name} {customer.last_name}
              </h1>

              <p className="app-subtitle">
                Customer details and job history.
              </p>
            </div>

            <button
              onClick={showEditForm ? cancelCustomerEdit : startCustomerEdit}
              className="app-button-primary"
            >
              {showEditForm ? "Close Edit Customer" : "Edit Customer"}
            </button>
          </div>

          {showEditForm ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mt-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Edit Customer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    className="app-input py-2"
                    placeholder="First Name"
                    value={customer.first_name || ""}
                    onChange={(e) => {
                      setCustomer({ ...customer, first_name: e.target.value });
                      setErrors({ ...errors, firstName: "" });
                    }}
                  />

                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    className="app-input py-2"
                    placeholder="Last Name"
                    value={customer.last_name || ""}
                    onChange={(e) => {
                      setCustomer({ ...customer, last_name: e.target.value });
                      setErrors({ ...errors, lastName: "" });
                    }}
                  />

                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <input
                  className="app-input py-2 md:col-span-2"
                  placeholder="Street Address"
                  value={customer.street_address || ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, street_address: e.target.value })
                  }
                />

                <input
                  className="app-input py-2"
                  placeholder="City"
                  value={customer.city || ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, city: e.target.value })
                  }
                />

                <select
                  className="app-input py-2"
                  value={customer.state || ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, state: e.target.value })
                  }
                >
                  <option value="">State</option>
                  {usStates.map((stateCode) => (
                    <option key={stateCode} value={stateCode}>
                      {stateCode}
                    </option>
                  ))}
                </select>

                <input
                  className="app-input py-2"
                  placeholder="Zip Code"
                  value={customer.zip_code || ""}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      zip_code: formatZipCode(e.target.value),
                    })
                  }
                />

                <div>
                  <input
                    className="app-input py-2"
                    placeholder="Phone"
                    inputMode="numeric"
                    value={customer.phone || ""}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        phone: formatPhoneNumber(e.target.value),
                      });
                      setErrors({ ...errors, phone: "" });
                    }}
                  />

                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <input
                  type="email"
                  className="app-input py-2"
                  placeholder="Email"
                  value={customer.email || ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                />
              </div>

              <button
                onClick={saveCustomer}
                className="mt-6 app-button-primary"
              >
                Save Customer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-semibold text-slate-900">
                  {customer.phone || "No phone"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">
                  {customer.email || "No email"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Jobs</p>
                <p className="font-semibold text-slate-900">
                  {workOrders.length}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 md:col-span-3">
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-semibold text-slate-900">
                  {addressLine || "No address"}
                </p>
              </div>
            </div>
          )}
        </section>

        {/*Job History Card*/}
        <section className="app-panel-pad">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Job History
          </h2>

          <div className="border rounded-xl overflow-hidden">
            {workOrders.map((job) => (
              <Link
                key={job.id}
                href={`/work-orders/${job.id}`}
                className="grid grid-cols-1 gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-blue-50 lg:grid-cols-[140px_minmax(0,1fr)_160px_260px]"
              >
                <p className="text-sm font-semibold text-blue-700">
                  WO-{String(job.id).padStart(6, "0")}
                </p>

                <p className="font-semibold text-slate-900">
                  {job.project_type || "No project type"}
                </p>

                <p className="text-sm text-slate-500">
                  Due: {job.due_date || "No due date"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${getStatusClass(
                      job.status
                    )}`}
                  >
                    Job: {job.status || "No status"}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${getPaymentStatusClass(
                      job.payment_status
                    )}`}
                  >
                    Pay: {job.payment_status || "Not Checked"}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${getNotificationStatusClass(
                      job.notification_status
                    )}`}
                  >
                    Contact: {job.notification_status || "Not Notified"}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${getPickupDeliveryStatusClass(
                      job.pickup_delivery_status
                    )}`}
                  >
                    Pickup: {job.pickup_delivery_status || "Not Ready"}
                  </span>
                </div>
              </Link>
            ))}

            {workOrders.length === 0 && (
              <p className="p-4 text-slate-500">
                No jobs found for this customer.
              </p>
            )}
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
