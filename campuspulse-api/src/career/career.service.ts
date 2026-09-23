import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CareerQuestion, CareerScore, scoreCareer } from "../common/scoring";

export interface CareerResultView extends CareerScore {
  takenOn: string;
  aheadOfPercent: number | null; // share of other students you scored higher than
}

@Injectable()
export class CareerService {
  constructor(private db: DatabaseService) {}

  private async allQuestions(): Promise<CareerQuestion[]> {
    const { rows } = await this.db.query("SELECT id, category, skill, text, options FROM career_questions ORDER BY position");
    return rows as CareerQuestion[];
  }

  /** Questions for the quiz. Points are never sent to the browser. */
  async quiz() {
    const qs = await this.allQuestions();
    return {
      questions: qs.map((q) => ({ id: q.id, category: q.category, text: q.text, options: q.options.map((o) => o.text) })),
    };
  }

  private async ahead(userId: string, overall: number): Promise<number | null> {
    const { rows } = await this.db.query(
      `WITH latest AS (SELECT DISTINCT ON (user_id) user_id, overall FROM career_results ORDER BY user_id, created_at DESC)
       SELECT COUNT(*) FILTER (WHERE overall < $2)::int AS lower, COUNT(*)::int AS total FROM latest WHERE user_id <> $1`,
      [userId, overall],
    );
    return rows[0].total ? Math.round((rows[0].lower / rows[0].total) * 100) : null;
  }

  async submit(userId: string, answers: Record<string, number>): Promise<CareerResultView> {
    const score = scoreCareer(await this.allQuestions(), answers);
    const { rows } = await this.db.query(
      `INSERT INTO career_results (user_id, overall, label, categories, improvements, gaps, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING to_char(created_at, 'YYYY-MM-DD') AS "takenOn"`,
      [userId, score.overall, score.label, JSON.stringify(score.categories), JSON.stringify(score.improvements),
       JSON.stringify(score.gaps), JSON.stringify(answers)],
    );
    return { ...score, takenOn: rows[0].takenOn, aheadOfPercent: await this.ahead(userId, score.overall) };
  }

  async latest(userId: string): Promise<CareerResultView> {
    const { rows } = await this.db.query(
      `SELECT overall, label, categories, improvements, gaps, to_char(created_at, 'YYYY-MM-DD') AS "takenOn"
       FROM career_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (!rows[0]) throw new NotFoundException("You have not taken the career readiness quiz yet.");
    const r = rows[0];
    return { ...r, aheadOfPercent: await this.ahead(userId, r.overall) };
  }
}
