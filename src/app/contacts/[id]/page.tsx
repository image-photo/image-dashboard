"use client";

/*
=========================================
Individual Contact Page
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";
import { Trash2 } from "lucide-react";

// Types
type Contact = {
  id: number;
  organization_name: string | null;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
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
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [savedContact, setSavedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
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

  const formatZipCode = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  useEffect(() => {
    const loadContact = async () => {
      setIsLoading(true);

      const contactId = Number(id);

      if (!Number.isInteger(contactId)) {
        setFeedback({
          title: "Contact Load Failed",
          message: "The contact ID is invalid.",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
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

    const organizationName = contact.organization_name?.trim() || "";
    const contactName = contact.contact_name?.trim() || "";

    const newErrors = {
      organizationName: "",
      contactName: "",
    };

    if (!organizationName) {
      newErrors.organizationName = "Organization is required";
    }

    if (!contactName) {
      newErrors.contactName = "Contact name is required";
    }

    setErrors(newErrors);

    if (newErrors.organizationName || newErrors.contactName) {
      return;
    }

    const { error } = await supabase
      .from("contacts")
      .update({
        organization_name: organizationName,
        contact_name: contactName,
        contact_role: contact.contact_role,
        phone: contact.phone,
        email: contact.email,
        street_address: contact.street_address,
        city: contact.city,
        state: contact.state,
        zip_code: contact.zip_code,
        type: contact.type,
        status: contact.status || "Active",
        last_contacted_date: contact.last_contacted_date || null,
        next_follow_up_date: contact.next_follow_up_date || null,
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

  const startNotesEdit = () => {
    if (!contact) return;

    setNotesDraft(contact.notes || "");
    setShowNotesForm(true);
  };

  const cancelNotesEdit = () => {
    setNotesDraft("");
    setShowNotesForm(false);
  };

  const saveNotes = async () => {
    if (!contact || isSavingNotes) return;

    setIsSavingNotes(true);
    const updatedNotes = notesDraft.trim() || null;

    const { error } = await supabase
      .from("contacts")
      .update({ notes: updatedNotes })
      .eq("id", contact.id)
      .select("id")
      .single();

    setIsSavingNotes(false);

    if (error) {
      setFeedback({
        title: "Notes Update Failed",
        message: error.message,
      });
      return;
    }

    setContact({ ...contact, notes: updatedNotes });
    setNotesDraft("");
    setShowNotesForm(false);
    setFeedback({
      title: "Notes Updated",
      message: "The contact notes have been saved successfully.",
      tone: "success",
    });
  };

  const deleteContact = async () => {
    if (!contact || isDeleting) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contact.id)
      .select("id")
      .single();

    if (error) {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setFeedback({
        title: "Contact Delete Failed",
        message: error.message,
      });
      return;
    }

    router.replace("/contacts");
    router.refresh();
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

  const organizationName = contact.organization_name || "Unknown Organization";

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
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="app-eyebrow">
                Contact Profile
              </p>

              <h1 className="app-title">
                {organizationName}
              </h1>

              <p className="app-subtitle">
                Organization details, contact information, and follow-up.
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

            <div className="flex items-center gap-2">
              <button
                onClick={showEditForm ? cancelContactEdit : startContactEdit}
                className="app-button-primary"
              >
                {showEditForm ? "Close Edit Contact" : "Edit Contact"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                aria-label={`Delete ${organizationName}`}
                title="Delete Contact"
              >
                <Trash2 aria-hidden="true" size={20} strokeWidth={2.25} />
              </button>
            </div>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Street Address
                  </label>

                  <input
                    className="app-input py-2"
                    autoComplete="off"
                    value={contact.street_address || ""}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        street_address: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    City
                  </label>

                  <input
                    className="app-input py-2"
                    autoComplete="off"
                    value={contact.city || ""}
                    onChange={(e) =>
                      setContact({ ...contact, city: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    State
                  </label>

                  <select
                    className="app-input py-2"
                    autoComplete="off"
                    value={contact.state || ""}
                    onChange={(e) =>
                      setContact({ ...contact, state: e.target.value })
                    }
                  >
                    <option value="">Select state</option>
                    {usStates.map((stateCode) => (
                      <option key={stateCode} value={stateCode}>
                        {stateCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Zip
                  </label>

                  <input
                    className="app-input py-2"
                    inputMode="numeric"
                    autoComplete="off"
                    value={contact.zip_code || ""}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        zip_code: formatZipCode(e.target.value),
                      })
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

              </div>

              <button
                onClick={saveContact}
                className="mt-6 app-button-primary"
              >
                Save Contact
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-slate-200 pt-6 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Contact Person:
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.contact_name || "No contact"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">Role:</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.contact_role || "No role"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">Phone:</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.phone || "No phone"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">Email:</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-900">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      "No email"
                    )}
                  </dd>
                </div>

                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">
                    Street Address:
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.street_address || "No street address"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">City:</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.city || "No city"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">State:</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.state || "No state"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">Zip:</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {contact.zip_code || "No zip code"}
                  </dd>
                </div>
              </dl>

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Notes</h2>

            {!showNotesForm && (
              <button
                type="button"
                onClick={startNotesEdit}
                className="app-button-secondary"
              >
                + Add Notes
              </button>
            )}
          </div>

          {showNotesForm ? (
            <div className="mt-4">
              <label
                htmlFor="contact-notes"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Contact Notes
              </label>
              <textarea
                id="contact-notes"
                className="app-input min-h-32"
                value={notesDraft}
                maxLength={500}
                autoFocus
                onChange={(event) => setNotesDraft(event.target.value)}
              />
              <p className="mt-1 text-sm text-slate-500">
                {notesDraft.length}/500 characters
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="app-button-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSavingNotes ? "Saving Notes..." : "Save Notes"}
                </button>
                <button
                  type="button"
                  onClick={cancelNotesEdit}
                  disabled={isSavingNotes}
                  className="app-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-slate-700">
              {contact.notes || "No notes added for this contact."}
            </p>
          )}
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

      {showDeleteConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setShowDeleteConfirmation(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            aria-describedby="delete-contact-description"
          >
            <h2
              id="delete-contact-title"
              className="text-2xl font-bold text-slate-900"
            >
              Delete Contact?
            </h2>
            <p id="delete-contact-description" className="mt-2 text-slate-600">
              Would you like to permanently delete {organizationName}? This
              action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                className="app-button-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteContact}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" size={18} />
                {isDeleting ? "Deleting..." : "Delete Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
