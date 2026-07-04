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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
        >
          Skip to content
        </a>
        <div className="grain" aria-hidden="true" />
        <SmoothScroll>{children}</SmoothScroll>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ViralVibli",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "The creator operating system. Create, grow, and monetize across every platform from one workspace.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
