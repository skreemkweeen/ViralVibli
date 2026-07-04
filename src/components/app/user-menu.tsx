"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Gear, CreditCard, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="grid size-9 cursor-pointer place-items-center rounded-full bg-accent text-[13px] font-semibold text-accent-ink ring-2 ring-transparent transition-all hover:ring-line focus-visible:outline-none focus-visible:ring-accent/50"
      >
        {user?.initials ?? "VV"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="border-b border-line-soft px-4 py-3">
              <p className="truncate text-[14px] font-medium text-ink">
                {user?.name ?? "Guest"}
              </p>
              <p className="truncate text-[12.5px] text-faint">
                {user?.email ?? "Not signed in"}
              </p>
            </div>
            <div className="p-1.5">
              <MenuLink href="/settings" icon={<Gear className="size-[18px]" />}>
                Settings
              </MenuLink>
              <MenuLink
                href="/settings"
                icon={<CreditCard className="size-[18px]" />}
              >
                Billing
              </MenuLink>
            </div>
            <div className="border-t border-line-soft p-1.5">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <SignOut className="size-[18px] text-faint" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="text-faint">{icon}</span>
      {children}
    </Link>
  );
}
