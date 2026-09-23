/**
 * Rule-based scoring shared by the mock frontend and the NestJS backend.
 * This file is copied verbatim to campuspulse-api/src/common/scoring.ts.
 * Keep both copies identical.
 */

// ---------- Career readiness (US-08 / US-09) ----------
export type CareerCategory = "technical" | "soft" | "aptitude";

export interface CareerQuestion {
  id: string;
  category: CareerCategory;
  skill: string;
  text: string;
  options: { text: string; points: number }[]; // points: 0-100
}

export interface CareerScore {
  overall: number;
  label: string;
  categories: Record<CareerCategory, number>;
  improvements: string[]; // skills to work on, weakest first
  gaps: CareerCategory[]; // categories below GAP_THRESHOLD
}

export const CAREER_WEIGHTS: Record<CareerCategory, number> = { technical: 0.4, soft: 0.3, aptitude: 0.3 };
export const CAREER_LABELS: Record<CareerCategory, string> = {
  technical: "Technical",
  soft: "Soft skills",
  aptitude: "Aptitude",
};
export const GAP_THRESHOLD = 50;

export function careerLabel(score: number): string {
  if (score >= 80) return "Career ready";
  if (score >= 60) return "Needs work";
  return "Getting started";
}

export function scoreCareer(questions: CareerQuestion[], answers: Record<string, number>): CareerScore {
  const totals: Record<CareerCategory, { sum: number; n: number }> = {
    technical: { sum: 0, n: 0 },
    soft: { sum: 0, n: 0 },
    aptitude: { sum: 0, n: 0 },
  };
  const weak: { skill: string; points: number }[] = [];

  for (const q of questions) {
    const chosen = q.options[answers[q.id]];
    const points = chosen ? chosen.points : 0; // unanswered counts as 0
    totals[q.category].sum += points;
    totals[q.category].n += 1;
    if (points < 100) weak.push({ skill: q.skill, points });
  }

  const pct = (c: CareerCategory) => (totals[c].n ? Math.round(totals[c].sum / totals[c].n) : 0);
  const categories = { technical: pct("technical"), soft: pct("soft"), aptitude: pct("aptitude") };
  const overall = Math.round(
    categories.technical * CAREER_WEIGHTS.technical +
      categories.soft * CAREER_WEIGHTS.soft +
      categories.aptitude * CAREER_WEIGHTS.aptitude,
  );

  weak.sort((a, b) => a.points - b.points);
  return {
    overall,
    label: careerLabel(overall),
    categories,
    improvements: weak.slice(0, 4).map((w) => w.skill),
    gaps: (Object.keys(categories) as CareerCategory[]).filter((c) => categories[c] < GAP_THRESHOLD),
  };
}

// ---------- Academic assessment (US-06) ----------
export interface AssessmentQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface AssessmentMeta {
  id: string;
  title: string;
  minutes: number;
  passingScore: number; // percent
}

export interface AssessmentResult {
  assessmentId: string;
  title: string;
  completedOn: string; // YYYY-MM-DD
  minutes: number;
  passingScore: number;
  scorePercent: number;
  correct: number;
  total: number;
  timeTakenSeconds: number;
  passed: boolean;
  categories: { name: string; percent: number }[];
  improvements: string[];
  questions: { n: number; text: string; yourAnswer: string | null; correctAnswer: string; correct: boolean }[];
}

export const IMPROVEMENT_THRESHOLD = 70;

const TIPS: Record<string, string> = {
  "Technical Knowledge": "Revisit core data structure definitions and their time complexities.",
  "Problem Solving": "Practise choosing the right structure for a problem, such as queues for BFS.",
  "Logical Reasoning": "Trace small stack and queue examples by hand, step by step.",
};

const letter = (i: number) => String.fromCharCode(65 + i);

export function scoreAssessment(
  meta: AssessmentMeta,
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
  timeTakenSeconds: number,
  completedOn: string,
): AssessmentResult {
  const perCat = new Map<string, { correct: number; n: number }>();
  let correct = 0;

  const rows = questions.map((q, i) => {
    const given = answers[q.id];
    const isCorrect = given === q.correctIndex;
    if (isCorrect) correct += 1;
    const c = perCat.get(q.category) ?? { correct: 0, n: 0 };
    c.n += 1;
    if (isCorrect) c.correct += 1;
    perCat.set(q.category, c);
    return {
      n: i + 1,
      text: q.text,
      yourAnswer: given === undefined || !q.options[given] ? null : letter(given),
      correctAnswer: letter(q.correctIndex),
      correct: isCorrect,
    };
  });

  const total = questions.length;
  const scorePercent = total ? Math.round((correct / total) * 100) : 0;
  const categories = Array.from(perCat.entries()).map(([name, v]) => ({
    name,
    percent: Math.round((v.correct / v.n) * 100),
  }));

  return {
    assessmentId: meta.id,
    title: meta.title,
    completedOn,
    minutes: meta.minutes,
    passingScore: meta.passingScore,
    scorePercent,
    correct,
    total,
    timeTakenSeconds: Math.max(0, Math.min(timeTakenSeconds, meta.minutes * 60)),
    passed: scorePercent >= meta.passingScore,
    categories,
    improvements: categories
      .filter((c) => c.percent < IMPROVEMENT_THRESHOLD)
      .map((c) => TIPS[c.name] ?? `Practise more questions on ${c.name}.`),
    questions: rows,
  };
}
