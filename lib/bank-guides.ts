// Where to find the statement download in each bank's portal.
//
// The friction in "no bank login" onboarding isn't the upload — it's knowing
// where banks hide the PDF/OFX export. This module is the ONE source of truth
// for that knowledge, consumed by two surfaces:
//
//   1. components/upload/bank-guides.tsx — the accordion on /upload, for someone
//      who is already mid-onboarding and just needs the steps.
//   2. app/guides/* — public, indexable pages, for someone who searched
//      "how to download my CIBC statement" and has never heard of Pare.
//
// Surface 2 is why the entries carry more than `steps`: `intro`, `formats` and
// `note` exist so a standalone page has something to say beyond a bare list.
// The upload accordion ignores those fields.
//
// Generic, universal content only — same privacy rule as the starter taxonomy.
// No personal account details, no merchant names.
//
// `status` mirrors the parser registry (CLAUDE.md "Coverage status"): CIBC +
// Amex are tuned against real PDFs; the rest are scaffolds, so OFX/QFX is the
// safer first import. Keep this in sync with lib/parser/_SCAFFOLD_BANKS — a
// bank whose parser graduates from scaffold to tuned should move to "pdf".

export type GuideStatus = "pdf" | "beta" | "ofx";

export interface BankGuide {
  /** URL segment for /guides/<slug>. Stable — changing one breaks a live URL. */
  slug: string;
  /** Display name, as the bank brands itself. */
  bank: string;
  status: GuideStatus;
  /** One-sentence orientation for the standalone page. Not shown on /upload. */
  intro: string;
  /** The actual click path. Shown on both surfaces. */
  steps: string[];
  /** Which file formats this bank offers. Not shown on /upload. */
  formats: string;
  /** Honest caveat or tip specific to this bank. Not shown on /upload. */
  note: string;
}

export const BANK_GUIDES: BankGuide[] = [
  {
    slug: "cibc",
    bank: "CIBC",
    status: "pdf",
    intro:
      "CIBC publishes monthly eStatements as PDFs for both Visa and chequing accounts. Pare's parser is tuned against real CIBC statements, so the PDF path is the best one here.",
    steps: [
      "Sign in to CIBC Online Banking and open the account.",
      "Statements (under Documents / eStatements) → pick a month → Download PDF.",
      "Drop the PDF into Pare — Visa and chequing statements are both fully supported.",
    ],
    formats: "PDF (recommended). CIBC also offers OFX/QFX export from account activity.",
    note:
      "CIBC chequing statements reconcile against the printed closing balance, so if a row fails to parse Pare skips it rather than guessing — you'll never get corrupt totals.",
  },
  {
    slug: "american-express",
    bank: "American Express",
    status: "pdf",
    intro:
      "Amex billing statements are PDFs organised by closing date. Pare's Amex parser is tuned against real statements and handles the year-rollover case (December charges on a January-closing statement).",
    steps: [
      "Sign in at americanexpress.ca → Statements & Activity.",
      "Billing statements → View PDF → download.",
      "Drop the PDF into Pare — Amex statements are fully supported.",
    ],
    formats: "PDF (recommended).",
    note:
      "Amex statements are dated by the closing date, not the calendar month, so a statement closing January 5 mostly contains December spending. Pare handles that automatically.",
  },
  {
    slug: "rbc",
    bank: "RBC",
    status: "beta",
    intro:
      "RBC offers both PDF statements and a Quicken (OFX) export. Pare's RBC PDF parser is a scaffold — built from documented layouts, not yet tuned against real statements — so OFX is the safer first import.",
    steps: [
      "Online Banking → your account → Statements (or Documents) for the PDF.",
      "Safer first import: Download Transactions → format “Quicken (OFX)” → .qfx file.",
      "Drop either file into Pare. If the PDF mis-parses, the OFX will always work.",
    ],
    formats: "PDF (beta) and OFX/QFX (recommended).",
    note:
      "If the PDF mis-parses, a redacted sample genuinely helps — the RBC parser needs a regex pass against a real statement, and that's the only way it gets one.",
  },
  {
    slug: "td",
    bank: "TD",
    status: "beta",
    intro:
      "TD EasyWeb provides monthly PDF statements and a Quicken export. The TD PDF parser is a scaffold, so start with OFX/QFX if you want a guaranteed-clean first import.",
    steps: [
      "EasyWeb → Accounts → Statements & Documents for the monthly PDF.",
      "Safer first import: on the account activity page choose Export → “Quicken” (.qfx).",
      "Drop either file into Pare — OFX/QFX is dedup-safe on re-import.",
    ],
    formats: "PDF (beta) and OFX/QFX (recommended).",
    note:
      "TD's export window is limited to a rolling period, so pull OFX regularly or use PDFs for older history.",
  },
  {
    slug: "scotiabank",
    bank: "Scotiabank",
    status: "beta",
    intro:
      "Scotia OnLine keeps eStatements under Documents. The Scotiabank PDF parser is a scaffold, so the OFX/QFX export is the more reliable first import.",
    steps: [
      "Scotia OnLine → your account → Documents → eStatements for the PDF.",
      "Or export the account activity as OFX/QFX (Money/Quicken format).",
      "Drop either file into Pare.",
    ],
    formats: "PDF (beta) and OFX/QFX (recommended).",
    note:
      "Scotiabank labels the export format “Money” or “Quicken” depending on the account type — both are OFX under the hood and both work.",
  },
  {
    slug: "bmo",
    bank: "BMO",
    status: "beta",
    intro:
      "BMO files eStatements under My Documents and offers a Quicken export from the account activity view. The BMO PDF parser is a scaffold.",
    steps: [
      "Online Banking → My Documents → eStatements for the monthly PDF.",
      "Or Download Transactions → “Quicken” (.qfx) from the account activity view.",
      "Drop either file into Pare.",
    ],
    formats: "PDF (beta) and OFX/QFX (recommended).",
    note:
      "BMO card and chequing statements use different layouts; both are scaffolded, so check the parsed totals against the statement summary on your first upload.",
  },
  {
    slug: "tangerine",
    bank: "Tangerine",
    status: "beta",
    intro:
      "Tangerine offers monthly PDF statements and an OFX download. Chequing and savings are separate accounts and each needs its own import.",
    steps: [
      "Web login → Documents → Statements for the monthly PDF.",
      "Or Transactions → Download → OFX format.",
      "Drop either file into Pare.",
    ],
    formats: "PDF (beta) and OFX (recommended).",
    note:
      "Tangerine savings and chequing parse through different handlers. If you hold both, import them separately so each account gets its own balance anchor.",
  },
  {
    slug: "wealthsimple",
    bank: "Wealthsimple",
    status: "beta",
    intro:
      "Wealthsimple issues monthly PDF statements for Cash and Save accounts. The parser is a scaffold built from documented layouts.",
    steps: [
      "Web login → your account → Documents → Monthly statements (PDF).",
      "Cash and Save accounts both work; drop the PDF into Pare.",
    ],
    formats: "PDF (beta).",
    note:
      "Wealthsimple doesn't offer an OFX export, so PDF is the only path. Check your first import's totals against the statement summary.",
  },
  {
    slug: "any-other-bank",
    bank: "Any other bank",
    status: "ofx",
    intro:
      "Pare doesn't need a parser for your specific bank if you can export OFX or QFX. Nearly every bank offers it — it's the format Quicken and Microsoft Money used, so it long predates the modern aggregators.",
    steps: [
      "Look for “Export”, “Download transactions”, or “Download for Quicken/Money” in the account activity view.",
      "Pick OFX / QFX (sometimes labelled Quicken or Money) — it's a universal format, and Pare's import is dedup-safe: re-importing an overlapping file never doubles anything.",
      "CSV isn't accepted from the upload drop zone (its dates are too lossy to dedup safely) — OFX/QFX is the reliable path.",
    ],
    formats: "OFX / QFX.",
    note:
      "OFX carries a bank-assigned transaction id, which is what makes re-imports safe: Pare keys dedup on that id, so overlapping exports merge instead of duplicating.",
  },
];

export const BADGE: Record<GuideStatus, { label: string; short: string }> = {
  pdf: { label: "PDF TUNED", short: "Tuned" },
  beta: { label: "PDF BETA · OFX SAFER", short: "Beta" },
  ofx: { label: "OFX / QFX", short: "Universal" },
};

export function getBankGuide(slug: string): BankGuide | undefined {
  return BANK_GUIDES.find((g) => g.slug === slug);
}
