import type { MetadataRoute } from "next";
import { getAllPostMeta } from "@/lib/blog";
import { BANK_GUIDES } from "@/lib/bank-guides";
import { MCP_CLIENTS } from "@/lib/mcp-clients";

// Public marketing surface only — every URL here must also be reachable
// signed-out (middleware PUBLIC_PATHS / matcher exclusions), or crawlers get a
// login redirect and drop the page. Gated app routes deliberately stay out.
// Pure computation over the bundled blog module (no fs, no request-time APIs),
// so this prerenders at build and runs on both deploy targets.

const ORIGIN = "https://pare.money";

// /switch is the canonical migration landing; /switching and
// /switch-from-monarch are indexable aliases targeting different search
// intents (they re-export the page without a rel=canonical), so all three
// are listed.
const MARKETING_PATHS = [
  "/demo",
  "/about",
  "/mcp",
  "/how-it-works",
  "/switch",
  "/switch-from-monarch",
  "/switching",
  "/pricing",
  "/privacy",
  "/security",
  "/terms",
  "/blog",
  "/ai-info",
  "/guides",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts: MetadataRoute.Sitemap = getAllPostMeta().map((post) => ({
    url: `${ORIGIN}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // One URL per bank guide, from the same data module the pages render from —
  // add a bank to lib/bank-guides.ts and its page is listed here automatically.
  const guides: MetadataRoute.Sitemap = BANK_GUIDES.map((g) => ({
    url: `${ORIGIN}/guides/${g.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  // Per-client MCP setup guides, same generate-off-the-data-module pattern as
  // the bank guides above.
  const mcpClients: MetadataRoute.Sitemap = MCP_CLIENTS.map((c) => ({
    url: `${ORIGIN}/mcp/${c.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [
    { url: ORIGIN, changeFrequency: "weekly", priority: 1 },
    ...MARKETING_PATHS.map((path) => ({
      url: `${ORIGIN}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...guides,
    ...mcpClients,
    ...posts,
  ];
}
