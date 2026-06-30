import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { ThemeProvider } from "@/components/app/theme-provider";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  title: "Workspace — ViralVibli",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </AuthProvider>
  );
}
