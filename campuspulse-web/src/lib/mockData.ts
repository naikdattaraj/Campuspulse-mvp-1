import type { Role } from "./types";

export const DEMO_ACCOUNTS: { name: string; email: string; password: string; role: Role }[] = [
  { name: "John Fernandes", email: "john@college.edu", password: "Password123", role: "student" },
  { name: "Admin Faculty", email: "admin@college.edu", password: "Admin1234", role: "admin" },
];

export const notifications = [
  { id: 1, text: "New poll: Elective selection closes 10 Oct", time: "2h ago" },
  { id: 2, text: "Software Testing Quiz is open for 3 more days", time: "Yesterday" },
  { id: 3, text: "AI Workshop registrations are open", time: "2 days ago" },
];

