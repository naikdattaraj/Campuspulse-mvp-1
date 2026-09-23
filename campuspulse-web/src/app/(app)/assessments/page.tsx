"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, FileText, Flag, Star } from "lucide-react";
import AssessmentResultView from "@/components/AssessmentResultView";
import ConfirmSubmitDialog from "@/components/ConfirmSubmitDialog";
import { getAssessmentResult, getAssessments, getAssessmentTest, submitAssessment } from "@/lib/api";
import { mmss } from "@/lib/format";
import type { AssessmentResult, AssessmentSummary, AssessmentTest } from "@/lib/types";

type Phase = "landing" | "active" | "result";

export default function AssessmentsPage() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [list, setList] = useState<AssessmentSummary[] | null>(null);
  const [test, setTest] = useState<AssessmentTest | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  // test state
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const endAt = useRef(0);
  const submitted = useRef(false);

  const loadList = () => {
    setError("");
    getAssessments().then(setList).catch((e) => setError(e instanceof Error ? e.message : "We could not load assessments."));
  };
  useEffect(loadList, []);

  const start = async (id: string) => {
    setLoading(id);
    setError("");
    try {
      const t = await getAssessmentTest(id);
      setTest(t);
      setAnswers({});
      setFlags({});
      setI(0);
      submitted.current = false;
      endAt.current = Date.now() + t.minutes * 60_000;
      setSecondsLeft(t.minutes * 60);
      setPhase("active");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The test could not start. Try again.");
    } finally {
      setLoading("");
    }
  };

  const viewLast = async (id: string) => {
    setLoading(id);
    try {
      const r = await getAssessmentResult(id);
      if (r) {
        setResult(r);
        setPhase("result");
      } else setError("You have not taken this assessment yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not load your result.");
    } finally {
      setLoading("");
    }
  };

  const finish = useCallback(async () => {
    if (!test || submitted.current) return;
    submitted.current = true; // guards against double submit (timer + button)
    setSubmitting(true);
    const taken = Math.round((test.minutes * 60_000 - Math.max(0, endAt.current - Date.now())) / 1000);
    try {
      setResult(await submitAssessment(test.id, answers, taken));
      setConfirming(false);
      setPhase("result");
      loadList();
    } catch (e) {
      submitted.current = false;
      setConfirming(false);
      setError(e instanceof Error ? e.message : "Your test was not submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [test, answers]);

  // countdown, derived from an end time so it stays correct if the tab sleeps
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => {
      const left = Math.ceil((endAt.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(t);
        finish(); // time is up: submit automatically
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase, finish]);

  /* ---------------- result ---------------- */
  if (phase === "result" && result) {
    return <AssessmentResultView result={result} onRetake={() => { setPhase("landing"); setResult(null); }} />;
  }

  /* ---------------- active test ---------------- */
  if (phase === "active" && test) {
    const q = test.questions[i];
    const last = i === test.questions.length - 1;
    const unanswered = test.questions.filter((x) => answers[x.id] === undefined).length;
    const flagged = test.questions.filter((x) => flags[x.id]).length;

    return (
      <div className="quiz-wrap">
        <div className="progress-label">
          <span>Question {i + 1} of {test.questions.length}</span>
          <span className={`timer ${secondsLeft <= 60 ? "low" : ""}`} role="timer" aria-label={`Time left ${mmss(secondsLeft)}`}>
            <Clock size={16} aria-hidden="true" /> {mmss(secondsLeft)}
          </span>
        </div>
        <div className="segments" aria-hidden="true">
          {test.questions.map((x, n) => (
            <span key={x.id} className={n === i ? "now" : answers[x.id] !== undefined ? "done" : ""} />
          ))}
        </div>

        <fieldset className="opt-cards" key={q.id}>
          <legend className="question">{q.text}</legend>
          {q.options.map((text, n) => (
            <label key={n} className="opt-card">
              <input type="radio" name={q.id} checked={answers[q.id] === n} onChange={() => setAnswers({ ...answers, [q.id]: n })} />
              <span className="opt-letter">{String.fromCharCode(65 + n)}</span>
              {text}
            </label>
          ))}
        </fieldset>

        <label className="flag-row">
          <input type="checkbox" checked={!!flags[q.id]} onChange={(e) => setFlags({ ...flags, [q.id]: e.target.checked })} />
          <Flag size={16} aria-hidden="true" /> Flag this question to review later
        </label>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="nav-row">
          <button className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>Previous</button>
          <div style={{ display: "flex", gap: 8 }}>
            {!last && <button className="btn" onClick={() => setI(i + 1)}>Next</button>}
            <button className="btn btn-primary" onClick={() => setConfirming(true)}>Submit test</button>
          </div>
        </div>

        <nav aria-label="Question navigator">
          <div className="navigator">
            {test.questions.map((x, n) => (
              <button
                key={x.id}
                onClick={() => setI(n)}
                aria-label={`Question ${n + 1}${answers[x.id] !== undefined ? ", answered" : ""}${flags[x.id] ? ", flagged" : ""}`}
                aria-current={n === i ? "step" : undefined}
                className={[answers[x.id] !== undefined ? "answered" : "", flags[x.id] ? "flagged" : "", n === i ? "current" : ""].join(" ")}
              >
                {n + 1}
              </button>
            ))}
          </div>
          <div className="legend-row"><span>Shaded: answered</span><span>Orange dot: flagged</span></div>
        </nav>

        <ConfirmSubmitDialog open={confirming} unanswered={unanswered} flagged={flagged} busy={submitting} onCancel={() => setConfirming(false)} onConfirm={finish} />
      </div>
    );
  }

  /* ---------------- landing ---------------- */
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Academic assessment</h1>
          <p>Timed multiple choice tests. Read the instructions, then start when you are ready.</p>
        </div>
      </header>

      {error && <div className="form-error" role="alert">{error}</div>}
      {!list && !error && <div className="skeleton" aria-busy="true" aria-label="Loading assessments" />}
      {list && list.length === 0 && (
        <div className="empty"><h2>No assessments open</h2><p>New assessments will appear here.</p></div>
      )}

      <div className="stack" style={{ maxWidth: 720 }}>
        {list?.map((a) => (
          <article key={a.id} className="card" aria-labelledby={`a-${a.id}`}>
            <h2 id={`a-${a.id}`} style={{ fontSize: 22 }}>{a.title}</h2>
            <div className="meta-row">
              <span><Clock size={16} aria-hidden="true" /> {a.minutes} minutes</span>
              <span><FileText size={16} aria-hidden="true" /> {a.questionCount} questions</span>
              <span><Star size={16} aria-hidden="true" /> Pass mark {a.passingScore}%</span>
            </div>
            <h3 style={{ fontSize: 15, marginTop: 16 }}>Instructions</h3>
            <ol className="instructions">
              {a.instructions.map((t) => <li key={t}>{t}</li>)}
            </ol>
            <div className="actions" style={{ marginBottom: 0 }}>
              <button className="btn btn-primary" onClick={() => start(a.id)} disabled={loading === a.id}>
                {loading === a.id ? "Loading…" : "Start quiz"}
              </button>
              {a.lastScore !== null && (
                <button className="btn" onClick={() => viewLast(a.id)} disabled={loading === a.id}>
                  View last result ({a.lastScore}%)
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
