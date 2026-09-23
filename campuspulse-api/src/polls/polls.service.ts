import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreatePollDto } from "./polls.dto";

export interface PollView {
  id: string;
  title: string;
  expiresOn: string;
  expired: boolean;
  totalVotes: number;
  myVoteId: string | null;
  options: { id: string; label: string; votes: number; percent: number }[];
}

@Injectable()
export class PollsService {
  constructor(private db: DatabaseService) {}

  async list(userId: string, onlyId?: string): Promise<PollView[]> {
    const polls = await this.db.query(
      `SELECT id, title, to_char(expires_on, 'YYYY-MM-DD') AS "expiresOn", (expires_on < CURRENT_DATE) AS expired
       FROM polls WHERE ($1::uuid IS NULL OR id = $1::uuid) ORDER BY created_at DESC`,
      [onlyId ?? null],
    );
    if (polls.rowCount === 0) return [];

    const opts = await this.db.query(
      `SELECT o.id, o.poll_id AS "pollId", o.label, COUNT(v.id)::int AS votes
       FROM poll_options o LEFT JOIN poll_votes v ON v.option_id = o.id
       GROUP BY o.id ORDER BY o.position`,
    );
    const mine = await this.db.query(`SELECT poll_id AS "pollId", option_id AS "optionId" FROM poll_votes WHERE user_id = $1`, [userId]);
    const myVotes = new Map<string, string>(mine.rows.map((r: any) => [r.pollId, r.optionId]));

    return polls.rows.map((p: any) => {
      const own = opts.rows.filter((o: any) => o.pollId === p.id);
      const total = own.reduce((s: number, o: any) => s + o.votes, 0);
      return {
        id: p.id,
        title: p.title,
        expiresOn: p.expiresOn,
        expired: p.expired,
        totalVotes: total,
        myVoteId: myVotes.get(p.id) ?? null,
        options: own.map((o: any) => ({
          id: o.id,
          label: o.label,
          votes: o.votes,
          percent: total ? Math.round((o.votes / total) * 100) : 0,
        })),
      };
    });
  }

  async vote(userId: string, pollId: string, optionId: string): Promise<PollView> {
    const poll = await this.db.query("SELECT (expires_on < CURRENT_DATE) AS expired FROM polls WHERE id = $1", [pollId]);
    if (poll.rowCount === 0) throw new NotFoundException("Poll not found.");
    if (poll.rows[0].expired) throw new BadRequestException("This poll has closed.");

    const opt = await this.db.query("SELECT 1 FROM poll_options WHERE id = $1 AND poll_id = $2", [optionId, pollId]);
    if (opt.rowCount === 0) throw new BadRequestException("Choose one of the options for this poll.");

    const ins = await this.db.query(
      "INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3) ON CONFLICT (poll_id, user_id) DO NOTHING",
      [pollId, optionId, userId],
    );
    if (ins.rowCount === 0) throw new ConflictException("You have already voted in this poll.");
    return (await this.list(userId, pollId))[0];
  }

  async create(userId: string, dto: CreatePollDto): Promise<PollView> {
    const today = new Date().toISOString().slice(0, 10);
    if (dto.expiresOn.slice(0, 10) < today) throw new BadRequestException("Choose an expiration date that is today or later.");
    const labels = dto.options.map((o) => o.trim());
    if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) {
      throw new BadRequestException("Each option must be different.");
    }

    const id = await this.db.transaction(async (q) => {
      const p = await q.query("INSERT INTO polls (title, expires_on, created_by) VALUES ($1, $2, $3) RETURNING id", [
        dto.title.trim(), dto.expiresOn.slice(0, 10), userId,
      ]);
      for (let i = 0; i < labels.length; i++) {
        await q.query("INSERT INTO poll_options (poll_id, label, position) VALUES ($1, $2, $3)", [p.rows[0].id, labels[i], i]);
      }
      return p.rows[0].id as string;
    });
    return (await this.list(userId, id))[0];
  }
}
