"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { fetchAPI } from "@/src/utils/apiservice";
import AdminPanel from "./admin-panel";

type Tab = "pin" | "password";

const PIN_LENGTH = 4;

export default function AdminGate() {
  const [tab, setTab] = useState<Tab>("pin");
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAPI<{ unlocked: boolean }>({ endPoint: "auth/admin/status" }).then((response) => {
      if (cancelled) return;
      if (response.success && response.data.unlocked) setUnlocked(true);
      setIsCheckingStatus(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isCheckingStatus) return null;

  if (unlocked) {
    return <AdminPanel onLock={() => setUnlocked(false)} />;
  }

  function resetPin() {
    setDigits(Array(PIN_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  async function submitPin(pin: string) {
    setError(null);
    setIsVerifying(true);
    const response = await fetchAPI({ endPoint: "auth/admin/verify-pin", method: "POST", data: { pin } });
    setIsVerifying(false);

    if (!response.success) {
      setError(response.error);
      resetPin();
      return;
    }
    setUnlocked(true);
  }

  function handleDigitChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (!digit) return;

    if (index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      return;
    }

    const fullPin = next.join("");
    if (fullPin.length === PIN_LENGTH) void submitPin(fullPin);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsVerifying(true);
    const response = await fetchAPI({
      endPoint: "auth/admin/verify-password",
      method: "POST",
      data: { password },
    });
    setIsVerifying(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    setUnlocked(true);
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--color-page-bg)" }}
    >
      <div className="w-full max-w-sm text-center">
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
          style={{ background: "var(--color-primary-18)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--color-primary)" strokeWidth="1.8" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>

        <h1
          className="mt-4"
          style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}
        >
          Admin access
        </h1>
        <p className="text-muted mt-2">This area is restricted. Enter your PIN to continue.</p>

        <div className="mt-6 inline-flex rounded-lg p-1" style={{ background: "var(--color-muted-bg)" }}>
          {(["pin", "password"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setError(null);
              }}
              className="rounded-md px-6 py-1.5 capitalize transition-colors"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                background: tab === value ? "var(--color-card-bg)" : "transparent",
                color: tab === value ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {value}
            </button>
          ))}
        </div>

        {tab === "pin" ? (
          <div className="mt-6 flex justify-center gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="input text-center"
                style={{ width: 52, height: 56, fontSize: "var(--text-xl)" }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isVerifying}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={submitPassword}>
            <input
              className="input w-full"
              type="password"
              placeholder="Your account password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={isVerifying}>
              {isVerifying ? "Verifying…" : "Unlock admin panel"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4" style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <p className="text-muted mt-6" style={{ fontSize: "var(--text-xs)" }}>
          Your PIN was shown once, right after your first login. Forgot it? Use the Password tab instead.
        </p>
      </div>
    </main>
  );
}
