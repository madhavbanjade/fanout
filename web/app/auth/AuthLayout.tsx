"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/src/utils/apiservice";

type AuthMode = "login" | "signup";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
}

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  name: string;
}

const notificationItems = [
  { initials: "SC", color: "blue", title: 'Sara Chen assigned you a task: "Finalize Q4 budget"', meta: "Just now · Task" },
  { initials: "MW", color: "green", title: "Your leave request for Oct 3–5 was approved", meta: "14 min ago · Leave" },
  { initials: "PK", color: "orange", title: "Team standup moved to 10:30 AM tomorrow", meta: "1 hr ago · Meeting" },
] as const;

export default function AuthLayout() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    setIsPasswordVisible(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setIsSubmitting(true);

    if (isSignup) {
      const name = String(formData.get("name") ?? "").trim();
      const response = await fetchAPI<{ user: AuthUser }, SignupFormData>({
        endPoint: "auth/signup",
        method: "POST",
        data: { name, email, password },
      });
      setIsSubmitting(false);

      if (!response.success) {
        setError(response.error);
        return;
      }

      form.reset();
      setSuccess("Your account is ready. Sign in to continue.");
      setMode("login");
      return;
    }

    const response = await fetchAPI<{ user: AuthUser }, LoginFormData>({
      endPoint: "auth/login",
      method: "POST",
      data: { email, password },
    });
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }

    form.reset();
    // The root layout fetched auth/me server-side before this login request
    // set the accessToken cookie, so its cached render still has user: null.
    // router.refresh() invalidates that cache so the nav shows immediately
    // instead of only after a manual reload.
    router.refresh();
    router.push("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase" aria-label="Notifyr product overview">
        <div className="auth-brand"><span className="auth-brand-icon" aria-hidden="true">♧</span>Fanout</div>
        <div className="auth-showcase-content">
          <h1>Every notification,<br /><span>delivered reliably.</span></h1>
          <p>One API for in-app, push, and email. Built for teams that can&apos;t afford to miss.</p>
          <div className="notification-stack">
            {notificationItems.map((item) => (
              <article className="notification-card" key={item.initials}>
                <span className={`notification-avatar ${item.color}`}>{item.initials}</span>
                <span><strong>{item.title}</strong><small>{item.meta}</small></span>
                <i aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
        <div className="auth-metrics" aria-label="Service metrics">
          <span><strong>2.4M</strong><small>sent today</small></span>
          <span><strong>99.98%</strong><small>uptime</small></span>
          <span><strong>183ms</strong><small>avg latency</small></span>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" key={mode} onSubmit={handleSubmit}>
          <header>
            <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{isSignup ? "Start delivering notifications reliably." : "Sign in to your Notifyr account"}</p>
          </header>

          {isSignup && <label htmlFor="name">Full name<input id="name" name="name" type="text" autoComplete="name" minLength={2} required placeholder="Your name" /></label>}
          <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
          <label htmlFor="password">Password
            <span className="password-field">
              <input id="password" name="password" type={isPasswordVisible ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required placeholder="Password" />
              <button className="password-toggle" type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible}>
                {isPasswordVisible ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.9 10.9 0 0 1 12 4c5.2 0 8.6 4.3 9.6 6.1a1.8 1.8 0 0 1 0 1.8 16.1 16.1 0 0 1-3.1 3.8M6.6 6.6a16.6 16.6 0 0 0-4.2 3.5 1.8 1.8 0 0 0 0 1.8C3.5 13.7 6.8 18 12 18c.8 0 1.5-.1 2.2-.3" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.4 10.1C3.4 8.3 6.8 4 12 4s8.6 4.3 9.6 6.1a1.8 1.8 0 0 1 0 1.8C20.6 13.7 17.2 18 12 18S3.4 13.7 2.4 11.9a1.8 1.8 0 0 1 0-1.8Z" /><circle cx="12" cy="11" r="3" /></svg>
                )}
              </button>
            </span>
          </label>

          {error && <p className="auth-message error" role="alert">{error}</p>}
          {success && <p className="auth-message success" role="status">{success}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>
          <p className="auth-switch">{isSignup ? "Already have an account?" : "No account?"}{" "}<button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>{isSignup ? "Log in" : "Sign up free"}</button></p>
        </form>
      </section>
    </main>
  );
}
