import { CareerQuestion, scoreAssessment, scoreCareer } from "./scoring";
import content from "../seed/content.json";

const careerQs = content.career as CareerQuestion[];

describe("scoreCareer", () => {
  it("gives 100 and 'Career ready' when every best option is chosen", () => {
    const answers: Record<string, number> = {};
    careerQs.forEach((q) => (answers[q.id] = q.options.findIndex((o) => o.points === 100)));
    const r = scoreCareer(careerQs, answers);
    expect(r.overall).toBe(100);
    expect(r.label).toBe("Career ready");
    expect(r.improvements).toEqual([]);
  });

  it("scores 0 and flags every category as a gap when nothing is answered", () => {
    const r = scoreCareer(careerQs, {});
    expect(r.overall).toBe(0);
    expect(r.gaps).toEqual(["technical", "soft", "aptitude"]);
    expect(r.label).toBe("Getting started");
  });

  it("weights technical 40% and soft/aptitude 30% each", () => {
    const answers: Record<string, number> = {};
    careerQs.filter((q) => q.category === "technical").forEach((q) => (answers[q.id] = q.options.findIndex((o) => o.points === 100)));
    expect(scoreCareer(careerQs, answers).overall).toBe(40);
  });
});

describe("scoreAssessment", () => {
  const a = content.assessment;
  const meta = { id: a.id, title: a.title, minutes: a.minutes, passingScore: a.passingScore };

  it("passes at 100% and lists no improvements", () => {
    const answers: Record<string, number> = {};
    a.questions.forEach((q) => (answers[q.id] = q.correctIndex));
    const r = scoreAssessment(meta, a.questions, answers, 300, "2026-09-21");
    expect(r.scorePercent).toBe(100);
    expect(r.passed).toBe(true);
    expect(r.improvements).toEqual([]);
  });

  it("fails below the passing score and clamps time taken to the limit", () => {
    const r = scoreAssessment(meta, a.questions, {}, 99999, "2026-09-21");
    expect(r.scorePercent).toBe(0);
    expect(r.passed).toBe(false);
    expect(r.timeTakenSeconds).toBe(a.minutes * 60);
    expect(r.questions[0].yourAnswer).toBeNull();
  });
});
