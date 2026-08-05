"use client";

/*
=========================================
Contacts Table
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FeedbackModal from "@/components/feedback-modal";
import Link from "next/link";
import TablePagination from "@/components/table-pagination";

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
  });
};

// ====================
// Components
// ====================

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const router = useRouter();

  useEffect(() => {
    const loadContacts = async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(
          "id, organization_name, contact_name, contact_role, phone, email, street_address, city, state, zip_code, type, status, last_contacted_date, next_follow_up_date, notes"
        )
        .order("organization_name", { ascending: true });

      if (error) {
        setFeedback({
          title: "Contacts Load Failed",
          message: error.message,
        });
        return;
      }

      setContacts(data || []);
    };

    loadContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      contact.organization_name,
      contact.contact_name,
      contact.contact_role,
      contact.phone,
      contact.email,
      contact.street_address,
      contact.city,
      contact.state,
      contact.zip_code,
      contact.type,
      contact.status,
      contact.last_contacted_date,
      contact.next_follow_up_date,
      contact.notes,
    ].some((value) => value?.toLowerCase().includes(search));
  });

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ====================
  // Page Layout
  // ====================

  return (
    <main className="app-page">
      <div className="app-container">
        {/* Header */}
        <div className="app-header">
          <div>
            <p className="app-eyebrow">
              School & Event Photography
            </p>

            <h1 className="app-title">Contacts</h1>

            <p className="app-subtitle">
              Search and view schools, churches, teams, and event contacts.
            </p>
          </div>

          <Link
            href="/contacts/new"
            className="app-button-primary"
          >
            + New Contact
          </Link>
        </div>

        {/* Search Bar */}
        <input
          className="app-input"
          placeholder="Search organizations, contacts, email, phone, or notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* Contacts Table */}
        <section className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-sm font-semibold">Organization</th>
                <th className="p-4 text-sm font-semibold">Contact</th>
                <th className="p-4 text-sm font-semibold">Role</th>
                <th className="p-4 text-sm font-semibold">Type</th>
                <th className="p-4 text-sm font-semibold">Status</th>
                <th className="p-4 text-sm font-semibold">Follow-Up</th>
              </tr>
            </thead>

            <tbody>
              {paginatedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-slate-900 font-medium">
                    {contact.organization_name || "Unknown organization"}
                  </td>

                  <td className="p-4 text-slate-700">
                    {contact.contact_name || "No contact"}
                  </td>

                  <td className="p-4 text-slate-700">
                    {contact.contact_role || "No role"}
                  </td>

                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                      {contact.type || "No type"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                        contact.status
                      )}`}
                    >
                      {contact.status || "No status"}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700 whitespace-nowrap">
                    {formatDate(contact.next_follow_up_date)}
                  </td>
                </tr>
              ))}

              {filteredContacts.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={6}>
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            itemLabel="contacts"
            pageSize={pageSize}
            totalItems={filteredContacts.length}
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
