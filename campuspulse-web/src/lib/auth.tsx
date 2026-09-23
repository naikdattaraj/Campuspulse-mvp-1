"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, request, USE_MOCK } from "./http";
import { DEMO_ACCOUNTS } from "./mockData";
import type { Role } from "./types";

export type User = { name: string; email: string; role: Role };
type Stored = User & { password: string };
type AuthResult = { ok: true; user: User } | { ok: false; error: string };
type Session = { token: string; user: User };

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string, role: Role) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_KEY = "cp_session";
const USERS_KEY = "cp_users"; // mock mode only
const TOKEN_KEY = "cp_token"; // real mode only

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function hasToken() {
  try {
    return !!localStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = read<User | null>(SESSION_KEY, null);
    setUser(saved && (USE_MOCK || hasToken()) ? saved : null);
    setReady(true);
  }, []);

  const start = (s: Session) => {
    if (!USE_MOCK) {
      try {
        localStorage.setItem(TOKEN_KEY, s.token);
      } catch {}
    }
    write(SESSION_KEY, s.user);
    setUser(s.user);
  };

  const remote = async (path: string, body: object): Promise<AuthResult> => {
    try {
      const s = await request<Session>(path, {
        method: "POST",
        body,
        mock: () => {
          throw new Error("unreachable in mock mode");
        },
      });
      start(s);
      return { ok: true, user: s.user };
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : "Something went wrong. Try again." };
    }
  };

  const login: AuthCtx["login"] = useCallback(async (email, password, role) => {
    if (!USE_MOCK) return remote("/auth/login", { email, password, role });

    const all = [...DEMO_ACCOUNTS, ...read<Stored[]>(USERS_KEY, [])];
    const found = all.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) return { ok: false, error: "Email or password is incorrect." };
    if (found.role !== role) {
      return { ok: false, error: `This account is registered as ${found.role}. Switch the role and try again.` };
    }
    const user = { name: found.name, email: found.email, role: found.role };
    start({ token: "", user });
    return { ok: true, user };
  }, []);

  const register: AuthCtx["register"] = useCallback(async (name, email, password) => {
    if (!USE_MOCK) return remote("/auth/register", { name, email, password });

    const all = [...DEMO_ACCOUNTS, ...read<Stored[]>(USERS_KEY, [])];
    if (all.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists. Log in instead." };
    }
    const role: Role = "student";
    write(USERS_KEY, [...read<Stored[]>(USERS_KEY, []), { name, email, password, role }]);
    const user = { name, email, role };
    start({ token: "", user });
    return { ok: true, user };
  }, []);

  const logout = useCallback(() => {
    remove(SESSION_KEY);
    remove(TOKEN_KEY);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}