"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck, Sparkles, Vote } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import { useAuth } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/api";
import { dayMonth, longDate } from "@/lib/format";
import type { StudentDashboard } from "@/lib/types";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    getStudentDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "We could not load your dashboard."));
  };
  useEffect(load, []);

  const first = user?.name.split(" ")[0];

  return (
    <>
      <header className="welcome">
        <div>
          <h1>Welcome back, {first}</h1>
          <p>Here is what needs your attention this week.</p>
        </div>
        {data && (
          <div className="engage">
            <ScoreRing value={data.engagementScore} unit="%" label={`Overall engagement ${data.engagementScore} percent`} />
            <div>
              <b>Overall engagement</b>
              <span>Polls, quizzes and events combined</span>
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="empty">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={load}>Try again</button>
        </div>
      )}

      {!data && !error && (
        <div className="grid" aria-busy="true" aria-label="Loading dashboard">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
        </div>
      )}

      {data && (
        <div className="grid">
          <section className="widget" aria-labelledby="w-poll">
            <div className="widget-head">Active poll <span className="ico"><Vote size={18} /></span></div>
            {data.activePoll ? (
              <>
                <h2 id="w-poll">{data.activePoll.title}</h2>
                <p className="meta">Closes {longDate(data.activePoll.expiresOn)}</p>
                <Link href="/polls" className="btn btn-primary">Vote now</Link>
              </>
            ) : (
              <>
                <h2 id="w-poll">You are all caught up</h2>
                <p className="meta">You have voted in every open poll.</p>
                <Link href="/polls" className="btn">See poll results</Link>
              </>
            )}
          </section>

          <section className="widget" aria-labelledby="w-asm">
            <div className="widget-head">Assessment <span className="ico"><ClipboardCheck size={18} /></span></div>
            {data.assessment ? (
              <>
                <h2 id="w-asm">{data.assessment.title}</h2>
                <p className="meta">{data.assessment.questions} questions, {data.assessment.minutes} minutes</p>
                <Link href="/assessments" className="btn btn-primary">Start quiz</Link>
              </>
            ) : (
              <>
                <h2 id="w-asm">No assessments open</h2>
                <p className="meta">New assessments will appear here.</p>
              </>
            )}
          </section>

          <section className="widget" aria-labelledby="w-career">
            <div className="widget-head">Career score <span className="ico"><Sparkles size={18} /></span></div>
            {data.career ? (
              <>
                <div className="event-row">
                  <ScoreRing value={data.career.score} label={`Career score ${data.career.score} out of 100`} color="var(--amber)" size={72} />
                  <div>
                    <h2 id="w-career">{data.career.score} / 100</h2>
                    <span className={`pill ${data.career.score >= 80 ? "pill-green" : "pill-amber"}`}>{data.career.label}</span>
                  </div>
                </div>
                {data.career.weakest && <p className="meta">Focus next on: {data.career.weakest}</p>}
                <Link href="/career" className="btn">See insights</Link>
              </>
            ) : (
              <>
                <h2 id="w-career">Find out where you stand</h2>
                <p className="meta">A 6 question quiz gives you a career readiness score.</p>
                <Link href="/career/quiz" className="btn btn-primary">Take the quiz</Link>
              </>
            )}
          </section>

          <section className="widget" aria-labelledby="w-event">
            <div className="widget-head">Upcoming event <span className="ico"><CalendarDays size={18} /></span></div>
            {data.event ? (
              <>
                <div className="event-row">
                  <span className="date-badge" aria-hidden="true">
                    {dayMonth(data.event.date).day}<span>{dayMonth(data.event.date).mon}</span>
                  </span>
                  <div>
                    <h2 id="w-event">{data.event.title}</h2>
                    <p className="meta">{data.event.location}</p>
                  </div>
                </div>
                <Link href={`/events/${data.event.id}`} className="btn">View event</Link>
              </>
            ) : (
              <>
                <h2 id="w-event">No upcoming events</h2>
                <p className="meta">Check back soon for new events.</p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
