import type { Metadata } from "next";
import { VaultStudio } from "@/components/vault/studio";

export const metadata: Metadata = {
  title: "Prompt Vault — ViralVibli",
};

export default function VaultPage() {
  return <VaultStudio />;
}
