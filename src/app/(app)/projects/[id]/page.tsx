import type { Metadata } from "next";
import { ProjectWorkspace } from "@/components/projects/project-workspace";

export const metadata: Metadata = {
  title: "Project · ViralVibli",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectWorkspace projectId={id} />;
}
