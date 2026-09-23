import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AssessmentMeta, AssessmentQuestion, AssessmentResult, scoreAssessment } from "../common/scoring";

@Injectable()
export class AssessmentsService {
  constructor(private db: DatabaseService) {}

  private async meta(id: string) {
    const { rows } = await this.db.query(
      `SELECT id, title, time_limit_minutes AS minutes, passing_score AS "passingScore", instructions FROM assessments WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException("Assessment not found.");
    return rows[0] as AssessmentMeta & { instructions: string[] };
  }

  private async questions(id: string): Promise<AssessmentQuestion[]> {
    const { rows } = await this.db.query(
      `SELECT id, category, text, options, correct_index AS "correctIndex"
       FROM assessment_questions WHERE assessment_id = $1 ORDER BY position`,
      [id],
    );
    return rows as AssessmentQuestion[];
  }

  /** Landing cards: metadata plus the student's latest attempt. */
  async list(userId: string) {
    const { rows } = await this.db.query(
      `SELECT a.id, a.title, a.time_limit_minutes AS minutes, a.passing_score AS "passingScore", a.instructions,
              (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id = a.id) AS "questionCount",
              (SELECT score_percent FROM assessment_attempts t WHERE t.assessment_id = a.id AND t.user_id = $1
               ORDER BY created_at DESC LIMIT 1) AS "lastScore"
       FROM assessments a ORDER BY a.title`,
      [userId],
    );
    return rows;
  }

  /** The test itself. Correct answers are never sent to the browser. */
  async start(id: string) {
    const m = await this.meta(id);
    const qs = await this.questions(id);
    return {
      id: m.id,
      title: m.title,
      minutes: m.minutes,
      passingScore: m.passingScore,
      questions: qs.map(({ id, category, text, options }) => ({ id, category, text, options })),
    };
  }

  async submit(userId: string, id: string, answers: Record<string, number>, timeTakenSeconds: number): Promise<AssessmentResult> {
    const m = await this.meta(id);
    const qs = await this.questions(id);
    const result = scoreAssessment(m, qs, answers, timeTakenSeconds, new Date().toISOString().slice(0, 10));
    await this.db.query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score_percent, passed, result) VALUES ($1, $2, $3, $4, $5)",
      [id, userId, result.scorePercent, result.passed, JSON.stringify(result)],
    );
    return result;
  }

  async latestResult(userId: string, id: string): Promise<AssessmentResult> {
    const { rows } = await this.db.query(
      "SELECT result FROM assessment_attempts WHERE assessment_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1",
      [id, userId],
    );
    if (!rows[0]) throw new NotFoundException("You have not taken this assessment yet.");
    return rows[0].result as AssessmentResult;
  }
}
