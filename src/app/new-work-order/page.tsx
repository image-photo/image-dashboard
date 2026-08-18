"use client";

/*
=========================================
NEW WORK ORDER PAGE
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";
import { getSearchTerms, sanitizeSearchTerm } from "@/lib/search";
import { proofStatusOptions } from "@/lib/work-order-status";

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

type NewWorkOrderRecord = {
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

export default function NewWorkOrderPage() {
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSelectedCustomerEdit, setShowSelectedCustomerEdit] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [dueDate, setDueDate] = useState("");
  const [projectType, setProjectType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Not Checked");
  const [notificationStatus, setNotificationStatus] = useState("Not Notified");
  const [pickupDeliveryStatus, setPickupDeliveryStatus] = useState("Not Ready");
  const [proofStatus, setProofStatus] = useState("Not Required");
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [projectErrors, setProjectErrors] = useState({
    dueDate: "",
    projectType: "",
    email: "",
  });

  const [users, setUsers] = useState<Profile[]>([]);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [selectedCustomerEdits, setSelectedCustomerEdits] = useState({
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
  });

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

  // Effects
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;

    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  const formatZipCode = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const getProjectOptionValue = (category: string, option: string) => {
    return `${category}: ${option}`;
  };

  const toggleProjectOption = (category: string, option: string) => {
    const optionValue = getProjectOptionValue(category, option);

    if (projectOptions.includes(optionValue)) {
      setProjectOptions(projectOptions.filter((item) => item !== optionValue));
    } else {
      setProjectOptions([...projectOptions, optionValue]);
    }
  };

  const searchCustomers = async () => {
    if (isSearchingCustomers) return;

    const search = sanitizeSearchTerm(searchTerm);

    if (search.length === 0) {
      setSearchResults([]);
      return;
    }

    const searchTerms = getSearchTerms(search);
    const primarySearch = searchTerms[0] || search;
    setIsSearchingCustomers(true);

    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, first_name, last_name, street_address, city, state, zip_code, phone, email"
      )
      .or(
        `first_name.ilike.%${primarySearch}%,last_name.ilike.%${primarySearch}%,phone.ilike.%${primarySearch}%`
      )
      .limit(50);

    setIsSearchingCustomers(false);

    if (error) {
      setFeedback({
        title: "Customer Search Failed",
        message: error.message,
      });
      return;
    }

    const matchingCustomers = (data || []).filter((customer) => {
      const searchableCustomer = [
        customer.first_name,
        customer.last_name,
        customer.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) =>
        searchableCustomer.includes(term.toLowerCase())
      );
    });

    setSearchResults(matchingCustomers.slice(0, 10));
  };

  const startEditingSelectedCustomer = () => {
    if (!selectedCustomer) return;

    setSelectedCustomerEdits({
      street_address: selectedCustomer.street_address || "",
      city: selectedCustomer.city || "",
      state: selectedCustomer.state || "",
      zip_code: selectedCustomer.zip_code || "",
      phone: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
    });

    setShowSelectedCustomerEdit(true);
  };

  const saveSelectedCustomer = async () => {
    if (!selectedCustomer) return;

    const { data, error } = await supabase
      .from("customers")
      .update(selectedCustomerEdits)
      .eq("id", selectedCustomer.id)
      .select(
        "id, first_name, last_name, street_address, city, state, zip_code, phone, email"
      )
      .single();

    if (error) {
      setFeedback({
        title: "Customer Update Failed",
        message: error.message,
      });
      return;
    }

    const updatedCustomer = data as Customer;

    setSelectedCustomer(updatedCustomer);
    setSearchResults((results) =>
      results.map((customer) =>
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    setShowSelectedCustomerEdit(false);
  };

  const submitWorkOrder = async () => {
    if (isSaving) return;

    const customerId = selectedCustomer?.id;

    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
    };
    const newProjectErrors = {
      dueDate: dueDate ? "" : "Due date is required",
      projectType: projectType ? "" : "Project type is required",
      email:
        !selectedCustomer && email.trim() && !isValidEmail(email.trim())
          ? "Enter a valid email address"
          : "",
    };

    if (!selectedCustomer) {
      if (!showNewCustomerForm) {
        setFeedback({
          title: "Select a Customer",
          message: "Please select an existing customer or create a new customer.",
        });
        return;
      }

      if (!firstName.trim()) newErrors.firstName = "First name is required";
      if (!lastName.trim()) newErrors.lastName = "Last name is required";
      if (!phone.trim()) newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    setProjectErrors(newProjectErrors);

    if (
      newErrors.firstName ||
      newErrors.lastName ||
      newErrors.phone ||
      newProjectErrors.dueDate ||
      newProjectErrors.projectType ||
      newProjectErrors.email
    ) {
      return;
    }

    setIsSaving(true);

    let workOrderData: NewWorkOrderRecord;

    if (!customerId) {
      const { data, error } = await supabase
        .rpc("create_customer_and_work_order", {
          p_first_name: firstName.trim(),
          p_last_name: lastName.trim(),
          p_phone: phone.trim(),
          p_due_date: dueDate,
          p_project_type: projectType,
          p_email: email.trim() || undefined,
          p_street_address: streetAddress.trim() || undefined,
          p_city: city.trim() || undefined,
          p_state: state || undefined,
          p_zip_code: zipCode || undefined,
          p_assigned_user_id: assignedUserId || undefined,
          p_project_options: projectOptions,
          p_description: description,
          p_payment_status: paymentStatus,
          p_notification_status: notificationStatus,
          p_pickup_delivery_status: pickupDeliveryStatus,
          p_proof_status: proofStatus,
        })
        .single();

      if (error) {
        setIsSaving(false);
        setFeedback({
          title: "Work Order Save Failed",
          message: error.message,
        });
        return;
      }

      workOrderData = {
        id: data.work_order_id,
        due_date: dueDate,
        project_type: projectType,
        status: "Open",
        assigned_user_id: assignedUserId || null,
        customers: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      };
    } else {
      const { data, error } = await supabase
        .from("work_orders")
        .insert([
          {
            customer_id: customerId,
            due_date: dueDate,
            project_type: projectType,
            assigned_user_id: assignedUserId || null,
            project_options: projectOptions,
            description,
            status: "Open",
            payment_status: paymentStatus,
            notification_status: notificationStatus,
            pickup_delivery_status: pickupDeliveryStatus,
            proof_status: proofStatus,
          },
        ])
        .select(
          `
          id,
          due_date,
          project_type,
          status,
          assigned_user_id,
          customers (
            first_name,
            last_name
          )
        `
        )
        .single();

      if (error) {
        setIsSaving(false);
        setFeedback({
          title: "Work Order Save Failed",
          message: error.message,
        });
        return;
      }

      workOrderData = data as unknown as NewWorkOrderRecord;
    }

    setIsSaving(false);

    const createdEvent = new CustomEvent<NewWorkOrderRecord>(
      "work-order-created",
      {
        detail: workOrderData,
        cancelable: true,
      }
    );

    window.dispatchEvent(createdEvent);

    if (!createdEvent.defaultPrevented) {
      setShowSuccessModal(true);
    }

    setSearchTerm("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setShowSelectedCustomerEdit(false);
    setShowNewCustomerForm(false);

    setFirstName("");
    setLastName("");
    setStreetAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setPhone("");
    setEmail("");

    setDueDate("");
    setProjectType("");
    setPaymentStatus("Not Checked");
    setNotificationStatus("Not Notified");
    setPickupDeliveryStatus("Not Ready");
    setProofStatus("Not Required");
    setAssignedUserId("");
    setProjectOptions([]);
    setDescription("");

    setErrors({
      firstName: "",
      lastName: "",
      phone: "",
    });
    setProjectErrors({ dueDate: "", projectType: "", email: "" });
  };

  // ====================
  // PAGE LAYOUT
  // ====================

  return (
    <main className="app-page">
      
      <div className="app-container-narrow">
        <section className="app-header">
          <div>
            <p className="app-eyebrow">Studio Queue</p>
            <h1 className="app-title">New Work Order</h1>
            <p className="app-subtitle">
              Create a customer job and capture the details the studio needs.
            </p>
          </div>
        </section>

        <div className="grid gap-6">
          {/*Customer Search*/}
          <section className="app-panel-pad">
            <h2 className="text-xl font-bold mb-2 text-slate-900">Customer</h2>

            <p className="text-sm text-slate-500 mb-4">
              Search for an existing customer first. If they are not in the
              system, create a new customer record.
            </p>

            <form
              className="flex gap-2 mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                searchCustomers();
              }}
            >
              <input
                className="app-input flex-1"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                type="submit"
                disabled={isSearchingCustomers}
                className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearchingCustomers ? "Searching..." : "Search"}
              </button>
            </form>

            {selectedCustomer && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="font-semibold text-slate-900">Selected Customer</p>
                <p className="text-slate-700">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
                <p className="text-slate-500">
                  {selectedCustomer.phone || "No phone"} ·{" "}
                  {selectedCustomer.email || "No email"}
                </p>

                {showSelectedCustomerEdit && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 border-t border-blue-200 pt-4">
                    <input
                      className="border p-2 rounded text-slate-900 md:col-span-2"
                      placeholder="Street Address"
                      autoComplete="off"
                      value={selectedCustomerEdits.street_address}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          street_address: e.target.value,
                        })
                      }
                    />

                    <input
                      className="border p-2 rounded text-slate-900"
                      placeholder="City"
                      autoComplete="off"
                      value={selectedCustomerEdits.city}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          city: e.target.value,
                        })
                      }
                    />

                    <select
                      className="border p-2 rounded text-slate-900"
                      autoComplete="off"
                      value={selectedCustomerEdits.state}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          state: e.target.value,
                        })
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
                      className="border p-2 rounded text-slate-900"
                      placeholder="Zip Code"
                      autoComplete="off"
                      value={selectedCustomerEdits.zip_code}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          zip_code: formatZipCode(e.target.value),
                        })
                      }
                    />

                    <input
                      className="border p-2 rounded text-slate-900"
                      placeholder="Phone"
                      inputMode="numeric"
                      value={selectedCustomerEdits.phone}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          phone: formatPhoneNumber(e.target.value),
                        })
                      }
                    />

                    <input
                      className="border p-2 rounded text-slate-900 md:col-span-2"
                      placeholder="Email"
                      type="email"
                      value={selectedCustomerEdits.email}
                      onChange={(e) =>
                        setSelectedCustomerEdits({
                          ...selectedCustomerEdits,
                          email: e.target.value,
                        })
                      }
                    />

                    <div className="flex gap-3 md:col-span-2">
                      <button
                        onClick={saveSelectedCustomer}
                        className="app-button-primary"
                      >
                        Save Customer
                      </button>

                      <button
                        onClick={() => setShowSelectedCustomerEdit(false)}
                        className="border px-4 py-2 rounded-xl font-semibold text-slate-700 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!showSelectedCustomerEdit && (
                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={startEditingSelectedCustomer}
                      className="text-sm text-blue-700 font-semibold"
                    >
                      Edit Customer
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setShowSelectedCustomerEdit(false);
                        setShowNewCustomerForm(false);
                      }}
                      className="text-sm text-blue-700 font-semibold"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              {searchResults
                .filter((customer) => customer.id !== selectedCustomer?.id)
                .map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowSelectedCustomerEdit(false);
                      setShowNewCustomerForm(false);
                      setErrors({
                        firstName: "",
                        lastName: "",
                        phone: "",
                      });
                    }}
                    className="text-left border rounded-xl p-3 hover:bg-blue-50"
                  >
                    <p className="font-semibold text-slate-900">
                      {customer.first_name} {customer.last_name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {customer.phone || "No phone"} ·{" "}
                      {customer.email || "No email"}
                    </p>
                  </button>
                ))}
            </div>

            {!selectedCustomer && !showNewCustomerForm && (
              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="mt-4 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold"
              >
                + Create New Customer
              </button>
            )}
          </section>

          {/*Add New Customer*/}
          {!selectedCustomer && showNewCustomerForm && (
            <section className="app-panel-pad">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Create New Customer
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    First name, last name, and phone number are required.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    setErrors({
                      firstName: "",
                      lastName: "",
                      phone: "",
                    });
                  }}
                  className="text-sm text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    className="border p-2 rounded text-slate-900 w-full"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
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
                    className="border p-2 rounded text-slate-900 w-full"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
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
                  className="border p-2 rounded text-slate-900 md:col-span-2"
                  placeholder="Street Address"
                  autoComplete="off"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />

                <input
                  className="border p-2 rounded text-slate-900"
                  placeholder="City"
                  autoComplete="off"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <select
                  className="border p-2 rounded text-slate-900"
                  autoComplete="off"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">State</option>
                  {usStates.map((stateCode) => (
                    <option key={stateCode} value={stateCode}>
                      {stateCode}
                    </option>
                  ))}
                </select>

                <input
                  className="border p-2 rounded text-slate-900"
                  placeholder="Zip Code"
                  autoComplete="off"
                  value={zipCode}
                  onChange={(e) => setZipCode(formatZipCode(e.target.value))}
                />

                <div>
                  <input
                    className="border p-2 rounded text-slate-900 w-full"
                    placeholder="Phone"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhoneNumber(e.target.value));
                      setErrors({ ...errors, phone: "" });
                    }}
                  />

                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <input
                  type="email"
                  className="border p-2 rounded text-slate-900"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setProjectErrors({ ...projectErrors, email: "" });
                  }}
                />

                {projectErrors.email && (
                  <p className="text-red-500 text-sm md:col-span-2">
                    {projectErrors.email}
                  </p>
                )}
              </div>
            </section>
          )}

          {/*Form*/}
          <section className="app-panel-pad">
            <h2 className="text-xl font-bold mb-2 text-slate-900">
              Project Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Due Date
                </label>

                <input
                  className="border p-2 rounded text-slate-900 w-full"
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setProjectErrors({ ...projectErrors, dueDate: "" });
                  }}
                />

                {projectErrors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {projectErrors.dueDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Project Type
                </label>

                <select
                  className="border p-2 rounded text-slate-900 w-full"
                  value={projectType}
                  onChange={(e) => {
                    setProjectType(e.target.value);
                    setProjectOptions([]);
                    setProjectErrors({ ...projectErrors, projectType: "" });
                  }}
                >
                  <option value="">Select project type</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Scan / Reproduction">Scan / Reproduction</option>
                  <option value="Studio Session">Studio Session</option>
                  <option value="Other">Other</option>
                </select>

                {projectErrors.projectType && (
                  <p className="text-red-500 text-sm mt-1">
                    {projectErrors.projectType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Assigned Person
                </label>

                <select
                  className="border p-2 rounded text-slate-900 w-full"
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                >
                  <option value="">Unassigned</option>

                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || "Unnamed User"} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Payment Status
                </label>

                <select
                  className="border p-2 rounded text-slate-900 w-full"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
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
                  className="border p-2 rounded text-slate-900 w-full"
                  value={notificationStatus}
                  onChange={(e) => setNotificationStatus(e.target.value)}
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
                  className="border p-2 rounded text-slate-900 w-full"
                  value={pickupDeliveryStatus}
                  onChange={(e) => setPickupDeliveryStatus(e.target.value)}
                >
                  {pickupDeliveryStatusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Proof Status
                </label>

                <select
                  className="border p-2 rounded text-slate-900 w-full"
                  value={proofStatus}
                  onChange={(e) => setProofStatus(e.target.value)}
                >
                  {proofStatusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              {Object.keys(optionChoices[projectType] || {}).length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-4 text-slate-700">
                    Project Details
                  </label>

                  <div className="grid gap-4">
                    {Object.entries(optionChoices[projectType] || {}).map(
                      ([category, options]) => (
                        <div key={category} className="border rounded-xl p-4">
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
                                    checked={projectOptions.includes(optionValue)}
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
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Project Description
                </label>

                <textarea
                  className="border p-2 rounded text-slate-900 w-full min-h-28"
                  placeholder="Describe what the customer needs..."
                  value={description}
                  maxLength={250}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <p className="text-sm text-slate-500 mt-1">
                  {description.length}/250 characters
                </p>
              </div>
            </div>
          </section>
          
          {/*Form Button*/}
          <button
            onClick={submitWorkOrder}
            disabled={isSaving}
            className="app-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Creating Work Order..." : "Create Work Order"}
          </button>

        </div>

      </div>
      
      {/*Success Creating New Work Order*/}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Work Order Created
            </h2>

            <p className="text-slate-600 mb-6">
              The new job has been saved successfully.
            </p>

            <div className="grid gap-3">
              <Link
                href="/work-orders"
                className="app-button-primary text-center"
              >
                View Jobs
              </Link>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="border px-4 py-3 rounded-xl font-semibold text-slate-700 hover:bg-blue-50"
              >
                Create Another
              </button>
            </div>
          </div>
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
