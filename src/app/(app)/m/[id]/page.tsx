import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { appModules, getModule } from "@/lib/modules/registry";

// Pre-render every registered module route.
export function generateStaticParams() {
  return appModules
    .filter((m) => m.href.startsWith("/m/"))
    .map((m) => ({ id: m.id }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod || !mod.href.startsWith("/m/")) notFound();

  const Icon = mod.icon;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-2xl border border-line bg-surface text-accent-fg">
        <Icon className="size-8" />
      </span>
      <span className="mt-6 rounded-full border border-line px-3 py-1 text-[12px] text-faint">
        In development
      </span>
      <h1 className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">
        {mod.name}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        {mod.blurb} This studio plugs into your workspace and shares your brand
        memory with the AI Assistant. It is on the way.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/assistant"
          className="h-11 rounded-full bg-accent px-6 text-[14px] font-medium leading-[44px] text-accent-ink hover:bg-[#d6f56b]"
        >
          Use the AI Assistant
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[14px] text-ink hover:border-faint"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
