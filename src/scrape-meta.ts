/**
 * Step 1 (Meta) — Facebook/Instagram Ad Library scraper.
 *
 * Same architecture as scrape-linkedin.ts, adapted to Meta's realities:
 *   - Playwright, forced en-US locale + Accept-Language header (Meta localizes
 *     hard by IP; without this you get the wrong language + missing fields).
 *   - Ad data comes from the EMBEDDED SNAPSHOT JSON, not the rendered DOM. Meta
 *     ships ad results as JSON — in <script type="application/json"> blocks in
 *     the page source, and streamed via GraphQL responses as you scroll. We parse
 *     that JSON (recursive walk for ad nodes) instead of scraping brittle DOM.
 *   - VERIFY-IN-THE-LOOP resolution: like LinkedIn's companyId step. A name
 *     search (--query) returns candidate Pages (the "Primer" case: many advertisers
 *     share a name). You confirm the right page_id, then scrape by Page
 *     (--page-id) for a clean single-advertiser result.
 *
 * Emits data/<slug>.ads.json in the shared AdScrapeResult schema, so score/
 * copy/render work unchanged. Bonus vs non-EU LinkedIn: Meta gives start/end
 * dates on every ad.
 *
 * Usage:
 *   Resolve:  npm run scrape:meta -- --company camunda --query "Camunda" --headless
 *   Scrape:   npm run scrape:meta -- --company camunda --page-id <PAGE_ID> --headless
 */

import { chromium, type Browser, type Page } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { AdCreative, AdFormat, AdScrapeResult } from "./types.ts";

interface Args {
  company: string;
  query: string | null;
  pageId: string | null;
  url: string | null;
  country: string;
  out: string | null;
  headless: boolean;
  maxScrolls: number;
  debug: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    company: "company", query: null, pageId: null, url: null, country: "US",
    out: null, headless: false, maxScrolls: 60, debug: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--query": a.query = argv[++i] ?? null; break;
      case "--page-id": a.pageId = argv[++i] ?? null; break;
      case "--url": a.url = argv[++i] ?? null; break;
      case "--country": a.country = argv[++i] ?? a.country; break;
      case "--out": a.out = argv[++i] ?? null; break;
      case "--headless": a.headless = true; break;
      case "--max-scrolls": a.maxScrolls = Number(argv[++i]) || a.maxScrolls; break;
      case "--debug": a.debug = true; break;
      default: if (arg.startsWith("--")) console.warn(`[warn] unknown flag: ${arg}`);
    }
  }
  return a;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BASE = "https://www.facebook.com/ads/library/";

function searchUrl(query: string, country: string): string {
  const q = new URLSearchParams({
    active_status: "active", ad_type: "all", country, media_type: "all",
    q: query, search_type: "keyword_unordered",
  });
  return `${BASE}?${q}`;
}
function pageUrl(pageId: string, country: string): string {
  const q = new URLSearchParams({
    active_status: "active", ad_type: "all", country, media_type: "all",
    view_all_page_id: pageId, search_type: "page",
  });
  return `${BASE}?${q}`;
}

/** Dismiss Meta's cookie-consent dialog (blocks the page until handled). */
async function dismissConsent(page: Page): Promise<void> {
  const sels = [
    '[data-testid="cookie-policy-manage-dialog-accept-button"]',
    'button[title="Allow all cookies"]',
    'button[title="Decline optional cookies"]',
    'div[aria-label="Allow all cookies"]',
    'div[aria-label="Decline optional cookies"]',
  ];
  for (const s of sels) {
    const b = page.locator(s).first();
    if (await b.count().catch(() => 0)) { await b.click({ timeout: 2000 }).catch(() => {}); break; }
  }
}

// ---- embedded-JSON extraction (NOT the DOM) ----

/** Recursively collect Meta ad nodes from any parsed JSON structure. */
function collectAdNodes(node: unknown, out: Map<string, any>): void {
  if (Array.isArray(node)) { for (const x of node) collectAdNodes(x, out); return; }
  if (node && typeof node === "object") {
    const o = node as Record<string, any>;
    const id = o.ad_archive_id ?? o.adArchiveID;
    if (id && (o.snapshot || o.page_id || o.publisher_platform)) {
      if (!out.has(String(id))) out.set(String(id), o);
    }
    for (const k in o) collectAdNodes(o[k], out);
  }
}

/** Try to parse a blob as JSON; Meta sometimes streams several JSON objects newline-separated. */
function tryParseInto(text: string, out: Map<string, any>): void {
  const attempt = (s: string) => { try { collectAdNodes(JSON.parse(s), out); return true; } catch { return false; } };
  if (attempt(text)) return;
  // streamed GraphQL: multiple top-level objects, one per line
  let any = false;
  for (const line of text.split("\n")) { const t = line.trim(); if (t.startsWith("{") && attempt(t)) any = true; }
  if (any) return;
  // last resort: pull application/json-ish substrings that mention ad_archive_id
  if (/ad_archive_id|adArchiveID/.test(text)) {
    for (const m of text.matchAll(/\{"[^]*?"ad_archive_id"[^]*?\}(?=,\{|\])/g)) attempt(m[0]);
  }
}

/** Read the embedded snapshot JSON from the page source (script[type=application/json]). */
async function extractFromPageSource(page: Page, out: Map<string, any>): Promise<void> {
  const blobs = await page.$$eval('script[type="application/json"]', (els) =>
    els.map((e) => e.textContent || "").filter(Boolean),
  ).catch(() => [] as string[]);
  for (const b of blobs) tryParseInto(b, out);
}

/** Count distinct ad nodes currently discoverable (for scroll-until-stable). */
async function currentCount(page: Page, captured: string[]): Promise<number> {
  const out = new Map<string, any>();
  await extractFromPageSource(page, out);
  for (const c of captured) tryParseInto(c, out);
  return out.size;
}

async function loadAll(page: Page, captured: string[], maxScrolls: number): Promise<void> {
  let last = -1, stable = 0;
  for (let i = 0; i < maxScrolls; i++) {
    if (page.isClosed()) break;
    try { await page.mouse.wheel(0, 24000); await sleep(2000); }
    catch (e) { console.warn(`[load] scroll failed (${(e as Error).message})`); break; }
    const n = await currentCount(page, captured).catch(() => last);
    console.log(`[load] iteration ${i + 1}: ${n} ads discovered`);
    if (n === last) { if (++stable >= 3) break; } else { stable = 0; last = n; }
  }
}

// ---- node -> AdCreative ----

const isoFromUnix = (s: unknown): string | null => {
  const n = Number(s);
  if (!n || Number.isNaN(n)) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function classifyFormat(displayFormat: string, hasVideo: boolean, imageCount: number): { fmt: AdFormat; label: string } {
  const d = (displayFormat || "").toUpperCase();
  if (hasVideo || d.includes("VIDEO")) return { fmt: "video", label: "Video ad" };
  if (d.includes("CAROUSEL")) return { fmt: "carousel", label: "Carousel ad" };
  // DCO / dynamic / DPA: Meta auto-mixes multiple assets. Classify by asset count,
  // keep the honest label so scoring/readouts don't mistake it for a plain image.
  if (d === "DCO" || d.includes("DYNAMIC") || d.includes("DPA")) {
    return { fmt: imageCount > 1 ? "carousel" : "single_image", label: "Dynamic (DCO)" };
  }
  if (d.includes("IMAGE")) return { fmt: "single_image", label: "Single image ad" };
  if (d === "TEXT" || d === "NONE" || d === "") return { fmt: "text", label: "Text ad" };
  return { fmt: "unknown", label: displayFormat || "Other" };
}

/** Strip Meta DCO/dynamic-creative template tokens ({{product.name}} etc.); drop lines left empty. */
function stripTemplateTokens(s: string): string {
  return s
    .split("\n")
    .map((line) => line.replace(/\{\{[^}]*\}\}/g, "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function nodeToCreative(node: any): AdCreative {
  const snap = node.snapshot ?? {};
  const id = String(node.ad_archive_id ?? node.adArchiveID ?? "");
  const cards: any[] = Array.isArray(snap.cards) ? snap.cards : [];

  const textParts = [
    snap.body?.text, snap.title, snap.caption, snap.link_description,
    ...cards.map((c) => c.body), ...cards.map((c) => c.title),
  ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const text = stripTemplateTokens([...new Set(textParts)].join("\n")).trim();

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
  const firstSeen = isoFromUnix(node.start_date ?? node.startDate);
  const lastSeen = isoFromUnix(node.end_date ?? node.endDate);
  const platforms: string[] = node.publisher_platform ?? snap.publisher_platform ?? [];

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
    advertiser: snap.page_name ?? node.page_name ?? null,
    rawText: [text, platforms.length ? `[${platforms.join(", ")}]` : ""].filter(Boolean).join("\n"),
    detailFormatLabel: label, // Meta gives format up-front — no separate detail pass needed
    impressions: null, // commercial ads don't expose impressions (EU/political only)
    detailFetched: true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.query && !args.pageId && !args.url) {
    console.error(
      "\n[error] provide one of:\n" +
        '  --query "Company Name"   resolve candidate Pages (verify step)\n' +
        "  --page-id <PAGE_ID>      scrape a confirmed Page's ads\n" +
        "  --url <ad-library-url>   scrape a URL directly\n",
    );
    process.exit(1);
  }
  const mode = args.pageId || args.url ? "scrape" : "resolve";
  const target = args.url ?? (args.pageId ? pageUrl(args.pageId, args.country) : searchUrl(args.query!, args.country));
  console.log(`[start] mode=${mode} company=${args.company} country=${args.country} headless=${args.headless}`);
  console.log(`[start] url=${target}`);

  const browser: Browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Capture the streamed snapshot JSON (GraphQL / async) as a resilient companion
  // to the page-source scan — Meta loads later batches this way as you scroll.
  const captured: string[] = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (u.includes("/api/graphql") || u.includes("/ads/archive/") || u.includes("ad_library")) {
      try { const t = await res.text(); if (/ad_archive_id|adArchiveID/.test(t)) captured.push(t); } catch { /* body gone */ }
    }
  });

  try {
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(2500);
    await dismissConsent(page);
    await sleep(1500);

    const scrolls = mode === "resolve" ? Math.min(args.maxScrolls, 6) : args.maxScrolls;
    await loadAll(page, captured, scrolls);

    const nodes = new Map<string, any>();
    await extractFromPageSource(page, nodes);
    for (const c of captured) tryParseInto(c, nodes);
    console.log(`[extract] ${nodes.size} ad nodes from embedded JSON (${captured.length} responses captured)`);

    if (nodes.size === 0) {
      console.warn("[warn] 0 ads found. Either the query/page has no active ads, a login/consent wall blocked the page, or Meta changed its payload. Re-run with --debug.");
    }

    if (mode === "resolve") {
      // VERIFY step: group by Page so a human/agent confirms the right advertiser.
      const byPage = new Map<string, { name: string; count: number }>();
      for (const n of nodes.values()) {
        const pid = String(n.page_id ?? n.snapshot?.page_id ?? "?");
        const name = n.snapshot?.page_name ?? n.page_name ?? "(unknown)";
        const e = byPage.get(pid) ?? { name, count: 0 };
        e.count++; e.name = e.name === "(unknown)" ? name : e.name;
        byPage.set(pid, e);
      }
      const candidates = [...byPage.entries()].map(([page_id, v]) => ({ page_id, ...v })).sort((a, b) => b.count - a.count);
      console.log(`\n[resolve] candidate Pages for "${args.query}" (confirm the real one, then scrape with --page-id):`);
      for (const c of candidates.slice(0, 12)) console.log(`  page_id=${c.page_id.padEnd(18)} ads=${String(c.count).padStart(4)}  ${c.name}`);
      const out = args.out ?? `data/${args.company}.meta-candidates.json`;
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, JSON.stringify({ company: args.company, query: args.query, resolvedAt: new Date().toISOString(), candidates }, null, 2));
      console.log(`[done] wrote ${out}`);
    } else {
      const creatives = [...nodes.values()].map(nodeToCreative);
      const result: AdScrapeResult = {
        company: args.company, platform: "meta", sourceUrl: target,
        scrapedAt: new Date().toISOString(), count: creatives.length, creatives,
      };
      const out = args.out ?? `data/${args.company}.meta.ads.json`;
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, JSON.stringify(result, null, 2), "utf8");
      console.log(`[done] wrote ${creatives.length} creatives → ${out}`);

      const fmt = creatives.reduce<Record<string, number>>((m, c) => ((m[c.format] = (m[c.format] ?? 0) + 1), m), {});
      const withDates = creatives.filter((c) => c.firstSeen).length;
      const advertisers = [...new Set(creatives.map((c) => c.advertiser).filter(Boolean))];
      console.log(`[summary] formats: ${JSON.stringify(fmt)}`);
      console.log(`[summary] with dates: ${withDates}/${creatives.length} · advertiser(s): ${advertisers.join(" | ") || "(none)"}`);
      if (advertisers.length > 1) console.warn(`[warn] multiple advertisers seen — page-id may be wrong or shared. Re-verify.`);
    }

    if (args.debug) {
      await page.screenshot({ path: `data/${args.company}.meta.debug.png`, fullPage: true }).catch(() => {});
      await writeFile(`data/${args.company}.meta.debug.html`, await page.content(), "utf8").catch(() => {});
      console.log(`[debug] wrote data/${args.company}.meta.debug.{png,html}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
