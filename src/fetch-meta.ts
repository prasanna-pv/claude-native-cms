/**
 * Meta (Facebook/Instagram) Ad Library via SearchApi (replaces scrape-meta.ts).
 *
 * SearchApi's meta_ad_library returns Meta's native snapshot shape, so the
 * mapping mirrors scrape-meta.ts's nodeToCreative almost 1:1.
 *
 *   Resolve:  npm run fetch:meta -- --company neysa --query "Neysa" --resolve
 *             → candidate Pages by page_id (keyword search returns namesakes;
 *               e.g. "Neysa" → a city page, clothing brands, a musician…).
 *   Scrape:   npm run fetch:meta -- --company neysa --page-id 576680378868344
 *             → clean single-advertiser pull. Zero ads = genuine true negative.
 *
 * Pagination uses POST: on GET, Meta's next_page_token overflows the URL and
 * SearchApi returns 414 once results run into the hundreds.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { AdCreative, AdFormat, AdScrapeResult } from "./types.ts";
import { requireKey, paginate, toIsoDate } from "./searchapi.ts";

interface Args {
  company: string;
  query: string | null;
  pageId: string | null;
  country: string;
  resolve: boolean;
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { company: "company", query: null, pageId: null, country: "ALL", resolve: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--query": case "-q": a.query = argv[++i] ?? null; break;
      case "--page-id": a.pageId = argv[++i] ?? null; break;
      case "--country": a.country = argv[++i] ?? a.country; break;
      case "--resolve": a.resolve = true; break;
      case "--out": a.out = argv[++i] ?? null; break;
      default: if (argv[i].startsWith("--")) console.warn(`[warn] unknown flag: ${argv[i]}`);
    }
  }
  return a;
}

function classifyFormat(displayFormat: string, hasVideo: boolean, imageCount: number): { fmt: AdFormat; label: string } {
  const d = (displayFormat || "").toUpperCase();
  if (hasVideo || d.includes("VIDEO")) return { fmt: "video", label: "Video ad" };
  if (d.includes("CAROUSEL")) return { fmt: "carousel", label: "Carousel ad" };
  if (d === "DCO" || d.includes("DYNAMIC") || d.includes("DPA")) return { fmt: imageCount > 1 ? "carousel" : "single_image", label: "Dynamic (DCO)" };
  if (d.includes("IMAGE")) return { fmt: "single_image", label: "Single image ad" };
  if (d === "TEXT" || d === "NONE" || d === "") return { fmt: "text", label: "Text ad" };
  return { fmt: "unknown", label: displayFormat || "Other" };
}

const stripTokens = (s: string) => s.split("\n").map((l) => l.replace(/\{\{[^}]*\}\}/g, "").trim()).filter(Boolean).join("\n");

function toCreative(ad: any): AdCreative {
  const snap = ad?.snapshot ?? {};
  const id = String(ad?.ad_archive_id ?? ad?.adArchiveID ?? "");
  const cards: any[] = Array.isArray(snap.cards) ? snap.cards : [];
  const textParts = [snap.body?.text, snap.title, snap.caption, snap.link_description, ...cards.map((c) => c.body), ...cards.map((c) => c.title)]
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const text = stripTokens([...new Set(textParts)].join("\n")).trim();
  const imgs = [
    ...(snap.images ?? []).map((im: any) => im.original_image_url || im.resized_image_url),
    ...(snap.videos ?? []).map((v: any) => v.video_preview_image_url),
    ...cards.map((c) => c.original_image_url || c.resized_image_url),
  ].filter(Boolean);
  const hasVideo = (snap.videos?.length ?? 0) > 0 || cards.some((c) => c.video_hd_url || c.video_sd_url);
  const dests = [snap.link_url, ...cards.map((c) => c.link_url)].filter((u): u is string => {
    if (typeof u !== "string") return false;
    try { return !new URL(u).hostname.endsWith("facebook.com"); } catch { return false; }
  });
  const { fmt, label } = classifyFormat(snap.display_format ?? "", hasVideo, [...new Set(imgs)].length);
  const firstSeen = toIsoDate(ad?.start_date ?? ad?.startDate);
  const lastSeen = toIsoDate(ad?.end_date ?? ad?.endDate);
  const platforms: string[] = ad?.publisher_platform ?? snap.publisher_platform ?? [];
  return {
    adId: id,
    detailUrl: `https://www.facebook.com/ads/library/?id=${id}`,
    format: fmt,
    text,
    destinationUrls: [...new Set(dests)],
    imageUrls: [...new Set(imgs)] as string[],
    hasVideo,
    dateText: firstSeen ? `${firstSeen}${lastSeen ? ` – ${lastSeen}` : ""}` : null,
    firstSeen,
    lastSeen,
    advertiser: snap.page_name ?? ad?.page_name ?? null,
    rawText: [text, platforms.length ? `[${platforms.join(", ")}]` : ""].filter(Boolean).join("\n"),
    detailFormatLabel: label,
    impressions: null,
    detailFetched: true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.query && !args.pageId) {
    console.error('[error] provide --query "<name>" (with --resolve) or --page-id <id>.');
    process.exit(1);
  }
  const key = await requireKey();

  const base: Record<string, string> = { country: args.country, active_status: "all" };
  if (args.pageId) base.page_id = args.pageId;
  if (args.query) base.q = args.query;

  console.log(`[start] meta_ad_library company=${args.company} ${args.resolve ? "(resolve)" : ""}`);
  const items = await paginate("meta_ad_library", base, key, "ads", {
    method: "POST", // GET 414s once next_page_token grows
    onPage: (n, total) => console.log(`  page +${n} (total ${total})`),
  });

  if (args.resolve) {
    const byPage = new Map<string, { name: string; count: number }>();
    for (const n of items) {
      const pid = String(n?.page_id ?? n?.snapshot?.page_id ?? "?");
      const name = n?.snapshot?.page_name ?? n?.page_name ?? "(unknown)";
      const e = byPage.get(pid) ?? { name, count: 0 };
      e.count++; if (e.name === "(unknown)") e.name = name;
      byPage.set(pid, e);
    }
    const candidates = [...byPage.entries()].map(([page_id, v]) => ({ page_id, ...v })).sort((a, b) => b.count - a.count);
    console.log(`\n[resolve] candidate Pages for "${args.query}" (confirm the real page_id, then re-run with --page-id):`);
    for (const c of candidates.slice(0, 15)) console.log(`  page_id=${c.page_id.padEnd(18)} ads=${String(c.count).padStart(4)}  ${c.name}`);
    return;
  }

  const creatives = items.map(toCreative);
  const advertisers = [...new Set(creatives.map((c) => c.advertiser).filter(Boolean))];
  const result: AdScrapeResult = {
    company: args.company,
    platform: "meta",
    sourceUrl: `searchapi:meta_ad_library ${args.pageId ? `page_id=${args.pageId}` : `q=${args.query}`}`,
    scrapedAt: new Date().toISOString(),
    count: creatives.length,
    creatives,
  };
  const out = args.out ?? `data/${args.company}.meta.ads.json`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(result, null, 2), "utf8");

  const fmt = creatives.reduce<Record<string, number>>((m, c) => ((m[c.format] = (m[c.format] ?? 0) + 1), m), {});
  console.log(`[done] wrote ${creatives.length} creatives → ${out}`);
  console.log(`[summary] formats ${JSON.stringify(fmt)} · advertiser(s): ${advertisers.join(" | ") || "(none — true negative)"}`);
  if (advertisers.length > 1) console.warn(`[warn] multiple advertisers — page-id may be shared/wrong. Re-verify.`);
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
