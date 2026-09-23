"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();

  // Route guard: signed out -> login; student on an admin page -> student home.
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role === "student" && path.startsWith("/admin")) router.replace("/dashboard");
    else if (user.role === "admin" && path === "/dashboard") router.replace("/admin");
  }, [ready, user, path, router]);

  if (!ready || !user) return <div className="center-screen">Loading…</div>;

  return (
    <>
      <Navbar />
      <div className="shell">
        <Sidebar />
        <main className="main" id="content">{children}</main>
      </div>
    </>
  );
}
