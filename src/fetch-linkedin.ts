/**
 * LinkedIn Ad Library via SearchApi (replaces scrape-linkedin.ts).
 *
 * Two modes — same verify-in-the-loop discipline as the Playwright version,
 * because SearchApi's `advertiser` search is a NAME match that returns
 * namesakes (searching "Plain" surfaced ~50 advertisers incl. PlainID,
 * Plains State Bank, White Plains Hospital):
 *
 *   Resolve:  npm run fetch:linkedin -- --company plain --advertiser "Plain" --resolve
 *             → prints candidate advertisers + counts; pick the exact name(s).
 *   Scrape:   npm run fetch:linkedin -- --company plain --advertiser "Plain,Simon Rohrbach"
 *             → keeps only ads whose advertiser.name is in the confirmed list.
 *
 * Founder/employee names in the list are legitimate: company-sponsored Thought
 * Leader Ads (e.g. Plain's CEO Simon Rohrbach) are part of Plain's paid footprint.
 *
 * LinkedIn carries no run-dates via this engine (DSA bands are EU-only and not
 * exposed here) — firstSeen/lastSeen stay null, consistent with the scraper on
 * non-EU advertisers.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { AdCreative, AdFormat, AdScrapeResult } from "./types.ts";
import { requireKey, paginate, collectText } from "./searchapi.ts";

interface Args {
  company: string;
  advertiser: string | null; // exact name, or comma-separated names, to keep
  query: string | null; // free-text keyword search (alternative to advertiser)
  country: string | null;
  resolve: boolean;
  from: string | null; // read a saved probe dump instead of calling the API (no credits)
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { company: "company", advertiser: null, query: null, country: null, resolve: false, from: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--advertiser": a.advertiser = argv[++i] ?? null; break;
      case "--query": case "-q": a.query = argv[++i] ?? null; break;
      case "--country": a.country = argv[++i] ?? null; break;
      case "--resolve": a.resolve = true; break;
      case "--from": a.from = argv[++i] ?? null; break;
      case "--out": a.out = argv[++i] ?? null; break;
      default: if (argv[i].startsWith("--")) console.warn(`[warn] unknown flag: ${argv[i]}`);
    }
  }
  return a;
}

function mapFormat(adType: string): { fmt: AdFormat; label: string } {
  const t = (adType || "").toLowerCase();
  if (t === "video") return { fmt: "video", label: "Video Ad" };
  if (t === "carousel") return { fmt: "carousel", label: "Carousel Ad" };
  if (t === "image" || t === "single_image") return { fmt: "single_image", label: "Single Image Ad" };
  if (t === "text") return { fmt: "text", label: "Text Ad" };
  if (t === "message" || t === "conversation") return { fmt: "text", label: "Conversation/Message Ad" };
  if (t === "document") return { fmt: "unknown", label: "Document Ad" };
  if (t === "event") return { fmt: "unknown", label: "Event Ad" };
  return { fmt: "unknown", label: adType || "Other" };
}

/** Pull image URLs from a LinkedIn content object (content.image, items[].image, pages[]…). */
function collectImages(content: any): string[] {
  const out: string[] = [];
  const walk = (n: any, key?: string) => {
    if (typeof n === "string") { if (key && /image|thumbnail/i.test(key) && /^https?:/i.test(n)) out.push(n); }
    else if (Array.isArray(n)) n.forEach((x) => walk(x, key));
    else if (n && typeof n === "object") for (const [k, v] of Object.entries(n)) walk(v, k);
  };
  walk(content);
  return [...new Set(out)];
}

function toCreative(ad: any): AdCreative {
  const content = ad?.content ?? {};
  const { fmt, label } = mapFormat(ad?.ad_type ?? "");
  const text = collectText(content).join("\n");
  const images = collectImages(content);
  const hasVideo = (ad?.ad_type ?? "").toLowerCase() === "video";
  const id = String(ad?.id ?? "");
  return {
    adId: id,
    detailUrl: ad?.link ?? (id ? `https://www.linkedin.com/ad-library/detail/${id}` : ""),
    format: fmt,
    text,
    destinationUrls: [], // LinkedIn engine doesn't expose external destination URLs
    imageUrls: images,
    hasVideo,
    dateText: null,
    firstSeen: null,
    lastSeen: null,
    advertiser: ad?.advertiser?.name ?? null,
    rawText: text,
    detailFormatLabel: label,
    impressions: null,
    detailFetched: true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.advertiser && !args.query && !args.from) {
    console.error('[error] provide --advertiser "<name>", --query "<keyword>", or --from <dump.json>.');
    process.exit(1);
  }

  let items: any[];
  if (args.from) {
    const dump = JSON.parse(await readFile(args.from, "utf8"));
    items = dump.ads ?? dump.creatives ?? [];
    console.log(`[start] linkedin_ad_library company=${args.company} (from dump: ${items.length} ads)`);
  } else {
    const key = await requireKey();
    const base: Record<string, string> = {};
    if (args.country) base.country = args.country;
    if (args.advertiser) base.advertiser = args.advertiser.split(",")[0].trim(); // search on first name
    if (args.query) base.q = args.query;
    console.log(`[start] linkedin_ad_library company=${args.company} ${args.resolve ? "(resolve)" : ""}`);
    items = await paginate("linkedin_ad_library", base, key, "ads", {
      onPage: (n, total) => console.log(`  page +${n} (total ${total})`),
    });
  }

  // Advertiser breakdown — always show it, it's how you confirm identity.
  const byAdv = new Map<string, number>();
  for (const x of items) { const n = x?.advertiser?.name ?? "?"; byAdv.set(n, (byAdv.get(n) ?? 0) + 1); }
  const ranked = [...byAdv.entries()].sort((a, b) => b[1] - a[1]);

  if (args.resolve) {
    console.log(`\n[resolve] advertisers for "${args.advertiser ?? args.query}" (confirm the exact name(s), then re-run without --resolve):`);
    for (const [n, c] of ranked.slice(0, 25)) console.log(`  ${String(c).padStart(4)}  ${n}`);
    return;
  }

  // Scrape mode: keep only confirmed advertiser name(s).
  let kept = items;
  if (args.advertiser) {
    const names = new Set(args.advertiser.split(",").map((s) => s.trim().toLowerCase()));
    kept = items.filter((x) => names.has((x?.advertiser?.name ?? "").toLowerCase()));
    const dropped = items.length - kept.length;
    console.log(`[filter] kept ${kept.length}/${items.length} ads matching ${[...names].join(" | ")} (dropped ${dropped} namesake ads)`);
  }

  const creatives = kept.map(toCreative);
  const result: AdScrapeResult = {
    company: args.company,
    platform: "linkedin",
    sourceUrl: `searchapi:linkedin_ad_library advertiser=${args.advertiser ?? args.query}`,
    scrapedAt: new Date().toISOString(),
    count: creatives.length,
    creatives,
  };
  const out = args.out ?? `data/${args.company}.ads.json`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(result, null, 2), "utf8");

  const fmt = creatives.reduce<Record<string, number>>((m, c) => ((m[c.format] = (m[c.format] ?? 0) + 1), m), {});
  const withText = creatives.filter((c) => c.text.trim()).length;
  console.log(`[done] wrote ${creatives.length} creatives → ${out}`);
  console.log(`[summary] formats ${JSON.stringify(fmt)} · ${withText}/${creatives.length} with copy`);
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
