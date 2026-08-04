"use client";

/*
=========================================
New Contact Page
=========================================
*/

// Imports
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FeedbackModal from "@/components/feedback-modal";

// Types
type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

export default function NewContactPage() {
  const router = useRouter();

  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Active");
  const [lastContactedDate, setLastContactedDate] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

  const saveContact = async () => {
    if (isSaving) return;

    const newErrors = {
      organizationName: "",
      contactName: "",
    };

    if (!organizationName.trim()) {
      newErrors.organizationName = "Organization is required";
    }

    if (!contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }

    setErrors(newErrors);

    if (newErrors.organizationName || newErrors.contactName) {
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          organization_name: organizationName.trim(),
          contact_name: contactName.trim(),
          contact_role: contactRole.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          type: type || null,
          status: status || null,
          last_contacted_date: lastContactedDate || null,
          next_follow_up_date: nextFollowUpDate || null,
          notes: notes.trim() || null,
        },
      ])
      .select("id")
      .single();

    setIsSaving(false);

    if (error) {
      setFeedback({
        title: "Contact Save Failed",
        message: error.message,
      });
      return;
    }

    router.push(`/contacts/${data.id}`);
  };

  // ====================
  // Page Layout
  // ====================

  return (
    <main className="app-page">
      <div className="app-container-narrow">
        <Link href="/contacts" className="text-blue-700 font-semibold">
          ← Back to Contacts
        </Link>

        <section className="app-header">
          <div>
            <p className="app-eyebrow">
              Contact Directory
            </p>

            <h1 className="app-title">New Contact</h1>

            <p className="app-subtitle">
              Add a school, church, team, business, or event contact.
            </p>
          </div>
        </section>

        <section className="app-panel-pad">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Organization
              </label>

              <input
                className="app-input"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
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
                className="app-input"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
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
                className="app-input"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Phone
              </label>

              <input
                className="app-input"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Email
              </label>

              <input
                type="email"
                className="app-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Type
              </label>

              <select
                className="app-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                className="app-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
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
                className="app-input"
                value={lastContactedDate}
                onChange={(e) => setLastContactedDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Next Follow-Up
              </label>

              <input
                type="date"
                className="app-input"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Notes
              </label>

              <textarea
                className="app-input min-h-32"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />

              <p className="text-sm text-slate-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>
          </div>

          <button
            onClick={saveContact}
            disabled={isSaving}
            className="mt-6 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white px-4 py-3 rounded-xl font-semibold"
          >
            {isSaving ? "Saving Contact..." : "Save Contact"}
          </button>
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
