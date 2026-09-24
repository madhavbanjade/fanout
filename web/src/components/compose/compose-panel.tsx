"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import type { AuthUser, RegisteredUser } from "@/src/types";

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "meeting", label: "Meeting" },
  { value: "leave", label: "Leave request" },
  { value: "mention", label: "Mention" },
  { value: "resignation", label: "Resignation letter" },
];

const ADMIN_ONLY_TYPE_OPTIONS = [
  { value: "announcement", label: "Company announcement" },
  { value: "warning", label: "Warning letter" },
  { value: "termination", label: "Termination letter" },
  { value: "system", label: "System / security alert" },
];

const ADMIN_ONLY_TYPES = new Set(ADMIN_ONLY_TYPE_OPTIONS.map((option) => option.value));

const TASK_CATEGORIES = [
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "updated", label: "Updated" },
];

const LEAVE_CATEGORIES = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const MEETING_CATEGORIES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
];

const CATEGORY_OPTIONS_BY_TYPE: Record<string, typeof TASK_CATEGORIES> = {
  task: TASK_CATEGORIES,
  leave: LEAVE_CATEGORIES,
  meeting: MEETING_CATEGORIES,
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function ComposePanel({ user }: { user: AuthUser }) {
  const isAdmin = user.role === "ADMIN";
  const queryClient = useQueryClient();
  const [recipientMode, setRecipientMode] = useState<"single" | "all">("single");
  const [targetUserId, setTargetUserId] = useState("");
  const [type, setType] = useState(EMPLOYEE_TYPE_OPTIONS[0].value);
  const [category, setCategory] = useState<string | undefined>(TASK_CATEGORIES[0].value);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const typeOptions = isAdmin ? [...EMPLOYEE_TYPE_OPTIONS, ...ADMIN_ONLY_TYPE_OPTIONS] : EMPLOYEE_TYPE_OPTIONS;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["compose", "users"],
    queryFn: async () => {
      const response = await fetchAPI<RegisteredUser[]>({ endPoint: "users" });
      if (!response.success) throw new Error(response.error);
      return response.data.filter((candidate) => candidate.id !== user.id);
    },
  });

  const selectedTypeLabel = useMemo(
    () => typeOptions.find((option) => option.value === type)?.label ?? type,
    [type, typeOptions],
  );

  const categoryOptions = CATEGORY_OPTIONS_BY_TYPE[type];

  function handleTypeChange(nextType: string) {
    setType(nextType);
    setCategory(CATEGORY_OPTIONS_BY_TYPE[nextType]?.[0]?.value);
  }

  async function dispatch(targetOverride?: string) {
    setIsSending(true);
    setFeedback(null);

    const payload = { title: title.trim() || undefined, message: message.trim(), category };

    if (isAdmin && recipientMode === "all" && !targetOverride) {
      const response = await fetchAPI<{ sentTo: number; suppressed: number }>({
        endPoint: "notifications/broadcast",
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
      const targetId = targetOverride ?? targetUserId;
      const response = await fetchAPI<{ suppressed: true } | { id: string }>({
        endPoint: "notifications/send",
        method: "POST",
        data: { targetUserId: targetId, type, payload },
      });
      setIsSending(false);

      if (!response.success) {
        setFeedback({ kind: "error", text: response.error });
        return;
      }

      const recipient = users.find((candidate) => candidate.id === targetId);

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
    if (!message.trim()) return;
    await dispatch(user.id);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
        Send notification
      </h1>
      <p className="text-muted mt-1">
        {isAdmin
          ? "As the company admin, you can message any single employee or announce to everyone at once."
          : "Message any registered coworker — assign a task, invite them to a meeting, or send a leave request or resignation letter to the admin."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <form className="card space-y-4 p-6" onSubmit={handleSend}>
          <div>
            <span className="section-label">Recipient</span>
            {isAdmin && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md px-3 py-1"
                  style={{
                    fontSize: "var(--text-xs)",
                    border: "1px solid var(--color-border)",
                    background: recipientMode === "all" ? "var(--color-primary-08)" : "transparent",
                    color: recipientMode === "all" ? "var(--color-primary)" : "var(--color-text-muted)",
                  }}
                  onClick={() => setRecipientMode(recipientMode === "all" ? "single" : "all")}
                >
                  all-users
                </button>
              </div>
            )}
            {recipientMode === "single" || !isAdmin ? (
              <select
                className="input mt-2 w-full"
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
                required
              >
                <option value="" disabled>
                  {isLoading ? "Loading users…" : "Select a registered user"}
                </option>
                {users.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} — {candidate.email}
                    {candidate.role === "ADMIN" ? " (admin)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-muted mt-2" style={{ fontSize: "var(--text-sm)" }}>
                This will send to all {users.length} registered users.
              </p>
            )}
          </div>

          <label className="block">
            <span className="section-label">Notification type</span>
            <select className="input mt-2 w-full" value={type} onChange={(event) => handleTypeChange(event.target.value)}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {ADMIN_ONLY_TYPES.has(option.value) ? " (admin only)" : ""}
                </option>
              ))}
            </select>
          </label>

          {categoryOptions && (
            <label className="block">
              <span className="section-label">Event</span>
              <select className="input mt-2 w-full" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categoryOptions.map((option) => (
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
              placeholder="e.g. Finalize API docs"
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
            {isAdmin && (
              <button type="button" className="btn-outline" onClick={handleSendTestToMyself} disabled={isSending}>
                Send test to myself
              </button>
            )}
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
                {initialsOf(user.name)}
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
        </aside>
      </div>
    </main>
  );
}
