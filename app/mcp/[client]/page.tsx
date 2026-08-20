import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/site-chrome";
import { MCP_CLIENTS, getMcpClient } from "@/lib/mcp-clients";

// One public page per MCP client. Content comes from lib/mcp-clients.ts (a pure
// data module — no fs), so these prerender at build via generateStaticParams and
// render on both deploy targets.
//
// /mcp is already in the middleware PUBLIC_PATHS list, and the gate matches on
// `pathname.startsWith(p + "/")`, so these children are public without a
// separate entry. The Sidebar hide list needed an explicit prefix match though.
//
// Emits HowTo + BreadcrumbList: the steps ARE a how-to, and answer engines lift
// them directly. Same reasoning as lib/blog-jsonld.ts.

const ORIGIN = "https://pare.money";

export function generateStaticParams() {
  return MCP_CLIENTS.map((c) => ({ client: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ client: string }>;
}): Promise<Metadata> {
  const { client } = await params;
  const c = getMcpClient(client);
  if (!c) return {};
  const title = `Connect ${c.client} to your finances with MCP`;
  return {
    title: `${title} — PARE`,
    description: c.intro,
    alternates: { canonical: `${ORIGIN}/mcp/${c.slug}` },
    openGraph: { type: "article", title, description: c.intro, url: `${ORIGIN}/mcp/${c.slug}` },
  };
}

const labelClass = "font-mono text-[10px] tracking-widest uppercase text-muted-foreground";

export default async function McpClientPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const c = getMcpClient(client);
  if (!c) notFound();

  const heading = `Connect ${c.client} to your finances`;
  const url = `${ORIGIN}/mcp/${c.slug}`;
  const others = MCP_CLIENTS.filter((x) => x.slug !== c.slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${url}/#howto`,
        name: heading,
        description: c.intro,
        step: c.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
          { "@type": "ListItem", position: 2, name: "MCP for Claude", item: `${ORIGIN}/mcp` },
          { "@type": "ListItem", position: 3, name: c.client, item: url },
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
        <Link href="/mcp" className={`${labelClass} hover:text-foreground transition-colors`}>
          ← MCP overview
        </Link>
        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight mt-3 leading-tight">
          {heading}
        </h1>
        <p className={`${labelClass} mt-4`}>
          {c.kind === "hosted" ? "Hosted · no local setup" : "Self-hosted · runs on your machine"}
        </p>

        <p className="text-sm leading-relaxed text-foreground/90 mt-6">{c.intro}</p>

        <p className="text-sm leading-relaxed text-foreground/90 mt-4">
          Pare&apos;s MCP server exposes 24 tools — 13 that read (spending
          summaries, category breakdowns, cash-flow, subscriptions, budget
          status) and 11 that write (set goals, add categorisation rules, tag
          transactions). So you can ask about your own money in plain language
          instead of clicking through dashboards.
        </p>

        <h2 className="font-mono text-sm font-bold tracking-widest uppercase mt-10 mb-3">Steps</h2>
        <ol className="border border-border divide-y divide-border">
          {c.steps.map((s, i) => (
            <li key={i} className="flex gap-4 px-4 py-3.5">
              <span className={`${labelClass} shrink-0 pt-0.5 tabular-nums`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90">{s}</span>
            </li>
          ))}
        </ol>

        {c.config && (
          <>
            <h2 className="font-mono text-sm font-bold tracking-widest uppercase mt-10 mb-3">
              Configuration
            </h2>
            {c.configPath && <p className={`${labelClass} mb-2`}>{c.configPath}</p>}
            <pre className="border border-border bg-card p-4 overflow-x-auto font-mono text-xs leading-relaxed">
              {c.config}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Paths above are placeholders. Once Pare is running, its{" "}
              <span className="font-mono">/connect</span> page prints this same
              snippet with the real absolute paths for your machine, ready to
              copy.
            </p>
          </>
        )}

        <section className="border border-border bg-card p-5 mt-8">
          <p className={labelClass}>Worth knowing</p>
          <p className="text-sm leading-relaxed text-foreground/90 mt-2">{c.note}</p>
        </section>

        <section className="border border-border bg-card p-5 mt-8">
          <p className={labelClass}>What to ask once it&apos;s connected</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-foreground/90 mt-2">
            <li>&ldquo;Is my grocery spending trending up over the last six months?&rdquo;</li>
            <li>&ldquo;Which subscriptions have I paid for over a year without the amount changing?&rdquo;</li>
            <li>&ldquo;Everything from this merchant is groceries — make that a rule and re-run it.&rdquo;</li>
            <li>&ldquo;If I keep spending at this rate, what&apos;s my balance on the 15th?&rdquo;</li>
          </ul>
          <Link
            href="/blog/ask-claude-about-your-money"
            className="inline-flex items-center gap-2 mt-4 font-mono text-[11px] tracking-widest uppercase border border-border bg-background px-4 h-10 text-foreground hover:bg-muted transition-colors"
          >
            How this works →
          </Link>
        </section>

        <section className="mt-12" aria-labelledby="other-clients">
          <h2 id="other-clients" className={`${labelClass} mb-4`}>
            Other clients
          </h2>
          <div className="border border-border divide-y divide-border">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/mcp/${o.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="font-mono text-sm">{o.client}</span>
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
