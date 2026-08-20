"use client";

import Link from "next/link";
import { PALETTE } from "@/lib/colors";
import { BANK_GUIDES, type GuideStatus } from "@/lib/bank-guides";

// The "where do I get my statement" accordion on /upload. The guide CONTENT
// lives in lib/bank-guides.ts, shared with the public /guides pages — this
// component only renders the steps (the standalone pages use the extra prose
// fields). Native <details>, no JS state to manage.

const BADGE_COLOR: Record<GuideStatus, { label: string; color: string }> = {
  pdf: { label: "PDF TUNED", color: PALETTE.sage },
  beta: { label: "PDF BETA · OFX SAFER", color: PALETTE.mustard },
  ofx: { label: "OFX / QFX", color: PALETTE.dustyblue },
};

export function BankGuides() {
  return (
    <div className="mt-6">
      <h2 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-3">
        WHERE TO GET YOUR STATEMENT
      </h2>
      <div className="border border-border divide-y divide-border">
        {BANK_GUIDES.map((g) => {
          const badge = BADGE_COLOR[g.status];
          return (
            <details key={g.slug} className="group">
              <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none hover:bg-accent/50 transition-colors [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-sm">{g.bank}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span
                    className="font-mono text-[10px] tracking-widest px-1.5 py-0.5 border"
                    style={{ borderColor: badge.color, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground group-open:hidden">+</span>
                  <span className="font-mono text-xs text-muted-foreground hidden group-open:inline">−</span>
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <ol className="space-y-1.5 list-decimal list-inside">
                  {g.steps.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      {s}
                    </li>
                  ))}
                </ol>
                {g.login && (
                  <a
                    href={g.login}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Go to {g.bank} login ↗
                  </a>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Bank not listed, or need more detail?{" "}
        <Link href="/guides" className="link">
          See the full statement guides
        </Link>
        .
      </p>
    </div>
  );
}
