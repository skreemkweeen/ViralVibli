import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralVibli — Create. Grow. Monetize.",
  description:
    "Everything creators need in one beautiful workspace. Plan, create, and monetize across every platform with an AI that knows your brand.",
  metadataBase: new URL("https://viralvibli.com"),
  openGraph: {
    title: "ViralVibli: Create. Grow. Monetize.",
    description:
      "Everything creators need in one beautiful workspace. One AI workspace for content, growth, and revenue.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <div className="grain" aria-hidden="true" />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
