"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import type { NotificationPreferences } from "@/src/types";
import SectionNav, { type SectionNavItem } from "@/src/components/layout/section-nav";
import ToggleRow from "./toggle-row";
import {
  ClockIcon,
  CommentIcon,
  MentionIcon,
  MoonIcon,
  PackageIcon,
  PersonIcon,
  RefreshIcon,
  ShieldIcon,
} from "./icons";

const SIDEBAR_ITEMS: SectionNavItem[] = [
  { key: "notifications", label: "Notifications", icon: <MentionIcon /> },
  { key: "profile", label: "Profile", icon: <PersonIcon />, disabled: true },
  { key: "appearance", label: "Appearance", icon: <MoonIcon />, disabled: true },
  { key: "api-keys", label: "API keys", icon: <ShieldIcon />, disabled: true },
  { key: "billing", label: "Billing", icon: <PackageIcon />, disabled: true },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  mentions: true,
  taskAssigned: true,
  taskUpdates: true,
  leaveUpdates: true,
  meetingUpdates: true,
  announcements: true,
  systemSecurity: true,
  quietHoursEnabled: false,
};

function SectionCard({
  dotColor,
  label,
  children,
}: {
  dotColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card mt-4 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: dotColor }} />
        <span className="section-label">{label}</span>
      </div>
      {children}
    </section>
  );
}

export default function SettingsView({ initialPreferences }: { initialPreferences: NotificationPreferences | null }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("notifications");

  const { data: preferences } = useQuery({
    queryKey: ["settings", "preferences"],
    queryFn: async () => {
      const response = await fetchAPI<NotificationPreferences>({ endPoint: "users/me/preferences" });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    initialData: initialPreferences ?? DEFAULT_PREFERENCES,
  });

  async function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    queryClient.setQueryData<NotificationPreferences>(["settings", "preferences"], (current) =>
      current ? { ...current, [key]: value } : current,
    );
    await fetchAPI({
      endPoint: "users/me/preferences",
      method: "PATCH",
      data: { [key]: value },
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <SectionNav heading="Settings" items={SIDEBAR_ITEMS} activeKey={activeSection} onSelect={setActiveSection} />

        <div className="min-w-0 flex-1">
          {activeSection === "notifications" ? (
            <>
              <h1
                style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}
              >
                Notification settings
              </h1>
              <p className="text-muted mt-1">Control what you&apos;re notified about and when.</p>

              <SectionCard dotColor="var(--color-section-activity)" label="Activity">
                <ToggleRow
                  icon={<MentionIcon />}
                  iconBg="var(--color-primary-08)"
                  iconColor="var(--color-primary)"
                  title="Mentions"
                  description="When someone @mentions you in a comment or document"
                  checked={preferences.mentions}
                  onChange={(value) => updatePreference("mentions", value)}
                />
              </SectionCard>

              <SectionCard dotColor="var(--color-section-orders)" label="Tasks & meetings">
                <ToggleRow
                  icon={<ClockIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Task assigned"
                  description="When a task is assigned to you"
                  checked={preferences.taskAssigned}
                  onChange={(value) => updatePreference("taskAssigned", value)}
                />
                <ToggleRow
                  icon={<PackageIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Task updates"
                  description="Completed, overdue, or updated tasks"
                  checked={preferences.taskUpdates}
                  onChange={(value) => updatePreference("taskUpdates", value)}
                />
                <ToggleRow
                  icon={<CommentIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Meetings"
                  description="Scheduled, rescheduled, or cancelled meetings"
                  checked={preferences.meetingUpdates}
                  onChange={(value) => updatePreference("meetingUpdates", value)}
                />
                <ToggleRow
                  icon={<PersonIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Leave requests & updates"
                  description="Leave requested, approved, or rejected"
                  checked={preferences.leaveUpdates}
                  onChange={(value) => updatePreference("leaveUpdates", value)}
                />
              </SectionCard>

              <SectionCard dotColor="var(--color-section-system)" label="Company">
                <ToggleRow
                  icon={<RefreshIcon />}
                  iconBg="var(--color-danger-bg)"
                  iconColor="var(--color-danger)"
                  title="Announcements"
                  description="General company-wide announcements from the admin"
                  checked={preferences.announcements}
                  onChange={(value) => updatePreference("announcements", value)}
                />
                <ToggleRow
                  icon={<ShieldIcon />}
                  iconBg="var(--color-danger-bg)"
                  iconColor="var(--color-danger)"
                  title="Security alerts"
                  description="Sign-ins from a new device or suspicious activity — sent to every user and can't be turned off"
                  checked={true}
                  onChange={() => {}}
                  disabled
                  required
                />
                <p className="text-muted px-5 py-3" style={{ fontSize: "var(--text-xs)" }}>
                  Warning letters, termination notices, and resignation confirmations are always delivered and can&apos;t be muted.
                </p>
              </SectionCard>

              <SectionCard dotColor="var(--color-section-quiet)" label="Quiet hours">
                <ToggleRow
                  icon={<MoonIcon />}
                  iconBg="rgba(155, 89, 182, 0.12)"
                  iconColor="var(--color-section-quiet)"
                  title="Enable quiet hours"
                  description="Pause non-urgent notifications during set hours"
                  checked={preferences.quietHoursEnabled}
                  onChange={(value) => updatePreference("quietHoursEnabled", value)}
                />
              </SectionCard>
            </>
          ) : (
            <div className="card mt-1 p-10 text-center">
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                This section isn&apos;t built yet — coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
