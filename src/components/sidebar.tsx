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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r p-6">
      <div className="flex items-center gap-3 mb-8">
        <Image
          src="/icon_logo.png"
          alt="Studio Logo"
          width={40}
          height={40}
          className="rounded-lg"
        />

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Studio
          </h1>

          <p className="text-xs text-slate-500">
            Workflow System
          </p>
        </div>
      </div>

      <nav className="grid gap-3">
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
          className={`flex items-center gap-3 font-semibold px-3 py-2 rounded-xl transition-colors ${
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
          className={`px-3 py-2 rounded-xl font-semibold text-center transition-colors ${
            pathname === "/new-work-order"
              ? "bg-blue-800 text-white"
              : "bg-blue-700 hover:bg-blue-800 text-white"
          }`}
        >
        <div className="flex items-center justify-center gap-2">
          <Plus size={18} />
          New Work Order
        </div>
        </Link>
        
        <div className="mt-8 border-t pt-4">
          <LogoutButton />
        </div>

      </nav>
    </aside>
  );
}