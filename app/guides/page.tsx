import Link from "next/link";
import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/site-chrome";
import { BANK_GUIDES, BADGE } from "@/lib/bank-guides";

// Public index for the per-bank statement-download guides. Reachable signed-out
// (middleware PUBLIC_PATHS + WAITLIST_PUBLIC, listed in app/sitemap.ts).
//
// Why these are public pages and not just the /upload accordion: "how do I
// download my statement from <bank>" is a real, high-intent search that people
// make whether or not they've heard of Pare, and the answer is genuinely useful
// on its own. The accordion lives behind a robots-disallowed route, so that
// content had no search surface at all. Same data either way — lib/bank-guides.ts.

export const metadata: Metadata = {
  title: "How to download your bank statements — PARE",
  description:
    "Step-by-step guides for downloading PDF or OFX/QFX statements from CIBC, RBC, TD, Scotiabank, BMO, Tangerine, Wealthsimple and American Express — no bank login required.",
  alternates: { canonical: "https://pare.money/guides" },
};

const labelClass = "font-mono text-[10px] tracking-widest uppercase text-muted-foreground";

export default function GuidesIndexPage() {
  return (
    <div className="min-h-full flex flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 py-10">
        <p className={labelClass}>Guides</p>
        <h1 className="font-mono text-3xl font-bold tracking-tight mt-2 leading-tight">
          How to download your bank statements
        </h1>

        <p className="text-sm leading-relaxed text-foreground/90 mt-6">
          Every bank buries the statement download somewhere different, and none
          of them make it obvious. These are the click paths, bank by bank. They
          work whatever you do with the file afterwards — Pare reads statements
          instead of asking for your bank login, but a PDF or OFX export is
          useful in any tool, including a spreadsheet.
        </p>

        <p className="text-sm leading-relaxed text-foreground/90 mt-4">
          If your bank isn&apos;t listed, the{" "}
          <Link href="/guides/any-other-bank" className="link">
            OFX/QFX guide
          </Link>{" "}
          covers the universal export that nearly every bank offers.
        </p>

        <div className="mt-8 border border-border divide-y divide-border">
          {BANK_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
            >
              <span className="min-w-0">
                <span className="font-mono text-sm block">{g.bank}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{g.formats}</span>
              </span>
              <span className={`${labelClass} shrink-0`}>{BADGE[g.status].label} →</span>
            </Link>
          ))}
        </div>

        <section className="border border-border bg-card p-5 mt-10">
          <p className={labelClass}>Why statements, not a bank login</p>
          <p className="text-sm leading-relaxed text-foreground/90 mt-2">
            Most finance apps ask you to hand over your online-banking
            credentials to an aggregator. Pare reads the statement files you
            download yourself, so nothing ever connects to your bank on your
            behalf. It&apos;s a little more work once a month, and it&apos;s the
            whole point.
          </p>
          <Link
            href="/blog/why-we-dont-connect-to-your-bank"
            className="inline-flex items-center gap-2 mt-4 font-mono text-[11px] tracking-widest uppercase border border-border bg-background px-4 h-10 text-foreground hover:bg-muted transition-colors"
          >
            Read why →
          </Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
