"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { notifications } from "@/lib/mockData";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState<"bell" | "profile" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="navbar">
      <Logo tag={user.role === "admin" ? "Admin" : undefined} />
      <div className="nav-actions" ref={ref}>
        <button
          className="icon-btn"
          aria-label={`Notifications, ${notifications.length} new`}
          aria-expanded={open === "bell"}
          onClick={() => setOpen(open === "bell" ? null : "bell")}
        >
          <Bell size={20} />
          <span className="badge-dot" aria-hidden="true" />
        </button>

        <button
          className="profile-btn"
          aria-label="Profile menu"
          aria-expanded={open === "profile"}
          onClick={() => setOpen(open === "profile" ? null : "profile")}
        >
          <span className="avatar" aria-hidden="true">{initials}</span>
          <span className="who">{user.name.split(" ")[0]}</span>
        </button>

        {open === "bell" && (
          <div className="menu" role="menu">
            <h3>Notifications</h3>
            {notifications.map((n) => (
              <div key={n.id} className="menu-item" role="menuitem">
                {n.text}
                <small>{n.time}</small>
              </div>
            ))}
          </div>
        )}

        {open === "profile" && (
          <div className="menu" role="menu">
            <div className="menu-head">
              <b>{user.name}</b>
              <br />
              <small>{user.email} ({user.role})</small>
            </div>
            <button
              className="menu-item"
              role="menuitem"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
