// Ping IndexNow with the site's public URLs.
//
// IndexNow is a push protocol: instead of waiting for a crawler to notice a
// change, you POST the changed URLs and participating engines fetch them
// promptly. Bing, Yandex, Seznam and Naver share one endpoint — submitting once
// reaches all of them. Google does NOT participate (use Search Console there).
//
// Why we care beyond Bing's own market share: ChatGPT's web search is
// Bing-backed, so getting into Bing's index quickly is the fastest path into
// that answer engine.
//
// OWNERSHIP: proven by hosting a text file whose NAME is the key and whose
// BODY is the same key, at the domain root — public/${KEY}.txt. It is public by
// design and safe to commit; it is not a credential. Worst case someone else
// submits URLs *on your own domain*, which does nothing harmful.
//
//   - The key file must be LIVE on the domain before submitting, or the API
//     returns 403. Deploy first, then run this.
//   - middleware.ts must let the key file through anonymously (it's in the
//     matcher exclusion list). If that entry is dropped, verification breaks.
//
// Usage:
//   npm run indexnow            # submit every URL in the live sitemap
//   npm run indexnow -- --dry   # print what would be submitted, send nothing
//   npm run indexnow -- <url>…  # submit only the given URLs

const KEY = "8d2fb80fbf2e9608b7fb502e642da887";
const HOST = "pare.money";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const explicit = args.filter((a) => a.startsWith("http"));

async function urlsFromSitemap() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const urlList = explicit.length ? explicit : await urlsFromSitemap();
  if (urlList.length === 0) throw new Error("no URLs to submit");

  // Guard against submitting a URL we don't own — the API rejects the whole
  // batch for one stray host, which is a confusing failure to debug.
  const foreign = urlList.filter((u) => new URL(u).host !== HOST);
  if (foreign.length) throw new Error(`refusing: not on ${HOST}: ${foreign.join(", ")}`);

  console.log(`IndexNow: ${urlList.length} URL(s) for ${HOST}`);
  for (const u of urlList) console.log(`  ${u}`);

  if (dry) {
    console.log("\n--dry: nothing sent.");
    return;
  }

  // Verify the key file is actually reachable before sending; a 403 from the
  // API otherwise looks like a protocol problem rather than a deploy problem.
  const keyUrl = `${ORIGIN}/${KEY}.txt`;
  const keyRes = await fetch(keyUrl);
  const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
  if (keyBody !== KEY) {
    throw new Error(
      `key file not live or wrong contents at ${keyUrl} ` +
        `(status ${keyRes.status}). Deploy before submitting.`
    );
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: keyUrl, urlList }),
  });
  const text = await res.text();
  // 200 = accepted, 202 = accepted, key validation pending. Both are success.
  console.log(`\nIndexNow responded ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

main().catch((e) => {
  console.error("IndexNow failed:", e.message);
  process.exit(1);
});
