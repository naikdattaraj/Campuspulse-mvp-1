/**
 * In-memory stand-in for the backend (Iteration 1 only).
 * It follows the same rules as the NestJS API so screens behave identically.
 * State lives until the page is refreshed.
 */
import rawContent from "./content.json";
import { ApiError } from "./http";
import { todayISO } from "./format";
import {
  AssessmentQuestion, CareerQuestion, careerLabel, scoreAssessment, scoreCareer,
} from "./scoring";
import type {
  AdminDashboard, AssessmentResult, AssessmentSummary, AssessmentTest, CareerQuizQuestion,
  CareerResult, EventItem, Poll, StudentDashboard,
} from "./types";

const content = rawContent as unknown as {
  career: CareerQuestion[];
  assessment: {
    id: string; title: string; minutes: number; passingScore: number; instructions: string[];
    questions: AssessmentQuestion[];
  };
};
const A = content.assessment;
const META = { id: A.id, title: A.title, minutes: A.minutes, passingScore: A.passingScore };

// ---------- polls ----------
type RawPoll = { id: string; title: string; expiresOn: string; options: { id: string; label: string; votes: number }[]; myVoteId: string | null };

const polls: RawPoll[] = [
  {
    id: "poll-1",
    title: "What primary factor do you consider most when selecting your elective course?",
    expiresOn: "2026-10-10",
    options: [
      { id: "p1o1", label: "Relevance to career goals", votes: 4 },
      { id: "p1o2", label: "Subject interest and passion", votes: 6 },
      { id: "p1o3", label: "Faculty expertise and grading style", votes: 3 },
      { id: "p1o4", label: "Peer recommendations", votes: 5 },
    ],
    myVoteId: null,
  },
  {
    id: "poll-2",
    title: "Which day works best for the monthly guest lecture?",
    expiresOn: "2026-10-05",
    options: [
      { id: "p2o1", label: "Monday", votes: 2 },
      { id: "p2o2", label: "Wednesday", votes: 5 },
      { id: "p2o3", label: "Friday", votes: 3 },
    ],
    myVoteId: "p2o2",
  },
];

const toPollView = (p: RawPoll): Poll => {
  const total = p.options.reduce((s, o) => s + o.votes, 0);
  return {
    id: p.id,
    title: p.title,
    expiresOn: p.expiresOn,
    expired: p.expiresOn < todayISO(),
    totalVotes: total,
    myVoteId: p.myVoteId,
    options: p.options.map((o) => ({ ...o, percent: total ? Math.round((o.votes / total) * 100) : 0 })),
  };
};

export const mockPolls = (): Poll[] => polls.map(toPollView);

export function mockVote(pollId: string, optionId: string): Poll {
  const p = polls.find((x) => x.id === pollId);
  if (!p) throw new ApiError(404, "Poll not found.");
  if (p.expiresOn < todayISO()) throw new ApiError(400, "This poll has closed.");
  const o = p.options.find((x) => x.id === optionId);
  if (!o) throw new ApiError(400, "Choose one of the options for this poll.");
  if (p.myVoteId) throw new ApiError(409, "You have already voted in this poll.");
  o.votes += 1;
  p.myVoteId = optionId;
  return toPollView(p);
}

export function mockCreatePoll(dto: { title: string; options: string[]; expiresOn: string }): Poll {
  if (dto.title.trim().length < 5) throw new ApiError(400, "Enter the poll question (at least 5 characters).");
  const labels = dto.options.map((o) => o.trim()).filter(Boolean);
  if (labels.length < 2) throw new ApiError(400, "Add at least 2 options.");
  if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) throw new ApiError(400, "Each option must be different.");
  if (!dto.expiresOn || dto.expiresOn < todayISO()) throw new ApiError(400, "Choose an expiration date that is today or later.");
  const id = `poll-${Date.now()}`;
  const p: RawPoll = {
    id, title: dto.title.trim(), expiresOn: dto.expiresOn, myVoteId: null,
    options: labels.map((label, i) => ({ id: `${id}-o${i}`, label, votes: 0 })),
  };
  polls.unshift(p);
  return toPollView(p);
}

// ---------- events ----------
const events: EventItem[] = [
  { id: "evt-1", title: "AI & Machine Learning Workshop", date: "2026-09-25", time: "14:00", location: "Seminar Hall",
    description: "A hands-on introduction to training and evaluating your first machine learning model.", registered: false, registrations: 41 },
  { id: "evt-2", title: "Cultural Festival", date: "2026-10-02", time: "17:00", location: "College Auditorium",
    description: "An evening of music, dance and food stalls run by student clubs.", registered: true, registrations: 87 },
  { id: "evt-3", title: "Tech Hackathon 2026", date: "2026-10-15", time: "10:00", location: "Main Auditorium, Block B",
    description: "Join us for a 24 hour coding challenge. Teams of up to four. Prizes for the top three.", registered: false, registrations: 63 },
];

const sortedEvents = () => [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((e) => ({ ...e }));
export const mockEvents = (): EventItem[] => sortedEvents();

export function mockEvent(id: string): EventItem {
  const e = events.find((x) => x.id === id);
  if (!e) throw new ApiError(404, "Event not found.");
  return { ...e };
}

export function mockRegister(id: string): EventItem {
  const e = events.find((x) => x.id === id);
  if (!e) throw new ApiError(404, "Event not found.");
  if (!e.registered) {
    e.registered = true;
    e.registrations += 1;
  }
  return { ...e };
}

export function mockCreateEvent(dto: { title: string; date: string; time: string; location: string; description?: string }): EventItem {
  if (dto.title.trim().length < 3) throw new ApiError(400, "Enter the event title.");
  if (!dto.date || dto.date < todayISO()) throw new ApiError(400, "Choose an event date that is today or later.");
  if (!/^\d{2}:\d{2}$/.test(dto.time)) throw new ApiError(400, "Enter the time as HH:MM.");
  if (dto.location.trim().length < 2) throw new ApiError(400, "Enter the event location.");
  const e: EventItem = {
    id: `evt-${Date.now()}`, title: dto.title.trim(), date: dto.date, time: dto.time,
    location: dto.location.trim(), description: (dto.description ?? "").trim(), registered: false, registrations: 0,
  };
  events.push(e);
  return { ...e };
}

// ---------- career ----------
let careerResult: CareerResult | null = {
  overall: 78,
  label: careerLabel(78),
  categories: { technical: 82, soft: 71, aptitude: 79 },
  improvements: ["Time management", "Public speaking"],
  gaps: [],
  takenOn: "2026-09-10",
  aheadOfPercent: 68,
};

export const mockCareerQuiz = (): { questions: CareerQuizQuestion[] } => ({
  questions: content.career.map((q) => ({ id: q.id, category: q.category, text: q.text, options: q.options.map((o) => o.text) })),
});

export function mockCareerSubmit(answers: Record<string, number>): CareerResult {
  const s = scoreCareer(content.career, answers);
  careerResult = { ...s, takenOn: todayISO(), aheadOfPercent: Math.min(95, Math.max(5, s.overall - 10)) };
  return careerResult;
}

export function mockCareerResult(): CareerResult {
  if (!careerResult) throw new ApiError(404, "You have not taken the career readiness quiz yet.");
  return careerResult;
}

// ---------- assessments ----------
const seedAnswers: Record<string, number> = {};
A.questions.forEach((q) => (seedAnswers[q.id] = q.id === "a8" ? 1 : q.correctIndex)); // 9 of 10 right
let lastAssessment: AssessmentResult | null = scoreAssessment(META, A.questions, seedAnswers, 452, "2026-09-12");

export const mockAssessments = (): AssessmentSummary[] => [
  {
    id: A.id, title: A.title, minutes: A.minutes, passingScore: A.passingScore, instructions: A.instructions,
    questionCount: A.questions.length, lastScore: lastAssessment ? lastAssessment.scorePercent : null,
  },
];

export function mockAssessmentTest(id: string): AssessmentTest {
  if (id !== A.id) throw new ApiError(404, "Assessment not found.");
  return {
    id: A.id, title: A.title, minutes: A.minutes, passingScore: A.passingScore,
    questions: A.questions.map(({ id, category, text, options }) => ({ id, category, text, options })), // no answers
  };
}

export function mockAssessmentSubmit(id: string, answers: Record<string, number>, seconds: number): AssessmentResult {
  if (id !== A.id) throw new ApiError(404, "Assessment not found.");
  lastAssessment = scoreAssessment(META, A.questions, answers, seconds, todayISO());
  return lastAssessment;
}

export function mockAssessmentResult(id: string): AssessmentResult {
  if (id !== A.id || !lastAssessment) throw new ApiError(404, "You have not taken this assessment yet.");
  return lastAssessment;
}

// ---------- dashboards ----------
export function mockStudentDashboard(): StudentDashboard {
  const votes = polls.filter((p) => p.myVoteId).length;
  const goals = [Math.min(1, votes / 2), lastAssessment ? 1 : 0, careerResult ? 1 : 0, events.some((e) => e.registered) ? 1 : 0];
  const today = todayISO();
  const poll = polls.filter((p) => !p.myVoteId && p.expiresOn >= today).sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))[0];
  const event = sortedEvents().find((e) => e.date >= today);
  return {
    engagementScore: Math.round((goals.reduce((s, g) => s + g, 0) / goals.length) * 100),
    activePoll: poll ? { id: poll.id, title: poll.title, expiresOn: poll.expiresOn } : null,
    assessment: { id: A.id, title: A.title, questions: A.questions.length, minutes: A.minutes },
    career: careerResult
      ? { score: careerResult.overall, label: careerResult.label, weakest: careerResult.improvements[0] ?? null }
      : null,
    event: event ? { id: event.id, title: event.title, date: event.date, location: event.location } : null,
  };
}

export function mockAdminDashboard(): AdminDashboard {
  return {
    totalStudents: 1240,
    avgEngagement: 74,
    activePolls: polls.filter((p) => p.expiresOn >= todayISO()).length + 2,
    analytics: [
      { label: "Poll participation", value: 68 },
      { label: "Career assessments completed", value: 52 },
      { label: "Event registrations", value: 41 },
    ],
  };
}
