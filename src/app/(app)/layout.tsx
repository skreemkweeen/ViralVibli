import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { ThemeProvider } from "@/components/app/theme-provider";
import { WorkspaceProvider } from "@/lib/workspace/store";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  title: "Workspace — ViralVibli",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <AppShell>{children}</AppShell>
        </WorkspaceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
