"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ClipboardCheck, LayoutDashboard, Target, Vote } from "lucide-react";
import { useAuth } from "@/lib/auth";

const student = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/polls", label: "Polls", icon: Vote },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/career", label: "Career score", icon: Target },
  { href: "/events", label: "Events", icon: CalendarDays },
];

const admin = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/polls", label: "Polls", icon: Vote },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export default function Sidebar() {
  const { user } = useAuth();
  const path = usePathname();
  const items = user?.role === "admin" ? admin : student;

  return (
    <aside className="sidebar">
      <nav aria-label="Main">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="nav-link" aria-current={path === href ? "page" : undefined}>
            <Icon size={19} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
