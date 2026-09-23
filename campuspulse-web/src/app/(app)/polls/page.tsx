"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createPoll, getPolls, votePoll } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { longDate, todayISO } from "@/lib/format";
import type { Poll } from "@/lib/types";

/* ---------- one poll: vote (student) or results ---------- */
function PollCard({ poll, canVote, onChange }: { poll: Poll; canVote: boolean; onChange: (p: Poll) => void }) {
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const showResults = !canVote || poll.expired || !!poll.myVoteId;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!choice) return setError("Choose an option before you submit.");
    setBusy(true);
    setError("");
    try {
      onChange(await votePoll(poll.id, choice));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your vote was not saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card" aria-labelledby={`poll-${poll.id}`}>
      <div className="poll-head">
        <h2 id={`poll-${poll.id}`}>{poll.title}</h2>
        {poll.expired ? <span className="pill pill-grey">Closed</span> : <span className="pill pill-blue">Open</span>}
      </div>
      <p className="muted small" style={{ marginTop: 4 }}>
        {poll.expired ? "Closed on" : "Expires on"} {longDate(poll.expiresOn)}
      </p>

      {!showResults ? (
        <form onSubmit={submit} noValidate>
          <fieldset className="choices">
            <legend className="sr-only" style={{ position: "absolute", left: -9999 }}>Choose one option</legend>
            {poll.options.map((o) => (
              <label key={o.id} className="choice">
                <input type="radio" name={`vote-${poll.id}`} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} />
                {o.label}
              </label>
            ))}
          </fieldset>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit vote"}</button>
        </form>
      ) : (
        <div className="results" aria-live="polite">
          {canVote && poll.myVoteId && <p className="ok small">Thanks, your vote is in. Live results:</p>}
          {poll.options.map((o) => (
            <div key={o.id}>
              <div className="result-top">
                <span>
                  {o.label}
                  {o.id === poll.myVoteId && <span className="mine">Your vote</span>}
                </span>
                <b>{o.percent}%</b>
              </div>
              <div className="track" role="progressbar" aria-label={o.label} aria-valuenow={o.percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="fill" style={{ width: `${o.percent}%` }} />
              </div>
            </div>
          ))}
          <p className="muted small">Total votes: {poll.totalVotes}</p>
        </div>
      )}
    </article>
  );
}

/* ---------- admin: create poll (US-05) ---------- */
function CreatePollForm({ onCreated }: { onCreated: (p: Poll) => void }) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresOn, setExpiresOn] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setOpt = (i: number, v: string) => setOptions(options.map((o, j) => (j === i ? v : o)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (title.trim().length < 5) return setError("Enter the poll question (at least 5 characters).");
    if (cleaned.length < 2) return setError("Add at least 2 options.");
    if (!expiresOn) return setError("Choose an expiration date.");
    setBusy(true);
    try {
      onCreated(await createPoll({ title: title.trim(), options: cleaned, expiresOn }));
      setTitle("");
      setOptions(["", ""]);
      setExpiresOn("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The poll was not created. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="create-poll">
      <h2 id="create-poll" style={{ fontSize: 20, marginBottom: 16 }}>Create poll</h2>
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="field">
        <label htmlFor="poll-title">Poll question</label>
        <input id="poll-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should we decide?" />
      </div>

      <div className="field">
        <span className="legend">Options</span>
        {options.map((o, i) => (
          <div className="option-row" key={i}>
            <input className="input" aria-label={`Option ${i + 1}`} value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
            {options.length > 2 && (
              <button type="button" className="icon-btn" aria-label={`Remove option ${i + 1}`} onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button type="button" className="btn btn-sm" style={{ justifySelf: "start" }} onClick={() => setOptions([...options, ""])}>
            <Plus size={16} /> Add option
          </button>
        )}
      </div>

      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="poll-exp">Expiration date</label>
        <input id="poll-exp" type="date" className="input" min={todayISO()} value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
      </div>

      <button className="btn btn-primary" disabled={busy}>{busy ? "Publishing…" : "Create poll"}</button>
    </form>
  );
}

/* ---------- page ---------- */
export default function PollsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = () => {
    setError("");
    getPolls().then(setPolls).catch((e) => setError(e instanceof Error ? e.message : "We could not load the polls."));
  };
  useEffect(load, []);

  const replace = (p: Poll) => setPolls((cur) => (cur ?? []).map((x) => (x.id === p.id ? p : x)));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Campus polls</h1>
          <p>{isAdmin ? "Publish polls and watch results come in." : "Vote once per poll and see live results."}</p>
        </div>
      </header>

      {toast && <div className="toast" role="status">{toast}</div>}

      <div className={isAdmin ? "two-col" : undefined} style={{ alignItems: "start" }}>
        <div className="stack">
          {error && (
            <div className="empty">
              <h2>Polls unavailable</h2>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={load}>Try again</button>
            </div>
          )}
          {!polls && !error && <div className="skeleton" aria-busy="true" aria-label="Loading polls" />}
          {polls && polls.length === 0 && (
            <div className="empty">
              <h2>No polls yet</h2>
              <p>{isAdmin ? "Create the first poll using the form." : "When a poll is published it will show up here."}</p>
            </div>
          )}
          {polls?.map((p) => <PollCard key={p.id} poll={p} canVote={!isAdmin} onChange={replace} />)}
        </div>

        {isAdmin && (
          <CreatePollForm
            onCreated={(p) => {
              setPolls((cur) => [p, ...(cur ?? [])]);
              setToast("Poll created. Students can see it now.");
            }}
          />
        )}
      </div>
    </>
  );
}
