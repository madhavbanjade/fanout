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
  TruckIcon,
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
  comments: true,
  newFollowers: false,
  orderShipped: true,
  orderDelivered: true,
  orderDelayed: true,
  systemSecurity: true,
  systemUpdates: true,
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
                <ToggleRow
                  icon={<CommentIcon />}
                  iconBg="var(--color-primary-08)"
                  iconColor="var(--color-primary)"
                  title="Comments"
                  description="Replies and new comments on content you follow"
                  checked={preferences.comments}
                  onChange={(value) => updatePreference("comments", value)}
                />
                <ToggleRow
                  icon={<PersonIcon />}
                  iconBg="var(--color-primary-08)"
                  iconColor="var(--color-primary)"
                  title="New followers"
                  description="When someone starts following your profile"
                  checked={preferences.newFollowers}
                  onChange={(value) => updatePreference("newFollowers", value)}
                />
              </SectionCard>

              <SectionCard dotColor="var(--color-section-orders)" label="Orders">
                <ToggleRow
                  icon={<TruckIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Shipped"
                  description="When an order leaves the warehouse and tracking begins"
                  checked={preferences.orderShipped}
                  onChange={(value) => updatePreference("orderShipped", value)}
                />
                <ToggleRow
                  icon={<PackageIcon />}
                  iconBg="var(--color-success-bg)"
                  iconColor="var(--color-success)"
                  title="Delivered"
                  description="Confirmed delivery to the destination address"
                  checked={preferences.orderDelivered}
                  onChange={(value) => updatePreference("orderDelivered", value)}
                />
                <ToggleRow
                  icon={<ClockIcon />}
                  iconBg="var(--color-warning-bg)"
                  iconColor="var(--color-warning)"
                  title="Delayed"
                  description="When a carrier reports a delay or delivery exception"
                  checked={preferences.orderDelayed}
                  onChange={(value) => updatePreference("orderDelayed", value)}
                />
              </SectionCard>

              <SectionCard dotColor="var(--color-section-system)" label="System">
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
                <ToggleRow
                  icon={<RefreshIcon />}
                  iconBg="var(--color-danger-bg)"
                  iconColor="var(--color-danger)"
                  title="Product updates"
                  description="Occasional announcements about new features"
                  checked={preferences.systemUpdates}
                  onChange={(value) => updatePreference("systemUpdates", value)}
                />
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
