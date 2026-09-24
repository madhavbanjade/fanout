"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/src/utils/apiservice";
import type { AuthUser } from "@/src/types";

export default function AccountMenu({ user, onNavigate }: { user: AuthUser; onNavigate: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetchAPI({ endPoint: "auth/logout", method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <div
      className="card slide-in-right absolute top-11 right-0 z-40 w-64 overflow-hidden"
      style={{ boxShadow: "var(--shadow-dropdown)" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
          {user.name}
        </p>
        <p className="text-muted mt-0.5 truncate">{user.email}</p>
      </div>
      <div className="py-1">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="block px-4 py-2 hover:opacity-80"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}
        >
          View profile
        </Link>
        <Link
          href="/settings"
          onClick={onNavigate}
          className="block px-4 py-2 hover:opacity-80"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}
        >
          Settings
        </Link>
      </div>
      <div className="py-1" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="block w-full px-4 py-2 text-left hover:opacity-80"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
