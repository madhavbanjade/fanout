import "./globals.css";
import type { Metadata } from "next";
import AppProviders from "@/src/components/providers/AppProviders";
import AppShell from "@/src/components/layout/app-shell";
import { serverFetch } from "@/src/utils/serverApi";
import type { AuthUser } from "@/src/types";

export const metadata: Metadata = {
  title: "Fanout",
  description: "Fanout notification delivery platform",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await serverFetch<AuthUser>("auth/me");

  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <AppShell user={user}>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
