/**
 * Every network call the UI makes. Pages import from here and never call fetch directly.
 * Each function pairs the real endpoint with its mock (see http.ts and mockDb.ts).
 */
import { ApiError, request } from "./http";
import * as mock from "./mockDb";
import type {
  AdminDashboard, AssessmentResult, AssessmentSummary, AssessmentTest, CareerQuizQuestion,
  CareerResult, EventItem, Poll, StudentDashboard,
} from "./types";

// dashboards
export const getStudentDashboard = () =>
  request<StudentDashboard>("/dashboard/student", { mock: mock.mockStudentDashboard });
export const getAdminDashboard = () =>
  request<AdminDashboard>("/dashboard/admin", { mock: mock.mockAdminDashboard });

// polls
export const getPolls = () => request<Poll[]>("/polls", { mock: mock.mockPolls });
export const votePoll = (pollId: string, optionId: string) =>
  request<Poll>(`/polls/${pollId}/vote`, { method: "POST", body: { optionId }, mock: () => mock.mockVote(pollId, optionId) });
export const createPoll = (dto: { title: string; options: string[]; expiresOn: string }) =>
  request<Poll>("/polls", { method: "POST", body: dto, mock: () => mock.mockCreatePoll(dto) });

// events
export const getEvents = () => request<EventItem[]>("/events", { mock: mock.mockEvents });
export const getEvent = (id: string) => request<EventItem>(`/events/${id}`, { mock: () => mock.mockEvent(id) });
export const registerForEvent = (id: string) =>
  request<EventItem>(`/events/${id}/register`, { method: "POST", mock: () => mock.mockRegister(id) });
export const createEvent = (dto: { title: string; date: string; time: string; location: string; description?: string }) =>
  request<EventItem>("/events", { method: "POST", body: dto, mock: () => mock.mockCreateEvent(dto) });

// career readiness
export const getCareerQuiz = () =>
  request<{ questions: CareerQuizQuestion[] }>("/career/quiz", { mock: mock.mockCareerQuiz });
export const submitCareerQuiz = (answers: Record<string, number>) =>
  request<CareerResult>("/career/submit", { method: "POST", body: { answers }, mock: () => mock.mockCareerSubmit(answers) });
export const getCareerResult = async (): Promise<CareerResult | null> => {
  try {
    return await request<CareerResult>("/career/result", { mock: mock.mockCareerResult });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null; // not taken yet
    throw e;
  }
};

// academic assessments
export const getAssessments = () => request<AssessmentSummary[]>("/assessments", { mock: mock.mockAssessments });
export const getAssessmentTest = (id: string) =>
  request<AssessmentTest>(`/assessments/${id}/start`, { mock: () => mock.mockAssessmentTest(id) });
export const submitAssessment = (id: string, answers: Record<string, number>, timeTakenSeconds: number) =>
  request<AssessmentResult>(`/assessments/${id}/submit`, {
    method: "POST", body: { answers, timeTakenSeconds }, mock: () => mock.mockAssessmentSubmit(id, answers, timeTakenSeconds),
  });
export const getAssessmentResult = async (id: string): Promise<AssessmentResult | null> => {
  try {
    return await request<AssessmentResult>(`/assessments/${id}/result`, { mock: () => mock.mockAssessmentResult(id) });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
};
