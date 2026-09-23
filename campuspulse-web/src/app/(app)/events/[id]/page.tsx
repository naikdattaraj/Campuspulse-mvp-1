"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin } from "lucide-react";
import { getEvent, registerForEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { longDate, timeLabel } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getEvent(id).then(setEvent).catch((e) => setError(e instanceof Error ? e.message : "We could not load this event."));
  }, [id]);

  const register = async () => {
    setBusy(true);
    setError("");
    try {
      setEvent(await registerForEvent(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/events" className="back-link"><ArrowLeft size={16} /> All events</Link>

      {!event && !error && <div className="skeleton" aria-busy="true" />}
      {error && <div className="form-error" role="alert">{error}</div>}

      {event && (
        <article className="card">
          <div className="poll-head">
            <h1 style={{ fontSize: 28 }}>{event.title}</h1>
            {event.registered ? <span className="pill pill-green">Registered</span> : <span className="pill pill-blue">Open</span>}
          </div>

          <div className="detail-list">
            <div><CalendarDays size={18} aria-hidden="true" /> {longDate(event.date)}</div>
            <div><Clock size={18} aria-hidden="true" /> {timeLabel(event.time)}</div>
            <div><MapPin size={18} aria-hidden="true" /> {event.location}</div>
          </div>

          {event.description && <p style={{ marginBottom: 24 }}>{event.description}</p>}

          {user?.role === "student" &&
            (event.registered ? (
              <p className="ok" role="status"><Check size={16} style={{ verticalAlign: "-3px" }} /> You are registered for this event.</p>
            ) : (
              <button className="btn btn-primary" onClick={register} disabled={busy}>{busy ? "Registering…" : "Register"}</button>
            ))}
          {user?.role === "admin" && <p className="muted">{event.registrations} students registered.</p>}
        </article>
      )}
    </div>
  );
}
