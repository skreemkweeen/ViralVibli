import Link from "next/link";
import { Wordmark } from "./wordmark";

const columns: { title: string; links: string[] }[] = [
  { title: "Product", links: ["Modules", "Studios", "Pricing", "Changelog"] },
  { title: "Creators", links: ["Templates", "Prompt Vault", "Community", "Academy"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Status"] },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 md:col-span-1">
            <Wordmark />
            <p className="mt-4 max-w-[220px] text-[14px] leading-relaxed text-faint">
              The creator operating system. Create, grow, and monetize from one
              workspace.
            </p>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-[13px] font-medium text-ink">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-[14px] text-faint transition-colors hover:text-ink"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line-soft pt-7 sm:flex-row sm:items-center">
          <p className="text-[13px] text-faint">
            © {new Date().getFullYear()} ViralVibli. All rights reserved.
          </p>
          <p className="font-mono text-[12px] text-faint">
            Create. Grow. Monetize.
          </p>
        </div>
      </div>
    </footer>
  );
}
