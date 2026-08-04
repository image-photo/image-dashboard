"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/logout-button";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  Settings,
  Plus,
  Building2,
  X,
} from "lucide-react";

const links = [
  { 
    href: "/", 
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { 
    href: "/customers", 
    label: "Clients",
    icon: Users,
  },
  { 
    href: "/work-orders", 
    label: "Jobs",
    icon: Briefcase,
  },
  { 
    href: "/contacts", 
    label: "Contacts",
    icon: Building2,
  },
  { 
    href: "/calendar", 
    label: "Calendar",
    icon: CalendarDays,
  },
  { 
    href: "/settings", 
    label: "Settings",
    icon: Settings,
  },
];

type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

export default function Sidebar({
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (showCloseButton: boolean) => (
    <div className="flex h-full flex-col p-6">
      <div className="mb-8 flex items-center gap-3">
        <Image
          src="/icon_logo.png"
          alt="Studio Logo"
          width={40}
          height={40}
          className="rounded-lg"
        />

        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">
            Studio
          </h1>

          <p className="text-xs text-slate-500">
            Workflow System
          </p>
        </div>

        {showCloseButton && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="grid flex-1 content-start gap-3">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={showCloseButton ? onMobileClose : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}

        <Link
          href="/new-work-order"
          onClick={showCloseButton ? onMobileClose : undefined}
          className={`rounded-xl px-3 py-2 text-center font-semibold transition-colors ${
            pathname === "/new-work-order"
              ? "bg-blue-800 text-white"
              : "bg-blue-700 hover:bg-blue-800 text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Plus size={18} />
            New Work Order
          </span>
        </Link>
      </nav>

      <div className="mt-8 border-t pt-4">
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white lg:block">
        {sidebarContent(false)}
      </aside>

      {isMobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation"
          />

          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] border-r bg-white shadow-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
}
