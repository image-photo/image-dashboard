"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Briefcase, Search, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/logout-button";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type SearchResult = {
  href: string;
  label: string;
  detail: string;
  group: "Customers" | "Contacts" | "Jobs";
};

type CustomerResult = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type ContactResult = {
  id: number;
  organization_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
};

type JobResult = {
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

const getTodayString = () => {
  return new Date().toISOString().slice(0, 10);
};

const getWeekString = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

const isActiveJob = (job: JobResult) => {
  return (
    job.status !== "Done" &&
    job.status !== "Canceled" &&
    job.status !== "Archived"
  );
};

export default function Topbar() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [myJobs, setMyJobs] = useState<JobResult[]>([]);
  const [notifications, setNotifications] = useState<JobResult[]>([]);
  const [openMenu, setOpenMenu] = useState<
    "search" | "jobs" | "notifications" | "profile" | null
  >(null);

  useEffect(() => {
    const loadTopbarData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: jobsData } = await supabase
        .from("work_orders")
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
        .order("due_date", { ascending: true })
        .limit(50);

      const jobs = ((jobsData || []) as unknown as JobResult[]).filter(isActiveJob);
      const today = getTodayString();
      const week = getWeekString();

      setMyJobs(jobs.filter((job) => job.assigned_user_id === user.id).slice(0, 6));
      setNotifications(
        jobs
          .filter((job) => job.due_date && job.due_date >= today && job.due_date <= week)
          .slice(0, 6)
      );
    };

    loadTopbarData();
  }, []);

  useEffect(() => {
    const search = searchTerm.trim();

    if (search.length < 2) {
      return;
    }

    const cleanedSearch = search.replace(/[,%()]/g, " ").trim();

    if (cleanedSearch.length < 2) {
      return;
    }

    const searchTerms = cleanedSearch
      .split(/\s+/)
      .filter((term) => term.length >= 2);
    const customerSearch = searchTerms[0] || cleanedSearch;

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);

      const [customersResponse, contactsResponse, jobsResponse] =
        await Promise.all([
          supabase
            .from("customers")
            .select("id, first_name, last_name, phone")
            .or(
              `first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%,phone.ilike.%${cleanedSearch}%`
            )
            .limit(20),
          supabase
            .from("contacts")
            .select("id, organization_name, contact_name, phone, email")
            .or(
              `organization_name.ilike.%${cleanedSearch}%,contact_name.ilike.%${cleanedSearch}%,phone.ilike.%${cleanedSearch}%,email.ilike.%${cleanedSearch}%`
            )
            .limit(5),
          supabase
            .from("work_orders")
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
            .or(
              `project_type.ilike.%${cleanedSearch}%,status.ilike.%${cleanedSearch}%,description.ilike.%${cleanedSearch}%`
            )
            .limit(5),
        ]);

      const customerResults = ((customersResponse.data || []) as CustomerResult[])
        .filter((customer) => {
          const fullName = `${customer.first_name || ""} ${
            customer.last_name || ""
          }`
            .toLowerCase()
            .trim();
          const phone = (customer.phone || "").toLowerCase();

          return searchTerms.every(
            (term) =>
              fullName.includes(term.toLowerCase()) ||
              phone.includes(term.toLowerCase())
          );
        })
        .slice(0, 5)
        .map((customer) => ({
          href: `/customers/${customer.id}`,
          label: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Unnamed Customer",
          detail: customer.phone || "Customer record",
          group: "Customers" as const,
        }));

      const contactResults = ((contactsResponse.data || []) as ContactResult[]).map(
        (contact) => ({
          href: `/contacts/${contact.id}`,
          label: contact.organization_name || "Unknown Organization",
          detail:
            [contact.contact_name, contact.phone || contact.email]
              .filter(Boolean)
              .join(" • ") || "Contact record",
          group: "Contacts" as const,
        })
      );

      const jobResults = ((jobsResponse.data || []) as unknown as JobResult[]).map(
        (job) => ({
          href: `/work-orders/${job.id}`,
          label: `WO-${String(job.id).padStart(6, "0")}`,
          detail:
            [
              job.customers
                ? `${job.customers.first_name || ""} ${job.customers.last_name || ""}`.trim()
                : null,
              job.project_type,
              job.status,
            ]
              .filter(Boolean)
              .join(" • ") || "Job record",
          group: "Jobs" as const,
        })
      );

      setSearchResults([...customerResults, ...contactResults, ...jobResults]);
      setIsSearching(false);
      setOpenMenu("search");
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const groupedResults = useMemo(() => {
    return searchResults.reduce<Record<SearchResult["group"], SearchResult[]>>(
      (groups, result) => ({
        ...groups,
        [result.group]: [...groups[result.group], result],
      }),
      {
        Customers: [],
        Contacts: [],
        Jobs: [],
      }
    );
  }, [searchResults]);

  const openResult = (href: string) => {
    setSearchTerm("");
    setSearchResults([]);
    setOpenMenu(null);
    router.push(href);
  };

  const renderJobLine = (job: JobResult) => {
    const customerName = job.customers
      ? `${job.customers.first_name || ""} ${job.customers.last_name || ""}`.trim()
      : "";

    return (
      <Link
        key={job.id}
        href={`/work-orders/${job.id}`}
        onClick={() => setOpenMenu(null)}
        className="block px-4 py-3 hover:bg-blue-50"
      >
        <p className="font-semibold text-slate-900">
          WO-{String(job.id).padStart(6, "0")}
        </p>
        <p className="text-sm text-slate-500">
          {[customerName, job.project_type, job.due_date].filter(Boolean).join(" • ")}
        </p>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900"
            placeholder="Search customers, contacts, or jobs..."
            value={searchTerm}
            onFocus={() => {
              if (searchResults.length) setOpenMenu("search");
            }}
            onChange={(event) => {
              const value = event.target.value;

              setSearchTerm(value);

              if (value.trim().length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                setOpenMenu(null);
              }
            }}
          />

          {openMenu === "search" && searchTerm.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-12 bg-white border rounded-xl shadow-lg overflow-hidden">
              {isSearching ? (
                <p className="p-4 text-slate-500">Searching...</p>
              ) : searchResults.length ? (
                <div className="max-h-96 overflow-auto">
                  {Object.entries(groupedResults).map(([group, results]) =>
                    results.length ? (
                      <div key={group} className="border-b last:border-b-0">
                        <p className="bg-slate-50 px-4 py-2 text-xs font-bold uppercase text-slate-500">
                          {group}
                        </p>

                        {results.map((result) => (
                          <button
                            key={result.href}
                            onClick={() => openResult(result.href)}
                            className="block w-full text-left px-4 py-3 hover:bg-blue-50"
                          >
                            <p className="font-semibold text-slate-900">
                              {result.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {result.detail}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="p-4 text-slate-500">No results found.</p>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "notifications" ? null : "notifications")
              }
              className="relative border rounded-xl p-2.5 text-slate-700 hover:bg-blue-50"
              title="Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 bg-red-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {openMenu === "notifications" && (
              <div className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-lg overflow-hidden">
                <p className="bg-slate-50 px-4 py-2 text-xs font-bold uppercase text-slate-500">
                  Due Soon
                </p>

                {notifications.length ? (
                  notifications.map(renderJobLine)
                ) : (
                  <p className="p-4 text-slate-500">No upcoming job alerts.</p>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === "jobs" ? null : "jobs")}
              className="border rounded-xl p-2.5 text-slate-700 hover:bg-blue-50"
              title="My Jobs"
            >
              <Briefcase size={20} />
            </button>

            {openMenu === "jobs" && (
              <div className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-lg overflow-hidden">
                <p className="bg-slate-50 px-4 py-2 text-xs font-bold uppercase text-slate-500">
                  My Jobs
                </p>

                {myJobs.length ? (
                  myJobs.map(renderJobLine)
                ) : (
                  <p className="p-4 text-slate-500">No active jobs assigned to you.</p>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
              className="flex items-center gap-2 border rounded-xl px-3 py-2 text-slate-700 hover:bg-blue-50"
            >
              <UserCircle size={22} />
              <span className="hidden lg:block text-sm font-semibold">
                {profile?.full_name || "Profile"}
              </span>
            </button>

            {openMenu === "profile" && (
              <div className="absolute right-0 top-12 w-64 bg-white border rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <p className="font-semibold text-slate-900">
                    {profile?.full_name || "Signed in"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {profile?.role || "Studio user"}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setOpenMenu(null)}
                  className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
                >
                  Settings
                </Link>

                <div className="px-4 py-3 border-t">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
