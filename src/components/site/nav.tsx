"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "./wordmark";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Modules", href: "#modules" },
  { label: "Studios", href: "#studios" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <nav
        className={`flex h-14 w-full max-w-[1180px] items-center justify-between gap-6 rounded-full pl-5 pr-2 transition-colors duration-300 ${
          scrolled
            ? "border border-line bg-bg/80 backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        <Link href="#top" aria-label="ViralVibli home">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[14px] text-muted transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="hidden h-10 items-center rounded-full px-4 text-[14px] text-muted transition-colors hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Button href="/sign-in" className="h-10 px-5 text-[14px]">
            Start free
          </Button>
        </div>
      </nav>
    </header>
  );
}
