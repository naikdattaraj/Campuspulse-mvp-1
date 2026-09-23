import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round(Math.min(1, part / whole) * 100) : 0);

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  /**
   * Engagement rule (kept simple and explainable):
   * average of four goals, each capped at 100%:
   *   2 poll votes, 1 assessment, 1 career quiz, 1 event registration.
   */
  async student(userId: string) {
    const [counts, poll, assessment, career, event] = await Promise.all([
      this.db.query(
        `SELECT (SELECT COUNT(*)::int FROM poll_votes WHERE user_id = $1) AS votes,
                (SELECT COUNT(*)::int FROM assessment_attempts WHERE user_id = $1) AS attempts,
                (SELECT COUNT(*)::int FROM career_results WHERE user_id = $1) AS careers,
                (SELECT COUNT(*)::int FROM event_registrations WHERE user_id = $1) AS regs`,
        [userId],
      ),
      this.db.query(
        `SELECT p.id, p.title, to_char(p.expires_on, 'YYYY-MM-DD') AS "expiresOn"
         FROM polls p
         WHERE p.expires_on >= CURRENT_DATE
           AND NOT EXISTS (SELECT 1 FROM poll_votes v WHERE v.poll_id = p.id AND v.user_id = $1)
         ORDER BY p.expires_on LIMIT 1`,
        [userId],
      ),
      this.db.query(
        `SELECT a.id, a.title, a.time_limit_minutes AS minutes,
                (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id = a.id) AS questions
         FROM assessments a ORDER BY a.title LIMIT 1`,
      ),
      this.db.query("SELECT overall, label, improvements FROM career_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]),
      this.db.query(
        `SELECT id, title, to_char(event_date, 'YYYY-MM-DD') AS date, location
         FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date, event_time LIMIT 1`,
      ),
    ]);

    const c = counts.rows[0];
    const goals = [Math.min(1, c.votes / 2), Math.min(1, c.attempts), Math.min(1, c.careers), Math.min(1, c.regs)];
    const engagementScore = Math.round((goals.reduce((s, g) => s + g, 0) / goals.length) * 100);

    const cr = career.rows[0];
    return {
      engagementScore,
      activePoll: poll.rows[0] ?? null,
      assessment: assessment.rows[0] ?? null,
      career: cr ? { score: cr.overall, label: cr.label, weakest: (cr.improvements as string[])[0] ?? null } : null,
      event: event.rows[0] ?? null,
    };
  }

  async admin() {
    const { rows } = await this.db.query(
      `SELECT (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS students,
              (SELECT COUNT(*)::int FROM polls WHERE expires_on >= CURRENT_DATE) AS "activePolls",
              (SELECT COUNT(DISTINCT v.user_id)::int FROM poll_votes v JOIN users u ON u.id = v.user_id WHERE u.role = 'student') AS voters,
              (SELECT COUNT(DISTINCT r.user_id)::int FROM career_results r JOIN users u ON u.id = r.user_id WHERE u.role = 'student') AS careers,
              (SELECT COUNT(DISTINCT g.user_id)::int FROM event_registrations g JOIN users u ON u.id = g.user_id WHERE u.role = 'student') AS registrants`,
    );
    const r = rows[0];
    const analytics = [
      { label: "Poll participation", value: pct(r.voters, r.students) },
      { label: "Career assessments completed", value: pct(r.careers, r.students) },
      { label: "Event registrations", value: pct(r.registrants, r.students) },
    ];
    return {
      totalStudents: r.students,
      avgEngagement: Math.round(analytics.reduce((s, a) => s + a.value, 0) / analytics.length),
      activePolls: r.activePolls,
      analytics,
    };
  }
}
