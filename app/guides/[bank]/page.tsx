import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/site-chrome";
import { BANK_GUIDES, BADGE, getBankGuide } from "@/lib/bank-guides";

// One public page per bank. Content comes from lib/bank-guides.ts (a pure data
// module — no fs), so these render on both deploy targets and prerender at build
// via generateStaticParams. dynamicParams stays at its default so an unknown
// slug 404s through getBankGuide() rather than rendering an empty shell.
//
// Each page emits HowTo + BreadcrumbList JSON-LD: the steps ARE a how-to, and
// answer engines lift them directly. Same reasoning as lib/blog-jsonld.ts.

const ORIGIN = "https://pare.money";

export function generateStaticParams() {
  return BANK_GUIDES.map((g) => ({ bank: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bank: string }>;
}): Promise<Metadata> {
  const { bank } = await params;
  const guide = getBankGuide(bank);
  if (!guide) return {};
  const title =
    guide.slug === "any-other-bank"
      ? "How to export OFX/QFX from any bank"
      : `How to download your ${guide.bank} statements`;
  return {
    title: `${title} — PARE`,
    description: guide.intro,
    alternates: { canonical: `${ORIGIN}/guides/${guide.slug}` },
    openGraph: { type: "article", title, description: guide.intro, url: `${ORIGIN}/guides/${guide.slug}` },
  };
}

const labelClass = "font-mono text-[10px] tracking-widest uppercase text-muted-foreground";

export default async function BankGuidePage({
  params,
}: {
  params: Promise<{ bank: string }>;
}) {
  const { bank } = await params;
  const guide = getBankGuide(bank);
  if (!guide) notFound();

  const heading =
    guide.slug === "any-other-bank"
      ? "How to export OFX/QFX from any bank"
      : `How to download your ${guide.bank} statements`;
  const url = `${ORIGIN}/guides/${guide.slug}`;
  const others = BANK_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${url}/#howto`,
        name: heading,
        description: guide.intro,
        step: guide.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text: s,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${ORIGIN}/guides` },
          { "@type": "ListItem", position: 3, name: guide.bank, item: url },
        ],
      },
    ],
  };

  return (
    <div className="min-h-full flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 py-10">
        <Link href="/guides" className={`${labelClass} hover:text-foreground transition-colors`}>
          ← All guides
        </Link>
        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight mt-3 leading-tight">
          {heading}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4">
          <span className={labelClass}>{BADGE[guide.status].label}</span>
          <span className="text-muted-foreground/40" aria-hidden="true">·</span>
          <span className={labelClass}>{guide.formats}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 mt-6">{guide.intro}</p>

        <h2 className="font-mono text-sm font-bold tracking-widest uppercase mt-10 mb-3">
          Steps
        </h2>
        <ol className="border border-border divide-y divide-border">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-4 px-4 py-3.5">
              <span className={`${labelClass} shrink-0 pt-0.5 tabular-nums`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90">{s}</span>
            </li>
          ))}
        </ol>

        {guide.login && (
          <a
            href={guide.login}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] tracking-widest uppercase border border-border bg-background px-4 h-10 text-foreground hover:bg-muted transition-colors"
          >
            Go to {guide.bank} login ↗
          </a>
        )}

        <section className="border border-border bg-card p-5 mt-8">
          <p className={labelClass}>Worth knowing</p>
          <p className="text-sm leading-relaxed text-foreground/90 mt-2">{guide.note}</p>
        </section>

        <section className="border border-border bg-card p-5 mt-8">
          <p className={labelClass}>What Pare does with it</p>
          <p className="text-sm leading-relaxed text-foreground/90 mt-2">
            Drop the file into Pare and it parses the transactions locally,
            categorises them, and builds spending trends, budgets and a cash-flow
            forecast. Uploaded PDFs are deleted the moment they&apos;re parsed,
            and Pare never asks for your bank login. You can also{" "}
            <Link href="/blog/how-to-self-host-pare" className="link">
              self-host it
            </Link>{" "}
            so the data never leaves your machine.
          </p>
          <Link
            href="/login?signup=1"
            className="inline-flex items-center gap-2 mt-4 font-mono text-[11px] tracking-widest uppercase border border-border bg-background px-4 h-10 text-foreground hover:bg-muted transition-colors"
          >
            Try it free →
          </Link>
        </section>

        <section className="mt-12" aria-labelledby="other-guides">
          <h2 id="other-guides" className={`${labelClass} mb-4`}>
            Other banks
          </h2>
          <div className="border border-border divide-y divide-border">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="font-mono text-sm">{g.bank}</span>
                <span className={`${labelClass} shrink-0`}>→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
