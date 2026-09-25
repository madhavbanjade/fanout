"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import type { UserProfile } from "@/src/types";
import SecretInput from "./secret-input";

type Tab = "overview" | "security" | "sessions";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "security", label: "Security" },
  { key: "sessions", label: "Active sessions" },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function Banner({ kind, message }: { kind: "error" | "success"; message: string }) {
  return (
    <p
      className="mt-3 rounded-md px-3 py-2"
      style={{
        fontSize: "var(--text-sm)",
        background: kind === "error" ? "var(--color-danger-bg)" : "var(--color-success-bg)",
        color: kind === "error" ? "var(--color-danger)" : "var(--color-success)",
      }}
      role={kind === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="flex flex-col gap-1.5"
      style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}
    >
      {children}
    </label>
  );
}

function OverviewTab({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    const response = await fetchAPI<UserProfile>({
      endPoint: "users/me/profile",
      method: "PATCH",
      data: {
        name: String(formData.get("name") ?? "").trim(),
        bio: String(formData.get("bio") ?? "").trim(),
        timezone: String(formData.get("timezone") ?? "").trim(),
      },
    });
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    queryClient.setQueryData<UserProfile>(["profile"], (current) =>
      current ? { ...current, ...response.data } : response.data,
    );
    setSuccess("Profile updated.");
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <form onSubmit={handleSubmit} className="card min-w-0 flex-1 p-6">
        <p className="section-label">Personal information</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormLabel>
            Full name
            <input name="name" defaultValue={profile.name} required maxLength={80} className="input" />
          </FormLabel>
          <FormLabel>
            Email
            <input value={profile.email} disabled className="input" style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </FormLabel>
        </div>
        <div className="mt-4">
          <FormLabel>
            Bio
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={280}
              rows={3}
              className="input"
              style={{ resize: "vertical" }}
            />
          </FormLabel>
        </div>
        <div className="mt-4 max-w-xs">
          <FormLabel>
            Timezone
            <input name="timezone" defaultValue={profile.timezone ?? ""} placeholder="America/New_York" className="input" />
          </FormLabel>
        </div>

        {error && <Banner kind="error" message={error} />}
        {success && <Banner kind="success" message={success} />}

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-5">
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="card h-fit w-full p-6 lg:w-64">
        <p className="section-label">Account</p>
        <dl className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <dt className="text-muted">Role</dt>
            <dd style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{profile.role}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">Sent</dt>
            <dd style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{profile.sentCount}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">Member since</dt>
            <dd style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
              {formatMemberSince(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetchAPI({
      endPoint: "users/me/password",
      method: "POST",
      data: { currentPassword: String(formData.get("currentPassword") ?? ""), newPassword },
    });
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    form.reset();
    setSuccess("Password updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <p className="section-label">Change password</p>
      <div className="mt-4 flex flex-col gap-4">
        <FormLabel>
          Current password
          <SecretInput id="currentPassword" name="currentPassword" placeholder="••••••••" autoComplete="current-password" required />
        </FormLabel>
        <FormLabel>
          New password
          <SecretInput id="newPassword" name="newPassword" placeholder="Min 8 characters" autoComplete="new-password" minLength={8} required />
        </FormLabel>
        <FormLabel>
          Confirm new password
          <SecretInput id="confirmPassword" name="confirmPassword" placeholder="Repeat new password" autoComplete="new-password" minLength={8} required />
        </FormLabel>
      </div>

      {error && <Banner kind="error" message={error} />}
      {success && <Banner kind="success" message={success} />}

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-5">
        {isSubmitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

function ChangePinCard({ pinSet }: { pinSet: boolean }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPin = String(formData.get("newPin") ?? "");
    const confirmPin = String(formData.get("confirmPin") ?? "");

    if (!/^\d{4,6}$/.test(newPin)) {
      setError("PIN must be 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PINs don't match.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetchAPI({
      endPoint: "users/me/pin",
      method: "POST",
      data: { currentPassword: String(formData.get("currentPassword") ?? ""), newPin },
    });
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    form.reset();
    setSuccess(pinSet ? "PIN updated." : "PIN set.");
    queryClient.setQueryData<UserProfile>(["profile"], (current) => (current ? { ...current, pinSet: true } : current));
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <p className="section-label">{pinSet ? "Change PIN" : "Set a PIN"}</p>
      <p className="text-muted mt-1">A 4–6 digit PIN used as a quick secondary code for this account.</p>
      <div className="mt-4 flex flex-col gap-4">
        <FormLabel>
          Current password
          <SecretInput id="pinCurrentPassword" name="currentPassword" placeholder="••••••••" autoComplete="current-password" required />
        </FormLabel>
        <FormLabel>
          {pinSet ? "New PIN" : "PIN"}
          <SecretInput id="newPin" name="newPin" placeholder="4–6 digits" inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} required />
        </FormLabel>
        <FormLabel>
          Confirm {pinSet ? "new PIN" : "PIN"}
          <SecretInput id="confirmPin" name="confirmPin" placeholder="Repeat PIN" inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} required />
        </FormLabel>
      </div>

      {error && <Banner kind="error" message={error} />}
      {success && <Banner kind="success" message={success} />}

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-5">
        {isSubmitting ? "Saving…" : pinSet ? "Update PIN" : "Set PIN"}
      </button>
    </form>
  );
}

function DeleteAccountCard() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const confirmText = String(formData.get("confirmText") ?? "");
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm.');
      return;
    }

    setIsSubmitting(true);
    const response = await fetchAPI({
      endPoint: "users/me",
      method: "DELETE",
      data: { currentPassword: String(formData.get("currentPassword") ?? "") },
    });
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="card p-6" style={{ border: "1px solid var(--color-danger)" }}>
      <p className="section-label" style={{ color: "var(--color-danger)" }}>
        Danger zone
      </p>
      <p className="text-muted mt-1">
        Permanently delete your account and personal data. Notifications you sent to other users stay in their history,
        just no longer attributed to you. This can&apos;t be undone.
      </p>

      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="btn-outline mt-4" style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>
          Delete account
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <FormLabel>
            Current password
            <SecretInput id="deleteCurrentPassword" name="currentPassword" placeholder="••••••••" autoComplete="current-password" required />
          </FormLabel>
          <FormLabel>
            Type DELETE to confirm
            <input name="confirmText" placeholder="DELETE" required className="input" />
          </FormLabel>

          {error && <Banner kind="error" message={error} />}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ background: "var(--color-danger)" }}
            >
              {isSubmitting ? "Deleting…" : "Permanently delete account"}
            </button>
            <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SecurityTab({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex flex-col gap-4">
      <ChangePasswordCard />
      <ChangePinCard pinSet={profile.pinSet} />
      <DeleteAccountCard />
    </div>
  );
}

function SessionsTab() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await fetchAPI({ endPoint: "auth/logout", method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="card p-6">
      <p className="section-label">Active sessions</p>
      <div className="mt-4 flex items-center justify-between rounded-md px-4 py-3" style={{ border: "1px solid var(--color-border)" }}>
        <div>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
            This device{" "}
            <span
              className="ml-1 rounded-full px-2 py-0.5 align-middle uppercase"
              style={{ fontSize: "var(--text-overline)", background: "var(--color-success-bg)", color: "var(--color-success)" }}
            >
              Current
            </span>
          </p>
          <p className="text-muted mt-0.5">Active now</p>
        </div>
        <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="btn-outline" style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <p className="text-muted mt-4">
        Tracking sessions across other browsers or devices isn&apos;t implemented yet — this shows only the session you&apos;re using right now.
      </p>
    </div>
  );
}

export default function ProfileView({ initialProfile }: { initialProfile: UserProfile | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetchAPI<UserProfile>({ endPoint: "users/me/profile" });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    initialData: initialProfile ?? undefined,
  });

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-white"
            style={{ background: "var(--gradient-avatar)", fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)" }}
          >
            {initialsOf(profile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                {profile.name}
              </h1>
              {profile.role === "ADMIN" && (
                <span
                  className="rounded-full px-2 py-0.5 align-middle"
                  style={{ fontSize: "var(--text-xs)", background: "var(--color-primary-08)", color: "var(--color-primary)" }}
                >
                  Admin
                </span>
              )}
            </div>
            <p className="text-muted mt-0.5">{profile.email}</p>
            {profile.bio && <p className="text-muted mt-1">{profile.bio}</p>}
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                {profile.sentCount.toLocaleString()}
              </p>
              <p className="text-muted">Sent</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                {formatMemberSince(profile.createdAt)}
              </p>
              <p className="text-muted">Member since</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-1" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="px-3 pb-3"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: activeTab === tab.key ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === tab.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && <OverviewTab profile={profile} />}
        {activeTab === "security" && <SecurityTab profile={profile} />}
        {activeTab === "sessions" && <SessionsTab />}
      </div>
    </main>
  );
}
