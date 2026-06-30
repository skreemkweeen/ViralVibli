"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Gear, CaretUpDown, X } from "@phosphor-icons/react";
import {
  appModules,
  groupLabels,
  type ModuleGroup,
} from "@/lib/modules/registry";
import { Wordmark } from "@/components/site/wordmark";
import { useAuth } from "@/lib/auth/auth-provider";

const groups: ModuleGroup[] = ["create", "grow", "earn"];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* scrim on mobile */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" onClick={onClose}>
            <Wordmark />
          </Link>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* workspace switcher */}
        <div className="px-3">
          <button className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-bg p-2.5 text-left transition-colors hover:border-faint">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-[13px] font-semibold text-accent-ink">
              {user?.initials ?? "VV"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user?.name ?? "Workspace"}
              </span>
              <span className="block truncate text-[11px] text-faint">
                {user?.plan ?? "Free"} plan
              </span>
            </span>
            <CaretUpDown className="size-4 shrink-0 text-faint" />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={<House className="size-[18px]" />}
            active={pathname === "/dashboard"}
            onNavigate={onClose}
          />

          {groups.map((g) => (
            <div key={g} className="mt-6">
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
                {groupLabels[g]}
              </p>
              <div className="space-y-0.5">
                {appModules
                  .filter((m) => m.group === g)
                  .map((m) => {
                    const Icon = m.icon;
                    return (
                      <NavItem
                        key={m.id}
                        href={m.href}
                        label={m.name}
                        icon={<Icon className="size-[18px]" />}
                        active={pathname === m.href}
                        soon={m.status === "soon"}
                        onNavigate={onClose}
                      />
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <NavItem
            href="/settings"
            label="Settings"
            icon={<Gear className="size-[18px]" />}
            active={pathname.startsWith("/settings")}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  soon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  soon?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
        active
          ? "bg-surface-2 font-medium text-ink"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <span className={active ? "text-accent-fg" : "text-faint group-hover:text-muted"}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {soon && (
        <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-faint">
          Soon
        </span>
      )}
    </Link>
  );
}
