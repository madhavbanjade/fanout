"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import type { AuthUser, RegisteredUser } from "@/src/types";
import SectionNav, { type SectionNavItem } from "@/src/components/layout/section-nav";

const TYPE_OPTIONS = [
  { value: "mention", label: "Mention" },
  { value: "order", label: "Order update" },
  { value: "task", label: "Task assigned" },
  { value: "system", label: "System alert" },
];

const ORDER_CATEGORIES = [
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
];

const SYSTEM_CATEGORIES = [
  { value: "security", label: "Security alert (required — always delivered, always to everyone)" },
  { value: "updates", label: "Product update (recipients can opt out)" },
];

const CHANNELS = [
  { key: "in-app", label: "In-app", enabled: true },
  { key: "push", label: "Browser push", enabled: false },
  { key: "email", label: "Email", enabled: false },
];

const SIDEBAR_ITEMS: SectionNavItem[] = [
  { key: "send", label: "Send notification", icon: <SendIcon /> },
  { key: "templates", label: "Templates", icon: <TemplateIcon />, disabled: true },
  { key: "logs", label: "Delivery logs", icon: <LogsIcon />, disabled: true },
  { key: "settings", label: "Settings", icon: <GearIcon /> },
];

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function AdminPanel({ onLock }: { onLock: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("send");
  const [recipientMode, setRecipientMode] = useState<"single" | "all">("single");
  const [targetUserId, setTargetUserId] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0].value);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await fetchAPI<AuthUser>({ endPoint: "auth/me" });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await fetchAPI<RegisteredUser[]>({ endPoint: "users" });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const selectedTypeLabel = useMemo(
    () => TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type,
    [type],
  );

  function handleTypeChange(nextType: string) {
    setType(nextType);
    if (nextType === "order") setCategory(ORDER_CATEGORIES[0].value);
    else if (nextType === "system") setCategory(SYSTEM_CATEGORIES[0].value);
    else setCategory(undefined);

    // System alerts always go to every registered user — lock the recipient
    // picker to "all" so the UI can't imply otherwise.
    if (nextType === "system") setRecipientMode("all");
  }

  async function handleLock() {
    await fetchAPI({ endPoint: "auth/admin/lock", method: "POST" });
    onLock();
  }

  function handleSectionSelect(key: string) {
    if (key === "settings") {
      router.push("/settings");
      return;
    }
    setActiveTab(key);
  }

  async function dispatch(targetOverride?: string) {
    setIsSending(true);
    setFeedback(null);

    const payload = { title: title.trim() || undefined, message: message.trim(), category };

    if (recipientMode === "all" && !targetOverride) {
      const response = await fetchAPI<{ sentTo: number; suppressed: number }>({
        endPoint: "notifications/admin/broadcast",
        method: "POST",
        data: { type, payload },
      });
      setIsSending(false);

      if (!response.success) {
        setFeedback({ kind: "error", text: response.error });
        return;
      }

      const suppressedNote =
        response.data.suppressed > 0 ? ` (${response.data.suppressed} have this notification type turned off)` : "";
      setFeedback({ kind: "success", text: `Sent to ${response.data.sentTo} registered users${suppressedNote}.` });
    } else {
      const response = await fetchAPI<{ suppressed: true } | { id: string }>({
        endPoint: "notifications/admin/send",
        method: "POST",
        data: { targetUserId: targetOverride ?? targetUserId, type, payload },
      });
      setIsSending(false);

      if (!response.success) {
        setFeedback({ kind: "error", text: response.error });
        return;
      }

      const recipientId = targetOverride ?? targetUserId;
      const recipient = users.find((user) => user.id === recipientId);

      if ("suppressed" in response.data) {
        setFeedback({
          kind: "error",
          text: `${recipient?.name ?? "This user"} has this notification type turned off in Settings.`,
        });
      } else {
        setFeedback({ kind: "success", text: `Sent to ${recipient?.name ?? "user"}.` });
      }
    }

    setMessage("");
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    if (recipientMode === "single" && !targetUserId) return;
    await dispatch();
  }

  async function handleSendTestToMyself() {
    if (!message.trim() || !me) return;
    await dispatch(me.id);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <SectionNav items={SIDEBAR_ITEMS} activeKey={activeTab} onSelect={handleSectionSelect} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1
                style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}
              >
                Send notification
              </h1>
              <p className="text-muted mt-1">Compose and deliver a notification to users.</p>
            </div>
            <button type="button" className="btn-outline" onClick={handleLock}>
              Lock
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
            <form className="card space-y-4 p-6" onSubmit={handleSend}>
              <div>
                <span className="section-label">Recipient</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1"
                    disabled={type === "system"}
                    style={{
                      fontSize: "var(--text-xs)",
                      border: "1px solid var(--color-border)",
                      background: recipientMode === "all" ? "var(--color-primary-08)" : "transparent",
                      color: recipientMode === "all" ? "var(--color-primary)" : "var(--color-text-muted)",
                      opacity: type === "system" ? 0.7 : 1,
                    }}
                    onClick={() => setRecipientMode(recipientMode === "all" ? "single" : "all")}
                  >
                    all-users
                  </button>
                </div>
                {recipientMode === "single" ? (
                  <select
                    className="input mt-2 w-full"
                    value={targetUserId}
                    onChange={(event) => setTargetUserId(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {isLoading ? "Loading users…" : "Select a registered user"}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-muted mt-2" style={{ fontSize: "var(--text-sm)" }}>
                    {type === "system"
                      ? `System alerts always go to all ${users.length} registered users.`
                      : `This will send to all ${users.length} registered users.`}
                  </p>
                )}
              </div>

              <label className="block">
                <span className="section-label">Notification type</span>
                <select className="input mt-2 w-full" value={type} onChange={(event) => handleTypeChange(event.target.value)}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {type === "order" && (
                <label className="block">
                  <span className="section-label">Order event</span>
                  <select className="input mt-2 w-full" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {ORDER_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {type === "system" && (
                <label className="block">
                  <span className="section-label">System category</span>
                  <select className="input mt-2 w-full" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {SYSTEM_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="section-label">Title</span>
                <input
                  className="input mt-2 w-full"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Sara mentioned you"
                />
              </label>

              <label className="block">
                <span className="section-label">Message</span>
                <textarea
                  className="input mt-2 w-full"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write the notification body…"
                  required
                />
              </label>

              <div>
                <span className="section-label">Channels</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNELS.map((channel) => (
                    <span
                      key={channel.key}
                      className="rounded-md px-3 py-1.5"
                      style={{
                        fontSize: "var(--text-xs)",
                        border: `1px solid ${channel.enabled ? "var(--color-primary)" : "var(--color-border)"}`,
                        color: channel.enabled ? "var(--color-primary)" : "var(--color-text-muted)",
                        opacity: channel.enabled ? 1 : 0.6,
                      }}
                      title={channel.enabled ? undefined : "Not wired up yet — this demo only delivers in-app"}
                    >
                      {channel.label}
                      {!channel.enabled && " · Soon"}
                    </span>
                  ))}
                </div>
              </div>

              {feedback && (
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: feedback.kind === "success" ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  {feedback.text}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={handleSendTestToMyself} disabled={isSending || !me}>
                  Send test to myself
                </button>
                <button type="submit" className="btn-primary" disabled={isSending}>
                  {isSending ? "Sending…" : "Send"}
                </button>
              </div>
            </form>

            <aside>
              <p className="overline-label">Live preview</p>
              <article className="card mt-2 p-4" style={{ boxShadow: "var(--shadow-preview)" }}>
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: "var(--gradient-avatar)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)" }}
                  >
                    {me ? initialsOf(me.name) : "?"}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}
                    >
                      {title.trim() || "Notification title"}
                    </p>
                    <p className="text-muted mt-0.5 line-clamp-2" style={{ fontSize: "var(--text-sm)" }}>
                      {message.trim() || "Your notification body will appear here…"}
                    </p>
                    <p className="mono-data mt-1">Just now · {selectedTypeLabel}</p>
                  </div>
                </div>
              </article>
              <p className="text-muted mt-2 text-center" style={{ fontSize: "var(--text-xs)" }}>
                Updates live as you type
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
