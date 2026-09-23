"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { createEvent, getEvents, registerForEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dayMonth, timeLabel, todayISO } from "@/lib/format";
import type { EventItem } from "@/lib/types";

function CreateEventForm({ onCreated }: { onCreated: (e: EventItem) => void }) {
  const [f, setF] = useState({ title: "", date: "", time: "10:00", location: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (f.title.trim().length < 3) return setError("Enter the event title.");
    if (!f.date) return setError("Choose the event date.");
    if (f.location.trim().length < 2) return setError("Enter the event location.");
    setBusy(true);
    try {
      onCreated(await createEvent(f));
      setF({ title: "", date: "", time: "10:00", location: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The event was not created. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="create-event" style={{ marginBottom: 24 }}>
      <h2 id="create-event" style={{ fontSize: 20, marginBottom: 16 }}>Create event</h2>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="ev-title">Event title</label>
          <input id="ev-title" className="input" value={f.title} onChange={set("title")} />
        </div>
        <div className="field">
          <label htmlFor="ev-date">Date</label>
          <input id="ev-date" type="date" className="input" min={todayISO()} value={f.date} onChange={set("date")} />
        </div>
        <div className="field">
          <label htmlFor="ev-time">Time</label>
          <input id="ev-time" type="time" className="input" value={f.time} onChange={set("time")} />
        </div>
        <div className="field full">
          <label htmlFor="ev-loc">Location</label>
          <input id="ev-loc" className="input" value={f.location} onChange={set("location")} />
        </div>
        <div className="field full">
          <label htmlFor="ev-desc">Description</label>
          <textarea id="ev-desc" className="input" value={f.description} onChange={set("description")} />
        </div>
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Publishing…" : "Create event"}</button>
    </form>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pending, setPending] = useState("");

  const load = () => {
    setError("");
    getEvents().then(setEvents).catch((e) => setError(e instanceof Error ? e.message : "We could not load events."));
  };
  useEffect(load, []);

  const register = async (id: string) => {
    setPending(id);
    setToast("");
    try {
      const updated = await registerForEvent(id);
      setEvents((cur) => (cur ?? []).map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setPending("");
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Campus events</h1>
          <p>{isAdmin ? "Publish events for the whole campus." : "Find something to join and register in one tap."}</p>
        </div>
      </header>

      {toast && <div className="toast" role="status">{toast}</div>}

      {isAdmin && (
        <CreateEventForm
          onCreated={(e) => {
            setEvents((cur) => [...(cur ?? []), e].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
            setToast("Event created. It now appears in every student's feed.");
          }}
        />
      )}

      {error && (
        <div className="empty">
          <h2>Events unavailable</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={load}>Try again</button>
        </div>
      )}
      {!events && !error && <div className="skeleton" aria-busy="true" aria-label="Loading events" />}
      {events && events.length === 0 && (
        <div className="empty">
          <h2>No events yet</h2>
          <p>{isAdmin ? "Create the first event using the form above." : "New events will show up here."}</p>
        </div>
      )}

      <div className="events-grid">
        {events?.map((e) => {
          const d = dayMonth(e.date);
          return (
            <article key={e.id} className="card event-card">
              <div className="event-row">
                <span className="date-badge" aria-hidden="true">{d.day}<span>{d.mon}</span></span>
                <div>
                  <h2><Link href={`/events/${e.id}`}>{e.title}</Link></h2>
                  <p className="muted small">{timeLabel(e.time)}</p>
                </div>
              </div>
              <p className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <MapPin size={16} aria-hidden="true" /> {e.location}
              </p>
              <div className="actions-row">
                {!isAdmin &&
                  (e.registered ? (
                    <span className="pill pill-green"><Check size={13} style={{ verticalAlign: "-2px" }} /> Registered</span>
                  ) : (
                    <button className="btn btn-primary btn-sm" disabled={pending === e.id} onClick={() => register(e.id)}>
                      {pending === e.id ? "Registering…" : "Register"}
                    </button>
                  ))}
                {isAdmin && <span className="muted small">{e.registrations} registered</span>}
                <Link href={`/events/${e.id}`} className="btn btn-sm">Details</Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
