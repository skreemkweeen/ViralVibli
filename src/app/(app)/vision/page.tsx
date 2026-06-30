import type { Metadata } from "next";
import { VisionStudio } from "@/components/vision/studio";

export const metadata: Metadata = {
  title: "Vision Studio — ViralVibli",
};

export default function VisionPage() {
  return <VisionStudio />;
}
