"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ScoreRing from "@/components/ScoreRing";
import { getCareerResult } from "@/lib/api";
import { longDate } from "@/lib/format";
import { CAREER_LABELS, CAREER_WEIGHTS, CareerCategory, GAP_THRESHOLD } from "@/lib/scoring";
import type { CareerResult } from "@/lib/types";

const ORDER: CareerCategory[] = ["technical", "soft", "aptitude"];
const barClass = (v: number) => (v >= 80 ? "green" : v >= GAP_THRESHOLD + 10 ? "" : "red");

export default function CareerScorePage() {
  const [result, setResult] = useState<CareerResult | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    getCareerResult().then(setResult).catch((e) => setError(e instanceof Error ? e.message : "We could not load your score."));
  };
  useEffect(load, []);

  if (error) {
    return (
      <div className="empty">
        <h2>Score unavailable</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={load}>Try again</button>
      </div>
    );
  }
  if (result === undefined) return <div className="skeleton" aria-busy="true" aria-label="Loading score" />;

  if (result === null) {
    return (
      <div className="empty">
        <h2>You have no career score yet</h2>
        <p>Answer 6 short questions on technical skills, soft skills and aptitude to see how career ready you are.</p>
        <Link href="/career/quiz" className="btn btn-primary">Take the quiz</Link>
      </div>
    );
  }

  const tone = result.overall >= 80 ? "pill-green" : result.overall >= 60 ? "pill-amber" : "pill-red";

  return (
    <div style={{ maxWidth: 760 }} className="stack">
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>Career score and results</h1>
          <p>Taken on {longDate(result.takenOn)}</p>
        </div>
      </header>

      <section className="card score-hero" aria-label="Overall score">
        <ScoreRing value={result.overall} max={100} size={148} color="var(--primary)" label={`Career score ${result.overall} out of 100`} />
        <div>
          <h2>{result.overall} out of 100</h2>
          <span className={`pill ${tone}`}>{result.label}</span>
          {result.aheadOfPercent !== null && (
            <p className="muted" style={{ marginTop: 10 }}>You are ahead of {result.aheadOfPercent}% of students.</p>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="breakdown">
        <h2 id="breakdown" style={{ fontSize: 18, marginBottom: 16 }}>Score breakdown</h2>
        <div className="cat-bars">
          {ORDER.map((c) => (
            <div key={c}>
              <div className="result-top">
                <span>{CAREER_LABELS[c]}</span>
                <b>{result.categories[c]}%</b>
              </div>
              <div className="track" role="progressbar" aria-label={CAREER_LABELS[c]} aria-valuenow={result.categories[c]} aria-valuemin={0} aria-valuemax={100}>
                <div className={`fill ${barClass(result.categories[c])}`} style={{ width: `${result.categories[c]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="improve">
        <h2 id="improve" style={{ fontSize: 18 }}>Areas for improvement</h2>
        {result.gaps.length > 0 && (
          <p className="bad" style={{ marginTop: 8 }}>
            Skill gap: {result.gaps.map((g) => CAREER_LABELS[g]).join(", ")} {result.gaps.length > 1 ? "are" : "is"} below {GAP_THRESHOLD}%.
          </p>
        )}
        {result.improvements.length > 0 ? (
          <ul className="improve-list">
            {result.improvements.map((s) => <li key={s}>{s}</li>)}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>No weak spots this time. Keep it up.</p>
        )}
      </section>

      <div className="actions" style={{ marginBottom: 0 }}>
        <Link href="/career/quiz" className="btn">Retake assessment</Link>
      </div>

      <details className="report card">
        <summary>See full report</summary>
        <p className="muted small" style={{ marginBottom: 12 }}>How your score is worked out:</p>
        <table className="tbl" style={{ minWidth: 0 }}>
          <thead>
            <tr><th>Category</th><th>Your score</th><th>Weight</th><th>Counts for</th></tr>
          </thead>
          <tbody>
            {ORDER.map((c) => (
              <tr key={c}>
                <td>{CAREER_LABELS[c]}</td>
                <td>{result.categories[c]}%</td>
                <td>{Math.round(CAREER_WEIGHTS[c] * 100)}%</td>
                <td>{(result.categories[c] * CAREER_WEIGHTS[c]).toFixed(1)} points</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 12 }}>
          80 or more is Career ready, 60 to 79 is Needs work, and below 60 is Getting started. A category under {GAP_THRESHOLD}% is flagged as a skill gap.
        </p>
      </details>
    </div>
  );
}
