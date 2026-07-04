import {
  Sparkle,
  TextAa,
  SquaresFour,
  Camera,
  TrendUp,
  Wallet,
  ArrowUpRight,
  BookmarkSimple,
} from "@phosphor-icons/react/dist/ssr";

/**
 * A real, miniature version of the ViralVibli workspace. Not a screenshot,
 * not fake browser chrome. Rendered as an actual component so it stays crisp
 * at any scale and matches the page's design tokens.
 */
export function ProductPreview() {
  const rail = [
    { icon: Sparkle, active: true },
    { icon: TextAa, active: false },
    { icon: SquaresFour, active: false },
    { icon: Camera, active: false },
    { icon: TrendUp, active: false },
    { icon: Wallet, active: false },
  ];

  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
      {/* app header */}
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent">
            <Sparkle weight="fill" className="size-3.5 text-accent-ink" />
          </span>
          <span className="text-[13px] font-medium text-ink">AI Assistant</span>
          <span className="font-mono text-[11px] text-faint">/ Aria Botanica</span>
        </div>
        <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-[12px] font-medium text-accent-ink">
          Generate
        </span>
      </div>

      <div className="grid grid-cols-[44px_1fr]">
        {/* module rail */}
        <div className="flex flex-col items-center gap-1.5 border-r border-line-soft py-3">
          {rail.map(({ icon: Icon, active }, i) => (
            <span
              key={i}
              className={`grid size-8 place-items-center rounded-lg ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-faint hover:text-muted"
              }`}
            >
              <Icon weight={active ? "fill" : "regular"} className="size-4" />
            </span>
          ))}
        </div>

        {/* compose area */}
        <div className="space-y-3 p-4">
          <div className="ml-auto w-fit max-w-[78%] rounded-2xl rounded-br-md bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-muted">
            Write a launch caption for the new ceramic planter, calm and warm.
          </div>

          <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-line bg-bg px-3.5 py-3">
            <p className="text-[12.5px] leading-relaxed text-ink">
              Meet the piece your plants have been waiting for. Hand-finished
              stoneware, a glaze the color of late afternoon, and drainage that
              actually works.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {["#slowliving", "#ceramics", "#planttok"].map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] text-accent"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* live metric chips */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Stat icon={<BookmarkSimple weight="fill" className="size-3" />} label="Saves" value="3,418" trend="+18%" />
            <Stat icon={<ArrowUpRight weight="bold" className="size-3" />} label="Reach" value="214k" trend="+41%" />
            <Stat icon={<Wallet weight="fill" className="size-3" />} label="Revenue" value="$2,940" trend="+9%" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-line-soft bg-bg p-2.5">
      <div className="flex items-center gap-1 text-faint">
        {icon}
        <span className="text-[10.5px]">{label}</span>
      </div>
      <div className="mt-1 font-mono text-[15px] font-medium tabular-nums text-ink">
        {value}
      </div>
      <div className="font-mono text-[10.5px] text-accent">{trend}</div>
    </div>
  );
}
