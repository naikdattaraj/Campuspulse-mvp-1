"use client";

import Link from "next/link";
import { Download, Home, Trophy } from "lucide-react";
import { durationLabel, longDate } from "@/lib/format";
import type { AssessmentResult } from "@/lib/types";

const tone = (v: number) => (v >= 80 ? "green" : v >= 60 ? "" : "red");

export default function AssessmentResultView({ result, onRetake }: { result: AssessmentResult; onRetake: () => void }) {
  return (
    <div style={{ maxWidth: 860 }} className="stack">
      <header className="card score-hero" style={{ gap: 16 }}>
        <span className="ico" style={{ width: 52, height: 52, borderRadius: 12, background: "var(--primary-soft)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
          <Trophy size={26} aria-hidden="true" />
        </span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24 }}>{result.title}</h1>
          <p className="muted">Completed on {longDate(result.completedOn)} · {result.minutes} minute test</p>
        </div>
        <span className={`pill ${result.passed ? "pill-green" : "pill-red"}`}>{result.passed ? "Passed" : "Not passed"}</span>
      </header>

      <div className="stat-trio">
        <div className="mini">
          <span>Total score</span>
          <b>{result.scorePercent}%</b>
          <small>{result.correct} / {result.total} correct</small>
        </div>
        <div className="mini">
          <span>Time taken</span>
          <b>{durationLabel(result.timeTakenSeconds)}</b>
          <small>of {result.minutes} minutes</small>
        </div>
        <div className="mini">
          <span>Status</span>
          <b className={result.passed ? "ok" : "bad"}>{result.passed ? "Pass" : "Fail"}</b>
          <small>Pass mark {result.passingScore}%</small>
        </div>
      </div>

      <div className="two-col" style={{ alignItems: "start" }}>
        <section className="card" aria-labelledby="sb">
          <h2 id="sb" style={{ fontSize: 18, marginBottom: 16 }}>Score breakdown</h2>
          <div className="cat-bars">
            {result.categories.map((c) => (
              <div key={c.name}>
                <div className="result-top"><span>{c.name}</span><b>{c.percent}%</b></div>
                <div className="track" role="progressbar" aria-label={c.name} aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`fill ${tone(c.percent)}`} style={{ width: `${c.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card" aria-labelledby="ai">
          <h2 id="ai" style={{ fontSize: 18 }}>Areas for improvement</h2>
          {result.improvements.length ? (
            <ul className="improve-list">{result.improvements.map((t) => <li key={t}>{t}</li>)}</ul>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>Every category is above 70%. Nice work.</p>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="qb">
        <h2 id="qb" style={{ fontSize: 18, marginBottom: 12 }}>Question breakdown</h2>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>#</th><th>Question</th><th>Your answer</th><th>Correct answer</th><th>Status</th></tr>
            </thead>
            <tbody>
              {result.questions.map((q) => (
                <tr key={q.n}>
                  <td>{q.n}</td>
                  <td>{q.text}</td>
                  <td>{q.yourAnswer ?? "Skipped"}</td>
                  <td>{q.correctAnswer}</td>
                  <td className={q.correct ? "ok" : "bad"}>{q.correct ? "✓ Correct" : "✗ Incorrect"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="actions no-print">
        <button className="btn" onClick={() => window.print()}><Download size={16} /> Download result (PDF)</button>
        <button className="btn" onClick={onRetake}>Retake test</button>
        <Link href="/dashboard" className="btn btn-primary"><Home size={16} /> Back to dashboard</Link>
      </div>
    </div>
  );
}
