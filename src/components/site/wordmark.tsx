/** ViralVibli wordmark. Single geometric mark + type, brand-locked accent. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M2 3l6.5 16L11 9l2.5 10L20 3"
          stroke="var(--color-accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
        ViralVibli
      </span>
    </span>
  );
}
