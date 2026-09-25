"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import type { AuthUser } from "@/src/types";
import NotificationsDropdown from "@/src/components/notifications/notifications-dropdown";
import AccountMenu from "./account-menu";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/notify", label: "Notify" },
  { href: "/settings", label: "Settings" },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export default function Nav({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<"account" | "notifications" | null>(null);
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const avatarWrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(bellWrapRef, () => setOpenMenu((current) => (current === "notifications" ? null : current)), openMenu === "notifications");
  useClickOutside(avatarWrapRef, () => setOpenMenu((current) => (current === "account" ? null : current)), openMenu === "account");

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await fetchAPI<number>({ endPoint: "notifications/unread-count" });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchInterval: 15000,
  });

  return (
    <nav
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 sm:px-6"
      style={{ background: "var(--color-nav-bg)", borderColor: "var(--color-border-nav)" }}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo-mark.png" alt="" width={28} height={28} priority />
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }} className="text-white">
            Fanout
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 transition-colors"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
                  color: active ? "var(--color-text-white)" : "var(--color-text-on-dark-70)",
                  background: active ? "var(--color-border-dark)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="relative" ref={bellWrapRef}>
          <button
            type="button"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            onClick={() => setOpenMenu((current) => (current === "notifications" ? null : "notifications"))}
            className="relative grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: "var(--color-text-on-dark-70)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 4a5 5 0 0 0-5 5v3.2c0 .6-.24 1.17-.66 1.6L5 15h14l-1.34-1.2a2.3 2.3 0 0 1-.66-1.6V9a5 5 0 0 0-5-5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-white"
                style={{ background: "var(--color-danger)", fontSize: "10px", fontWeight: "var(--weight-semibold)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {openMenu === "notifications" && <NotificationsDropdown unreadCount={unreadCount} />}
        </div>

        <div className="relative" ref={avatarWrapRef}>
          <button
            type="button"
            aria-label="Account menu"
            onClick={() => setOpenMenu((current) => (current === "account" ? null : "account"))}
            className="grid h-8 w-8 place-items-center rounded-full text-white"
            style={{ background: "var(--gradient-avatar)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)" }}
            title={user.name}
          >
            {initialsOf(user.name)}
          </button>
          {openMenu === "account" && <AccountMenu user={user} onNavigate={() => setOpenMenu(null)} />}
        </div>
      </div>
    </nav>
  );
}
