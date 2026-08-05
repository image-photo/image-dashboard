"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Briefcase, Menu, Search, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getLocalDateString,
  getLocalDateStringDaysFromNow,
} from "@/lib/dates";
import LogoutButton from "@/components/logout-button";
import { getSearchTerms, sanitizeSearchTerm } from "@/lib/search";

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
  description: string | null;
  status: string | null;
  assigned_user_id: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const isActiveJob = (job: JobResult) => {
  return (
    job.status !== "Done" &&
    job.status !== "Canceled" &&
    job.status !== "Archived"
  );
};

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [myJobs, setMyJobs] = useState<JobResult[]>([]);
  const [notifications, setNotifications] = useState<JobResult[]>([]);
  const [openMenu, setOpenMenu] = useState<
    "search" | "jobs" | "notifications" | "profile" | null
  >(null);
  const searchRequestId = useRef(0);

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
      const today = getLocalDateString();
      const week = getLocalDateStringDaysFromNow(7);

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
    const handleProfileUpdate = (event: Event) => {
      const { fullName } = (event as CustomEvent<{ fullName: string }>).detail;

      setProfile((currentProfile) =>
        currentProfile
          ? { ...currentProfile, full_name: fullName }
          : currentProfile
      );
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const cleanedSearch = sanitizeSearchTerm(searchTerm);
    const requestId = ++searchRequestId.current;

    if (cleanedSearch.length < 2) {
      return;
    }

    const searchTerms = getSearchTerms(cleanedSearch);
    const customerSearch = searchTerms[0] || cleanedSearch;
    const workOrderMatch = cleanedSearch.match(/^wo[-\s]?0*(\d+)$/i);
    const abortController = new AbortController();
    let isActive = true;

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      setOpenMenu("search");

      const jobsQuery = supabase
        .from("work_orders")
        .select(
          `
          id,
          due_date,
          project_type,
          description,
          status,
          assigned_user_id,
          customers (
            first_name,
            last_name
          )
        `
        );

      const jobsRequest = workOrderMatch
        ? jobsQuery.eq("id", Number(workOrderMatch[1])).limit(5)
        : jobsQuery
            .or(
              `project_type.ilike.%${customerSearch}%,status.ilike.%${customerSearch}%,description.ilike.%${customerSearch}%`
            )
            .limit(50);

      const [customersResponse, contactsResponse, jobsResponse] =
        await Promise.all([
          supabase
            .from("customers")
            .select("id, first_name, last_name, phone")
            .or(
              `first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%,phone.ilike.%${cleanedSearch}%`
            )
            .limit(50)
            .abortSignal(abortController.signal),
          supabase
            .from("contacts")
            .select("id, organization_name, contact_name, phone, email")
            .or(
              `organization_name.ilike.%${customerSearch}%,contact_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%`
            )
            .limit(50)
            .abortSignal(abortController.signal),
          jobsRequest.abortSignal(abortController.signal),
        ]);

      if (!isActive || requestId !== searchRequestId.current) return;

      const responseError =
        customersResponse.error || contactsResponse.error || jobsResponse.error;

      if (responseError) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchError("Search is temporarily unavailable. Please try again.");
        return;
      }

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

      const contactResults = ((contactsResponse.data || []) as ContactResult[])
        .filter((contact) => {
          const searchableContact = [
            contact.organization_name,
            contact.contact_name,
            contact.phone,
            contact.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchTerms.every((term) =>
            searchableContact.includes(term.toLowerCase())
          );
        })
        .slice(0, 5)
        .map((contact) => ({
          href: `/contacts/${contact.id}`,
          label: contact.organization_name || "Unknown Organization",
          detail:
            [contact.contact_name, contact.phone || contact.email]
              .filter(Boolean)
              .join(" • ") || "Contact record",
          group: "Contacts" as const,
        }));

      const jobResults = ((jobsResponse.data || []) as unknown as JobResult[])
        .filter((job) => {
          if (workOrderMatch) return true;

          const searchableJob = [
            job.customers?.first_name,
            job.customers?.last_name,
            job.project_type,
            job.description,
            job.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchTerms.every((term) =>
            searchableJob.includes(term.toLowerCase())
          );
        })
        .slice(0, 5)
        .map((job) => ({
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
        }));

      setSearchResults([...customerResults, ...contactResults, ...jobResults]);
      setIsSearching(false);
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
      abortController.abort();
    };
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
    setSearchError("");
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
    <header className="sticky top-0 z-30 border-b bg-white px-3 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border p-2.5 text-slate-700 hover:bg-blue-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="relative order-3 w-full sm:order-none sm:flex-1 sm:max-w-2xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900"
            placeholder="Search customers, contacts, or jobs..."
            value={searchTerm}
            onFocus={() => {
              if (searchResults.length || searchError) setOpenMenu("search");
            }}
            onChange={(event) => {
              const value = event.target.value;

              setSearchTerm(value);

              if (sanitizeSearchTerm(value).length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                setSearchError("");
                setOpenMenu(null);
              }
            }}
          />

          {openMenu === "search" && sanitizeSearchTerm(searchTerm).length >= 2 && (
            <div className="absolute left-0 right-0 top-12 bg-white border rounded-xl shadow-lg overflow-hidden">
              {isSearching ? (
                <p className="p-4 text-slate-500">Searching...</p>
              ) : searchError ? (
                <p className="p-4 text-red-700">{searchError}</p>
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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
              <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border bg-white shadow-lg">
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
              <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border bg-white shadow-lg">
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
              <div className="absolute right-0 top-12 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border bg-white shadow-lg">
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
