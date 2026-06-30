import {
  siTiktok,
  siInstagram,
  siYoutube,
  siPinterest,
  siThreads,
  siSubstack,
  siFacebook,
  siX,
  type SimpleIcon,
} from "simple-icons";

/**
 * Integrations strip. Real platform marks (official Simple Icons paths,
 * bundled locally, rendered inline). Logo-only, no category labels. Honest
 * framing: these are the platforms ViralVibli publishes to. Single marquee.
 */
const icons: SimpleIcon[] = [
  siTiktok,
  siInstagram,
  siYoutube,
  siPinterest,
  siThreads,
  siSubstack,
  siFacebook,
  siX,
];

export function LogoWall() {
  const row = [...icons, ...icons];

  return (
    <section className="border-y border-line-soft py-10">
      <div className="mx-auto max-w-[1180px] px-5">
        <p className="mb-8 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-faint">
          Built for every platform you post on
        </p>
        <div className="marquee-mask overflow-hidden">
          <div
            className="animate-marquee flex w-max items-center gap-16"
            style={{ ["--marquee-duration" as string]: "44s" }}
          >
            {row.map((icon, i) => (
              <svg
                key={`${icon.slug}-${i}`}
                role="img"
                aria-label={icon.title}
                viewBox="0 0 24 24"
                className="h-6 w-auto shrink-0 fill-faint opacity-80 transition-[fill,opacity] duration-300 hover:fill-ink hover:opacity-100"
              >
                <path d={icon.path} />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
