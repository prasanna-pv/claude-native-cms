/**
 * Google Ads Transparency Center via SearchApi (fills the long-standing gap —
 * there was never a Playwright scraper for Google).
 *
 *   npm run fetch:google -- --company neysa --domain neysa.ai
 *
 * `domain` resolves cleanly to the verified legal entity (no namesake problem —
 * neysa.ai → "Neysa Networks Private Limited", plain.com → "Not Just Tickets
 * Ltd"), so Google needs no separate resolve step.
 *
 * Two-stage, because the LISTING engine returns metadata only (no ad copy):
 *   1. google_ads_transparency_center            → creatives + advertiser.id + dates
 *   2. google_ads_transparency_center_ad_details  → copy, one call per creative
 *      (advertiser_id + creative_id). --detail-limit N samples; default = ALL.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { AdCreative, AdFormat, AdScrapeResult, GeoStat } from "./types.ts";
import { requireKey, callSearchApi, paginate, toIsoDate, collectText, sleep } from "./searchapi.ts";

interface Args {
  company: string;
  domain: string | null;
  advertiserId: string | null;
  details: boolean;
  detailLimit: number; // 0 = all
  detailPace: number;
  from: string | null; // read a saved probe dump instead of calling the API (no credits)
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { company: "company", domain: null, advertiserId: null, details: true, detailLimit: 0, detailPace: 1500, from: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--domain": a.domain = argv[++i] ?? null; break;
      case "--advertiser-id": a.advertiserId = argv[++i] ?? null; break;
      case "--no-details": a.details = false; break;
      case "--detail-limit": a.detailLimit = Number(argv[++i]) || 0; break;
      case "--detail-pace": a.detailPace = Number(argv[++i]) || a.detailPace; break;
      case "--from": a.from = argv[++i] ?? null; break;
      case "--out": a.out = argv[++i] ?? null; break;
      default: if (argv[i].startsWith("--")) console.warn(`[warn] unknown flag: ${argv[i]}`);
    }
  }
  return a;
}

function mapFormat(format: string): { fmt: AdFormat; label: string } {
  const f = (format || "").toLowerCase();
  if (f === "video") return { fmt: "video", label: "Video" };
  if (f === "image") return { fmt: "single_image", label: "Image" };
  if (f === "text") return { fmt: "text", label: "Text" };
  return { fmt: "unknown", label: format || "Other" };
}

function listingToCreative(c: any): AdCreative {
  const { fmt, label } = mapFormat(c?.format ?? "");
  const firstSeen = toIsoDate(c?.first_shown_datetime ?? c?.first_shown);
  const lastSeen = toIsoDate(c?.last_shown_datetime ?? c?.last_shown);
  const days = c?.total_days_shown ?? null;
  return {
    adId: String(c?.id ?? ""),
    detailUrl: c?.details_link ?? "",
    format: fmt,
    text: "", // filled by the detail pass
    destinationUrls: c?.target_domain ? [c.target_domain] : [],
    imageUrls: [],
    hasVideo: fmt === "video",
    dateText: firstSeen ? `${firstSeen}${lastSeen ? ` – ${lastSeen}` : ""}${days != null ? ` (${days}d)` : ""}` : null,
    firstSeen,
    lastSeen,
    advertiser: c?.advertiser?.name ?? null,
    rawText: "",
    detailFormatLabel: label,
    impressions: null,
    detailFetched: false,
    daysShown: days,
    enrichedVia: ["searchapi"],
  };
}

/** Parse a google_ads_transparency_center_ad_details response into rich fields. */
function parseDetails(d: any): {
  text: string;
  images: string[];
  regions: GeoStat[];
  sitelinks: Array<{ title: string; snippet?: string }>;
  callouts: string[];
} {
  const variations: any[] = Array.isArray(d?.variations) ? d.variations : [];
  // Structured copy first (title/description/headline/snippet/CTA), fall back to a full text sweep.
  const structured: string[] = [];
  const sitelinks: Array<{ title: string; snippet?: string }> = [];
  const callouts: string[] = [];
  for (const v of variations) {
    for (const f of ["title", "long_headline", "headline", "description", "snippet", "call_to_action", "displayed_link"]) {
      if (typeof v?.[f] === "string" && v[f].trim()) structured.push(v[f].trim());
    }
    for (const s of v?.sitelinks ?? []) {
      if (s?.title) sitelinks.push({ title: String(s.title), snippet: s.snippet ? String(s.snippet) : undefined });
    }
    for (const c of v?.callouts ?? v?.callout_extensions ?? []) if (typeof c === "string") callouts.push(c);
  }
  const text = (structured.length ? [...new Set(structured)] : collectText(variations)).join("\n").trim();

  const regions: GeoStat[] = (d?.ad_information?.regions ?? []).map((r: any) => ({
    country: r?.name ?? r?.code ?? String(r?.region_code ?? ""),
    code: r?.code,
    lastShown: r?.last_shown_date ?? null,
  }));

  const images = new Set<string>();
  JSON.stringify(d).replace(/"(https?:\/\/[^"']+?\.(?:png|jpe?g|webp|gif))"/gi, (_, u) => (images.add(u), u));

  return { text, images: [...images].slice(0, 5), regions, sitelinks, callouts: [...new Set(callouts)] };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.domain && !args.advertiserId && !args.from) {
    console.error("[error] provide --domain <domain>, --advertiser-id <AR…>, or --from <dump.json>.");
    process.exit(1);
  }

  let raw: any[];
  let key = "";
  if (args.from) {
    const dump = JSON.parse(await readFile(args.from, "utf8"));
    raw = dump.ad_creatives ?? dump.creatives ?? [];
    args.details = false; // offline dump has no detail payloads
    console.log(`[start] google_ads_transparency_center company=${args.company} (from dump: ${raw.length} creatives)`);
  } else {
    key = await requireKey();
    let advId = args.advertiserId;
    // Resolve advertiser_id from the domain — the advertiser-id listing returns the
    // fuller set than a domain query (Neysa UI showed 21 by advertiser vs 13 by domain).
    if (!advId && args.domain) {
      console.log(`[resolve] probing domain=${args.domain} for advertiser_id…`);
      const probe = await paginate("google_ads_transparency_center", { domain: args.domain, num: "100" }, key, "ad_creatives", { cap: 1 });
      advId = probe[0]?.advertiser?.id ?? null;
      console.log(advId ? `[resolve] advertiser_id=${advId}` : `[resolve] no advertiser_id found; falling back to domain query`);
    }
    const base: Record<string, string> = { num: "100" };
    if (advId) base.advertiser_id = advId;
    else if (args.domain) base.domain = args.domain;
    console.log(`[start] google_ads_transparency_center company=${args.company} (${advId ? `advertiser_id=${advId}` : `domain=${args.domain}`})`);
    raw = await paginate("google_ads_transparency_center", base, key, "ad_creatives", {
      onPage: (n, total) => console.log(`  page +${n} (total ${total})`),
    });
  }
  const creatives = raw.map(listingToCreative);
  const advIds = [...new Set(raw.map((c) => c?.advertiser?.id).filter(Boolean))];
  const advNames = [...new Set(creatives.map((c) => c.advertiser).filter(Boolean))];
  console.log(`[listing] ${creatives.length} creatives · advertiser(s): ${advNames.join(" | ")}`);

  // ---- detail pass: one call per creative for copy ----
  if (args.details && creatives.length) {
    let indices = creatives.map((_, i) => i);
    if (args.detailLimit > 0 && args.detailLimit < creatives.length) {
      const stride = creatives.length / args.detailLimit;
      indices = Array.from({ length: args.detailLimit }, (_, k) => Math.floor(k * stride));
      console.log(`[detail] sampling ${args.detailLimit}/${creatives.length} (strided)`);
    } else {
      console.log(`[detail] fetching copy for all ${creatives.length} creatives`);
    }
    let done = 0;
    for (const i of indices) {
      const c = creatives[i];
      const advId = raw[i]?.advertiser?.id ?? advIds[0];
      if (!advId || !c.adId) continue;
      try {
        const d = await callSearchApi(
          { engine: "google_ads_transparency_center_ad_details", advertiser_id: String(advId), creative_id: c.adId },
          key,
        );
        const parsed = parseDetails(d);
        c.text = parsed.text;
        c.rawText = parsed.text;
        c.imageUrls = parsed.images;
        c.regions = parsed.regions;
        if (parsed.sitelinks.length) c.sitelinks = parsed.sitelinks;
        if (parsed.callouts.length) c.callouts = parsed.callouts;
        c.detailFetched = true;
        c.enrichedVia = [...new Set([...(c.enrichedVia ?? []), "searchapi-details"])];
      } catch (e) {
        console.warn(`  [detail] ${c.adId} failed: ${(e as Error).message}`);
      }
      if (++done % 10 === 0 || done === indices.length) console.log(`  [detail] ${done}/${indices.length}`);
      await sleep(args.detailPace);
    }
  }

  const result: AdScrapeResult = {
    company: args.company,
    platform: "google",
    sourceUrl: `searchapi:google_ads_transparency_center ${args.domain ? `domain=${args.domain}` : `advertiser_id=${args.advertiserId}`}`,
    scrapedAt: new Date().toISOString(),
    count: creatives.length,
    creatives,
  };
  const out = args.out ?? `data/${args.company}.google.ads.json`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(result, null, 2), "utf8");

  const fmt = creatives.reduce<Record<string, number>>((m, c) => ((m[c.format] = (m[c.format] ?? 0) + 1), m), {});
  const withText = creatives.filter((c) => c.text.trim()).length;
  const withDates = creatives.filter((c) => c.firstSeen).length;
  console.log(`[done] wrote ${creatives.length} creatives → ${out}`);
  console.log(`[summary] formats ${JSON.stringify(fmt)} · ${withText}/${creatives.length} with copy · ${withDates} with dates`);
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
