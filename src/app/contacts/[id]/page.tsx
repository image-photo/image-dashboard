"use client";

/*
=========================================
Individual Contact Page
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

// Types
type Contact = {
  id: number;
  organization_name: string | null;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  type: string | null;
  status: string | null;
  last_contacted_date: string | null;
  next_follow_up_date: string | null;
  notes: string | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

const getStatusClass = (status: string | null) => {
  if (status === "Active") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Prospect") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Inactive") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-slate-100 text-slate-700";
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ====================
// Components
// ====================

export default function ContactDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [contact, setContact] = useState<Contact | null>(null);
  const [savedContact, setSavedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errors, setErrors] = useState({
    organizationName: "",
    contactName: "",
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  useEffect(() => {
    const loadContact = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setFeedback({
          title: "Contact Load Failed",
          message: error.message,
        });
        setIsLoading(false);
        return;
      }

      setContact(data);
      setIsLoading(false);
    };

    if (id) {
      loadContact();
    }
  }, [id]);

  const saveContact = async () => {
    if (!contact) return;

    const newErrors = {
      organizationName: "",
      contactName: "",
    };

    if (!contact.organization_name?.trim()) {
      newErrors.organizationName = "Organization is required";
    }

    if (!contact.contact_name?.trim()) {
      newErrors.contactName = "Contact name is required";
    }

    setErrors(newErrors);

    if (newErrors.organizationName || newErrors.contactName) {
      return;
    }

    const { error } = await supabase
      .from("contacts")
      .update({
        organization_name: contact.organization_name,
        contact_name: contact.contact_name,
        contact_role: contact.contact_role,
        phone: contact.phone,
        email: contact.email,
        type: contact.type,
        status: contact.status,
        last_contacted_date: contact.last_contacted_date || null,
        next_follow_up_date: contact.next_follow_up_date || null,
        notes: contact.notes,
      })
      .eq("id", contact.id)
      .select("id")
      .single();

    if (error) {
      setFeedback({
        title: "Contact Update Failed",
        message: error.message,
      });
      return;
    }

    setFeedback({
      title: "Contact Updated",
      message: "The contact record has been saved successfully.",
      tone: "success",
    });
    setSavedContact(null);
    setShowEditForm(false);
  };

  const startContactEdit = () => {
    if (!contact) return;

    setSavedContact({ ...contact });
    setShowEditForm(true);
  };

  const cancelContactEdit = () => {
    if (savedContact) {
      setContact(savedContact);
    }

    setSavedContact(null);
    setErrors({ organizationName: "", contactName: "" });
    setShowEditForm(false);
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <p className="text-slate-600">Loading contact...</p>
      </main>
    );
  }

  if (!contact) {
    return (
      <main className="app-page">
        <div className="app-container-narrow">
          <Link href="/contacts" className="text-blue-700 font-semibold">
            ← Back to Contacts
          </Link>

          <section className="app-panel-pad">
            <h1 className="text-2xl font-bold text-slate-900">
              Contact not found
            </h1>

            <p className="text-slate-500 mt-2">
              This contact could not be loaded.
            </p>
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

  // ====================
  // Page Layout
  // ====================

  return (
    <main className="app-page">
      <div className="app-container">
        <Link href="/contacts" className="text-blue-700 font-semibold">
          ← Back to Contacts
        </Link>

        {/* Profile Card */}
        <section className="app-panel-pad">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="app-eyebrow">
                Contact Profile
              </p>

              <h1 className="app-title">
                {contact.organization_name || "Unknown Organization"}
              </h1>

              <p className="app-subtitle">
                {contact.contact_name || "No primary contact"}
                {contact.contact_role ? `, ${contact.contact_role}` : ""}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {contact.type || "No type"}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                    contact.status
                  )}`}
                >
                  {contact.status || "No status"}
                </span>
              </div>
            </div>

            <button
              onClick={showEditForm ? cancelContactEdit : startContactEdit}
              className="app-button-primary"
            >
              {showEditForm ? "Close Edit Contact" : "Edit Contact"}
            </button>
          </div>

          {showEditForm ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mt-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Edit Contact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Organization
                  </label>

                  <input
                    className="app-input py-2"
                    value={contact.organization_name || ""}
                    onChange={(e) => {
                      setContact({
                        ...contact,
                        organization_name: e.target.value,
                      });
                      setErrors({ ...errors, organizationName: "" });
                    }}
                  />

                  {errors.organizationName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.organizationName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Contact Name
                  </label>

                  <input
                    className="app-input py-2"
                    value={contact.contact_name || ""}
                    onChange={(e) => {
                      setContact({ ...contact, contact_name: e.target.value });
                      setErrors({ ...errors, contactName: "" });
                    }}
                  />

                  {errors.contactName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.contactName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Role
                  </label>

                  <input
                    className="app-input py-2"
                    value={contact.contact_role || ""}
                    onChange={(e) =>
                      setContact({ ...contact, contact_role: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Phone
                  </label>

                  <input
                    className="app-input py-2"
                    inputMode="numeric"
                    value={contact.phone || ""}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        phone: formatPhoneNumber(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    className="app-input py-2"
                    value={contact.email || ""}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Type
                  </label>

                  <select
                    className="app-input py-2"
                    value={contact.type || ""}
                    onChange={(e) =>
                      setContact({ ...contact, type: e.target.value })
                    }
                  >
                    <option value="">Select type</option>
                    <option>School</option>
                    <option>Church</option>
                    <option>Sports</option>
                    <option>Business</option>
                    <option>Event</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Status
                  </label>

                  <select
                    className="app-input py-2"
                    value={contact.status || ""}
                    onChange={(e) =>
                      setContact({ ...contact, status: e.target.value })
                    }
                  >
                    <option value="">Select status</option>
                    <option>Active</option>
                    <option>Prospect</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Last Contacted
                  </label>

                  <input
                    type="date"
                    className="app-input py-2"
                    value={contact.last_contacted_date || ""}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        last_contacted_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Next Follow-Up
                  </label>

                  <input
                    type="date"
                    className="app-input py-2"
                    value={contact.next_follow_up_date || ""}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        next_follow_up_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Notes
                  </label>

                  <textarea
                    className="app-input min-h-28 py-2"
                    value={contact.notes || ""}
                    maxLength={500}
                    onChange={(e) =>
                      setContact({ ...contact, notes: e.target.value })
                    }
                  />

                  <p className="text-sm text-slate-500 mt-1">
                    {(contact.notes || "").length}/500 characters
                  </p>
                </div>
              </div>

              <button
                onClick={saveContact}
                className="mt-6 app-button-primary"
              >
                Save Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Primary Contact</p>
                  <p className="font-semibold text-slate-900">
                    {contact.contact_name || "No contact"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {contact.contact_role || "No role"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-semibold text-slate-900">
                    {contact.phone || "No phone"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900 break-words">
                    {contact.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Follow-Up</p>
                <div className="grid gap-3 mt-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Last Contacted
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatDate(contact.last_contacted_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Next Follow-Up
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatDate(contact.next_follow_up_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Notes Card */}
        <section className="app-panel-pad">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Notes</h2>

          <p className="text-slate-700 whitespace-pre-wrap">
            {contact.notes || "No notes added for this contact."}
          </p>
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
