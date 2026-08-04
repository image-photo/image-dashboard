"use client";

/*
=========================================
Customers Table

A table showing all entered customers.
=========================================
*/

// Imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeedbackModal from "@/components/feedback-modal";

// Types
type Customer = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type Feedback = {
  title: string;
  message: string;
  tone?: "success" | "error";
};

// ====================
// COMPONENTS
// ====================

export default function CustomersPage() {
  //States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const router = useRouter();

  useEffect(() => {
    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name, phone")
        .order("last_name", { ascending: true });
      
      if (error) {
        setFeedback({
          title: "Customers Load Failed",
          message: error.message,
        });
        return;
      }

      setCustomers(data || []);
    };
    
    loadCustomers();
  }, []); 

  // Helpers
  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();

    return (
      customer.first_name?.toLowerCase().includes(search) ||
      customer.last_name?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    );
  });

  // ====================
  // PAGE LAYOUT
  // ====================

  return (
    <main className="app-page">
      
      <div className="app-container">
        
        {/*Header*/}
        <div className="app-header">
          <div>
            <p className="app-eyebrow">
              Customer Directory
            </p>

            <h1 className="app-title">
              Customers
            </h1>

            <p className="app-subtitle">
              Search and view customer records.
            </p>
          </div>

          <Link
            href="/new-work-order"
            className="app-button-primary"
          >
            + New Work Order
          </Link>
        </div>
        
        {/*Search Bar*/}
        <input
          className="app-input"
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/*Table*/}
        <section className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-sm font-semibold">Last Name</th>
                <th className="p-4 text-sm font-semibold">First Name</th>
                <th className="p-4 text-sm font-semibold">Phone</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => {
                    router.push(`/customers/${customer.id}`);
                  }}
                  className="border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-slate-900 font-medium">
                    {customer.last_name || "—"}
                  </td>

                  <td className="p-4 text-slate-900">
                    {customer.first_name || "—"}
                  </td>

                  <td className="p-4 text-slate-700">
                    {customer.phone || "No phone"}
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No customers found.
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
