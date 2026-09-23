import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateEventDto } from "./events.dto";

export interface EventView {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  location: string;
  description: string;
  registered: boolean;
  registrations: number;
}

const SELECT = `
  SELECT e.id, e.title, to_char(e.event_date, 'YYYY-MM-DD') AS date, to_char(e.event_time, 'HH24:MI') AS time,
         e.location, e.description,
         EXISTS (SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.user_id = $1) AS registered,
         (SELECT COUNT(*)::int FROM event_registrations r WHERE r.event_id = e.id) AS registrations
  FROM events e
  WHERE ($2::uuid IS NULL OR e.id = $2::uuid)
  ORDER BY e.event_date, e.event_time`;

@Injectable()
export class EventsService {
  constructor(private db: DatabaseService) {}

  async list(userId: string): Promise<EventView[]> {
    return (await this.db.query<EventView>(SELECT, [userId, null])).rows;
  }

  async get(userId: string, id: string): Promise<EventView> {
    const { rows } = await this.db.query<EventView>(SELECT, [userId, id]);
    if (!rows[0]) throw new NotFoundException("Event not found.");
    return rows[0];
  }

  async register(userId: string, id: string): Promise<EventView> {
    await this.get(userId, id); // 404 if missing
    // idempotent: registering twice is not an error
    await this.db.query("INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, userId]);
    return this.get(userId, id);
  }

  async create(userId: string, dto: CreateEventDto): Promise<EventView> {
    const today = new Date().toISOString().slice(0, 10);
    if (dto.date.slice(0, 10) < today) throw new BadRequestException("Choose an event date that is today or later.");
    const { rows } = await this.db.query(
      `INSERT INTO events (title, event_date, event_time, location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [dto.title.trim(), dto.date.slice(0, 10), dto.time, dto.location.trim(), (dto.description ?? "").trim(), userId],
    );
    return this.get(userId, rows[0].id);
  }
}
