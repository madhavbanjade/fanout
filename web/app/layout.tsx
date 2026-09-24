import "./globals.css";
import AppProviders from "@/src/components/providers/AppProviders";
import AppShell from "@/src/components/layout/app-shell";
import { serverFetch } from "@/src/utils/serverApi";
import type { AuthUser } from "@/src/types";

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
