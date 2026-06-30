import type { Metadata } from "next";
import { StoryStudio } from "@/components/story/studio";

export const metadata: Metadata = {
  title: "Story Studio — ViralVibli",
};

export default function StoryPage() {
  return <StoryStudio />;
}
