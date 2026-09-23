"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getCareerQuiz, submitCareerQuiz } from "@/lib/api";
import type { CareerQuizQuestion } from "@/lib/types";

export default function CareerQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<CareerQuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [i, setI] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCareerQuiz()
      .then((r) => setQuestions(r.questions))
      .catch((e) => setError(e instanceof Error ? e.message : "We could not load the quiz."));
  }, []);

  if (error && !questions) {
    return (
      <div className="empty">
        <h2>Quiz unavailable</h2>
        <p>{error}</p>
        <Link href="/career" className="btn">Back to career score</Link>
      </div>
    );
  }
  if (!questions) return <div className="skeleton quiz-wrap" aria-busy="true" aria-label="Loading quiz" />;

  const q = questions[i];
  const last = i === questions.length - 1;
  const answered = Object.keys(answers).length;
  const allDone = answered === questions.length;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await submitCareerQuiz(answers);
      router.push("/career");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your answers were not saved. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="quiz-wrap">
      <Link href="/career" className="back-link"><ArrowLeft size={16} /> Career score</Link>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Career readiness quiz</h1>

      <div className="progress-label">
        <span>Question {i + 1} of {questions.length}</span>
        <span className="muted small">{answered} answered</span>
      </div>
      <div className="segments" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={i + 1} aria-label="Quiz progress">
        {questions.map((x, n) => (
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

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="nav-row">
        <button className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>Previous</button>
        {last ? (
          <button className="btn btn-primary" onClick={submit} disabled={!allDone || busy}>
            {busy ? "Scoring…" : allDone ? "Submit" : `Answer all ${questions.length} to submit`}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setI(i + 1)} disabled={answers[q.id] === undefined}>Next</button>
        )}
      </div>
    </div>
  );
}
