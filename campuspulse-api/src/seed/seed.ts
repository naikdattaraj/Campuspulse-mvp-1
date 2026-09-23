/**
 * Loads the schema, question content and realistic demo data.
 *   npm run seed          -> safe to re-run (content is upserted, demo data added once)
 *   npm run seed:reset    -> wipes the public schema first (development only)
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";
import * as bcrypt from "bcryptjs";
import { scoreAssessment, scoreCareer, CareerQuestion } from "../common/scoring";

const content = JSON.parse(fs.readFileSync(path.join(__dirname, "content.json"), "utf8"));

const STUDENTS = [
  "John Fernandes", "Aisha Khan", "Rohan Naik", "Meera Desai", "Sanket Gaonkar", "Priya Kamat",
  "Aditya Prabhu", "Neha Borkar", "Karan Shet", "Sneha Volvoikar", "Rahul Dessai", "Tanvi Sawant",
];
const emailOf = (name: string) => name.toLowerCase().replace(/[^a-z ]/g, "").split(" ")[0] + "@college.edu";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env first.");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  if (process.argv.includes("--reset")) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
    await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("Schema wiped.");
  }

  await db.query(fs.readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf8"));
  console.log("Schema ready.");

  // ---- question content (upsert so edits to content.json apply on re-run) ----
  const a = content.assessment;
  await db.query(
    `INSERT INTO assessments (id, title, time_limit_minutes, passing_score, instructions) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET title=$2, time_limit_minutes=$3, passing_score=$4, instructions=$5`,
    [a.id, a.title, a.minutes, a.passingScore, JSON.stringify(a.instructions)],
  );
  for (let i = 0; i < a.questions.length; i++) {
    const q = a.questions[i];
    await db.query(
      `INSERT INTO assessment_questions (id, assessment_id, position, category, text, options, correct_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET position=$3, category=$4, text=$5, options=$6, correct_index=$7`,
      [q.id, a.id, i, q.category, q.text, JSON.stringify(q.options), q.correctIndex],
    );
  }
  for (let i = 0; i < content.career.length; i++) {
    const q = content.career[i];
    await db.query(
      `INSERT INTO career_questions (id, position, category, skill, text, options) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET position=$2, category=$3, skill=$4, text=$5, options=$6`,
      [q.id, i, q.category, q.skill, q.text, JSON.stringify(q.options)],
    );
  }
  console.log("Assessment and career questions loaded.");

  // ---- users ----
  const studentHash = await bcrypt.hash("Password123", 10);
  const adminHash = await bcrypt.hash("Admin1234", 10);
  await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'admin') ON CONFLICT DO NOTHING",
    ["Admin Faculty", "admin@college.edu", adminHash],
  );
  for (const name of STUDENTS) {
    await db.query("INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'student') ON CONFLICT DO NOTHING", [
      name, emailOf(name), studentHash,
    ]);
  }

  const { rows: polls } = await db.query("SELECT COUNT(*)::int AS n FROM polls");
  if (polls[0].n > 0) {
    console.log("Demo data already present. Done.");
    return db.end();
  }

  const admin = (await db.query("SELECT id FROM users WHERE email = 'admin@college.edu'")).rows[0].id;
  const students: { id: string; name: string }[] = (
    await db.query("SELECT id, name FROM users WHERE role = 'student' ORDER BY name")
  ).rows;
  const john = students.find((s) => s.name === "John Fernandes")!;
  const others = students.filter((s) => s.id !== john.id);

  // ---- polls + votes (John has not voted, so his dashboard shows an active poll) ----
  const pollDefs = [
    { title: "What primary factor do you consider most when selecting your elective course?", expires: "2026-10-10",
      options: ["Relevance to career goals", "Subject interest and passion", "Faculty expertise and grading style", "Peer recommendations"] },
    { title: "Which day works best for the monthly guest lecture?", expires: "2026-10-05",
      options: ["Monday", "Wednesday", "Friday"] },
  ];
  for (let p = 0; p < pollDefs.length; p++) {
    const def = pollDefs[p];
    const pid = (await db.query("INSERT INTO polls (title, expires_on, created_by) VALUES ($1,$2,$3) RETURNING id", [def.title, def.expires, admin])).rows[0].id;
    const optionIds: string[] = [];
    for (let i = 0; i < def.options.length; i++) {
      optionIds.push((await db.query("INSERT INTO poll_options (poll_id, label, position) VALUES ($1,$2,$3) RETURNING id", [pid, def.options[i], i])).rows[0].id);
    }
    for (let s = 0; s < others.length - p * 3; s++) {
      await db.query("INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [
        pid, optionIds[(s * 3 + p) % optionIds.length], others[s].id,
      ]);
    }
  }

  // ---- events + registrations ----
  const eventDefs = [
    { title: "AI & Machine Learning Workshop", date: "2026-09-25", time: "14:00", location: "Seminar Hall", description: "A hands-on introduction to training and evaluating your first machine learning model." },
    { title: "Cultural Festival", date: "2026-10-02", time: "17:00", location: "College Auditorium", description: "An evening of music, dance and food stalls run by student clubs." },
    { title: "Tech Hackathon 2026", date: "2026-10-15", time: "10:00", location: "Main Auditorium, Block B", description: "Join us for a 24 hour coding challenge. Teams of up to four. Prizes for the top three." },
  ];
  for (let e = 0; e < eventDefs.length; e++) {
    const d = eventDefs[e];
    const eid = (await db.query(
      "INSERT INTO events (title, event_date, event_time, location, description, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [d.title, d.date, d.time, d.location, d.description, admin],
    )).rows[0].id;
    for (let s = e; s < others.length; s += 2 + e) {
      await db.query("INSERT INTO event_registrations (event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [eid, others[s].id]);
    }
  }

  // ---- career results and assessment attempts for most students (deterministic, not random) ----
  const careerQs = content.career as CareerQuestion[];
  for (let s = 0; s < others.length - 2; s++) {
    const answers: Record<string, number> = {};
    careerQs.forEach((q, qi) => (answers[q.id] = (s + qi) % q.options.length));
    const r = scoreCareer(careerQs, answers);
    await db.query(
      "INSERT INTO career_results (user_id, overall, label, categories, improvements, gaps, answers) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [others[s].id, r.overall, r.label, JSON.stringify(r.categories), JSON.stringify(r.improvements), JSON.stringify(r.gaps), JSON.stringify(answers)],
    );
  }
  const meta = { id: a.id, title: a.title, minutes: a.minutes, passingScore: a.passingScore };
  for (let s = 0; s < others.length - 3; s++) {
    const answers: Record<string, number> = {};
    a.questions.forEach((q: any, qi: number) => (answers[q.id] = (s + qi) % 5 === 0 ? (q.correctIndex + 1) % 4 : q.correctIndex));
    const r = scoreAssessment(meta, a.questions, answers, 420 + s * 45, "2026-09-18");
    await db.query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score_percent, passed, result) VALUES ($1,$2,$3,$4,$5)",
      [a.id, others[s].id, r.scorePercent, r.passed, JSON.stringify(r)],
    );
  }

  console.log(`Demo data added: ${students.length} students, 2 polls, 3 events.`);
  console.log("Logins: john@college.edu / Password123   admin@college.edu / Admin1234");
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
