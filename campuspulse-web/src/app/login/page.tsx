"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarDays, CheckCircle2, Vote } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

type Mode = "login" | "signup" | "forgot";
type Errors = Partial<Record<"name" | "email" | "password" | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { user, ready, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(user.role === "admin" ? "/admin" : "/dashboard");
  }, [ready, user, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setSent(false);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Enter your full name.";
    if (!EMAIL_RE.test(email)) e.email = "Enter a valid college email, like name@college.edu.";
    if (mode !== "forgot") {
      if (mode === "signup") {
        if (password.length < 8 || !/\d/.test(password)) e.password = "Use at least 8 characters, including a number.";
      } else if (!password) e.password = "Enter your password.";
    }
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    if (mode === "forgot") {
      setSent(true);
      return;
    }

    setBusy(true);
    const res =
      mode === "login" ? await login(email, password, role) : await register(name.trim(), email, password);
    setBusy(false);

    if (!res.ok) return setErrors({ form: res.error });
    router.replace(res.user.role === "admin" ? "/admin" : "/dashboard");
  };

  const title = mode === "login" ? "Log in" : mode === "signup" ? "Create your account" : "Reset your password";
  const sub =
    mode === "login"
      ? "Welcome back. Pick your role and sign in."
      : mode === "signup"
      ? "Use your college email to get started. New accounts are created as students — see an admin for staff access."
      : "Enter your college email and we will send a reset link.";

  return (
    <main className="auth">
      <section className="auth-brand" aria-label="About AI CampusPulse">
        <span style={{ color: "inherit" }}><Logo /></span>
        <div style={{ display: "grid", gap: 16 }}>
          <h1>One place for everything happening on campus.</h1>
          <p>Vote on campus decisions, test your skills, and see how career-ready you are.</p>
        </div>
        <ul>
          <li><Vote size={20} /> Have your say in live campus polls</li>
          <li><CheckCircle2 size={20} /> Take assessments and get your career score</li>
          <li><CalendarDays size={20} /> Register for workshops and events</li>
          <li><BarChart3 size={20} /> Track your engagement over time</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {mode !== "forgot" && (
            <div className="tabs" role="tablist" aria-label="Account">
              <button role="tab" className="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>
                Log in
              </button>
              <button role="tab" className="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")}>
                Sign up
              </button>
            </div>
          )}

          <h2>{title}</h2>
          <p className="sub">{sub}</p>

          <form onSubmit={onSubmit} noValidate>
            {errors.form && <div className="form-error" role="alert">{errors.form}</div>}
            {sent && (
              <div className="form-note" role="status">
                If {email} has an account, a reset link is on its way.
              </div>
            )}

            {mode === "login" && (
              <fieldset className="roles">
                <legend className="legend" style={{ marginBottom: 8 }}>I am a</legend>
                <label className="role">
                  <input type="radio" name="role" checked={role === "student"} onChange={() => setRole("student")} />
                  Student
                </label>
                <label className="role">
                  <input type="radio" name="role" checked={role === "admin"} onChange={() => setRole("admin")} />
                  Admin
                </label>
              </fieldset>
            )}

            {mode === "signup" && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
                {errors.name && <span id="name-err" className="field-error">{errors.name}</span>}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">College email</label>
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="name@college.edu"
                aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
              {errors.email && <span id="email-err" className="field-error">{errors.email}</span>}
            </div>

            {mode !== "forgot" && (
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" className="input" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-invalid={!!errors.password} aria-describedby={errors.password ? "pw-err" : undefined} />
                {errors.password && <span id="pw-err" className="field-error">{errors.password}</span>}
              </div>
            )}

            {mode === "login" && (
              <div className="row-between">
                <span />
                <button type="button" className="btn-link" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              </div>
            )}

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
            </button>

            {mode === "forgot" && (
              <p style={{ marginTop: 16, textAlign: "center" }}>
                <button type="button" className="btn-link" onClick={() => switchMode("login")}>Back to log in</button>
              </p>
            )}
          </form>

          
        </div>
      </section>
    </main>
  );
}