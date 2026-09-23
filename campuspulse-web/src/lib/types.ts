import type { AssessmentResult, CareerScore } from "./scoring";

export type { AssessmentResult, CareerScore };

export type Role = "student" | "admin";

export interface StudentDashboard {
  engagementScore: number;
  activePoll: { id: string; title: string; expiresOn: string } | null;
  assessment: { id: string; title: string; questions: number; minutes: number } | null;
  career: { score: number; label: string; weakest: string | null } | null;
  event: { id: string; title: string; date: string; location: string } | null;
}

export interface AdminDashboard {
  totalStudents: number;
  avgEngagement: number;
  activePolls: number;
  analytics: { label: string; value: number }[];
}

export interface Poll {
  id: string;
  title: string;
  expiresOn: string;
  expired: boolean;
  totalVotes: number;
  myVoteId: string | null;
  options: { id: string; label: string; votes: number; percent: number }[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
  registered: boolean;
  registrations: number;
}

export interface CareerQuizQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
}

export interface CareerResult extends CareerScore {
  takenOn: string;
  aheadOfPercent: number | null;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  minutes: number;
  passingScore: number;
  instructions: string[];
  questionCount: number;
  lastScore: number | null;
}

export interface AssessmentTest {
  id: string;
  title: string;
  minutes: number;
  passingScore: number;
  questions: { id: string; category: string; text: string; options: string[] }[];
}
