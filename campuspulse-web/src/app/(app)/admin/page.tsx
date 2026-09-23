"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
import { getAdminDashboard } from "@/lib/api";

type Data = Awaited<ReturnType<typeof getAdminDashboard>>;

export default function AdminPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    getAdminDashboard().then(setData).catch(() => setError("We could not load the analytics."));
  };
  useEffect(load, []);

  return (
    <>
      <header className="welcome">
        <div>
          <h1>Admin panel</h1>
          <p>Engagement across the campus at a glance.</p>
        </div>
      </header>

      {error && (
        <div className="empty">
          <h2>Analytics unavailable</h2>
          <p>{error} Check your connection and try again.</p>
          <button className="btn btn-primary" onClick={load}>Try again</button>
        </div>
      )}

      {!data && !error && <div className="skeleton" aria-busy="true" aria-label="Loading analytics" />}

      {data && (
        <>
          <div className="stats">
            <div className="stat"><span>Total students</span><b>{data.totalStudents.toLocaleString("en-IN")}</b></div>
            <div className="stat"><span>Average engagement</span><b>{data.avgEngagement}%</b></div>
            <div className="stat"><span>Active polls</span><b>{data.activePolls}</b></div>
          </div>

          <h2 className="section-title">Quick actions</h2>
          <div className="actions">
            <Link href="/polls" className="btn btn-primary"><Plus size={16} /> Create poll</Link>
            <Link href="/events" className="btn"><CalendarPlus size={16} /> Create event</Link>
          </div>

          <h2 className="section-title">Analytics overview</h2>
          <div className="bars">
            {data.analytics.map((a) => (
              <div key={a.label}>
                <div className="bar-top"><span>{a.label}</span><span>{a.value}%</span></div>
                <div className="track" role="progressbar" aria-label={a.label} aria-valuenow={a.value} aria-valuemin={0} aria-valuemax={100}>
                  <div className="fill" style={{ width: `${a.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
