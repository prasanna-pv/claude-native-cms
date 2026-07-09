/**
 * Step 1 — LinkedIn Ad Library scraper.
 *
 * Loads a company's resolved LinkedIn Ad Library URL, loads every creative
 * (clicking "Show more" / scrolling until the list stops growing), and writes
 * data/<company>.ads.json.
 *
 * Design choice: LinkedIn's DOM uses obfuscated, build-hashed class names that
 * churn. The ONE stable anchor is that every creative links to
 * /ad-library/detail/<id>. We select on that and read each card from its
 * enclosing container, capturing full innerText as a resilience net so no field
 * is silently lost if a sub-selector misses.
 *
 * Usage:
 *   npm run scrape:linkedin -- --url "<linkedin ad-library url>" [options]
 *
 * Options:
 *   --url <url>        Resolved LinkedIn Ad Library URL (REQUIRED).
 *   --company <name>   Company label for output (default: "avoma").
 *   --out <path>       Output JSON path (default: data/<company>.ads.json).
 *   --headless         Run without a visible browser window (default: headful).
 *   --max-scrolls <n>  Safety cap on load-more iterations (default: 40).
 *   --debug            On finish, also dump a screenshot + full page HTML to data/.
 */

import { chromium, type Browser, type Page } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { AdCreative, AdFormat, AdScrapeResult } from "./types.ts";

interface Args {
  url: string | null;
  company: string;
  out: string | null;
  headless: boolean;
  maxScrolls: number;
  debug: boolean;
  detail: boolean;
  detailPace: number;
  detailLimit: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    url: null,
    company: "avoma",
    out: null,
    headless: false,
    maxScrolls: 40,
    debug: false,
    detail: true, // detail-enrichment pass is part of Step 1; opt out with --no-detail
    detailPace: 1500,
    detailLimit: 0, // 0 = enrich all; N = enrich a strided sample of N (for very large advertisers)
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--url": a.url = argv[++i] ?? null; break;
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--out": a.out = argv[++i] ?? null; break;
      case "--headless": a.headless = true; break;
      case "--max-scrolls": a.maxScrolls = Number(argv[++i]) || a.maxScrolls; break;
      case "--debug": a.debug = true; break;
      case "--detail": a.detail = true; break;
      case "--no-detail": a.detail = false; break;
      case "--detail-pace": a.detailPace = Number(argv[++i]) || a.detailPace; break;
      case "--detail-limit": a.detailLimit = Number(argv[++i]) || a.detailLimit; break;
      default:
        if (arg.startsWith("--")) console.warn(`[warn] unknown flag: ${arg}`);
    }
  }
  return a;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Dismiss the sign-in / cookie overlays LinkedIn throws over public pages. */
async function dismissOverlays(page: Page): Promise<void> {
  // The public ad library is viewable logged-out, but a modal often covers it.
  const dismissSelectors = [
    'button[aria-label="Dismiss"]',
    'button[aria-label="Close"]',
    'button[data-tracking-control-name*="dismiss"]',
    'button:has-text("Accept")',
  ];
  for (const sel of dismissSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.count().catch(() => 0)) {
      await btn.click({ timeout: 1500 }).catch(() => {});
    }
  }
  await page.keyboard.press("Escape").catch(() => {});
}

/** Count creatives currently in the DOM (unique detail-link ids). */
async function countCreatives(page: Page): Promise<number> {
  return page.evaluate(() => {
    const ids = new Set<string>();
    document.querySelectorAll('a[href*="/ad-library/detail/"]').forEach((a) => {
      const m = (a as HTMLAnchorElement).href.match(/\/ad-library\/detail\/(\d+)/);
      if (m) ids.add(m[1]);
    });
    return ids.size;
  });
}

/** Scroll + click "Show more" until the creative count stops growing. */
async function loadAll(page: Page, maxScrolls: number): Promise<void> {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < maxScrolls; i++) {
    if (page.isClosed()) {
      console.warn("[load] page closed mid-loop; stopping load with what we have");
      break;
    }
    try {
      const showMore = page
        .locator('button:has-text("Show more"), button:has-text("See more results")')
        .first();
      if (await showMore.count().catch(() => 0)) {
        await showMore.click({ timeout: 2000 }).catch(() => {});
      }
      await page.mouse.wheel(0, 20000);
      await sleep(1800);
    } catch (err) {
      console.warn(`[load] scroll step failed (${(err as Error).message}); stopping load`);
      break;
    }

    const n = await countCreatives(page).catch(() => last);
    console.log(`[load] iteration ${i + 1}: ${n} creatives in DOM`);
    if (n === last) {
      if (++stable >= 2) break; // two stable passes → done
    } else {
      stable = 0;
      last = n;
    }
  }
}

/** Pull one raw record per unique creative from the live DOM. */
async function extractRaw(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => {
    const byId = new Map<string, HTMLElement>();
    document.querySelectorAll('a[href*="/ad-library/detail/"]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const m = href.match(/\/ad-library\/detail\/(\d+)/);
      if (!m) return;
      const id = m[1];
      if (byId.has(id)) return;
      // Walk up to the card container: the nearest <li>, else a few parents up.
      let el: HTMLElement | null = a as HTMLElement;
      const card =
        (a as HTMLElement).closest("li") ??
        (a as HTMLElement).closest("article") ??
        (() => {
          let cur = el;
          for (let k = 0; k < 4 && cur?.parentElement; k++) cur = cur.parentElement;
          return cur;
        })();
      byId.set(id, (card as HTMLElement) ?? (a as HTMLElement));
    });

    const out: Array<Record<string, unknown>> = [];
    for (const [id, card] of byId) {
      const hrefs = Array.from(card.querySelectorAll("a"))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter(Boolean);
      const destinationUrls = Array.from(
        new Set(
          hrefs.filter((h) => {
            try {
              return !new URL(h).hostname.endsWith("linkedin.com");
            } catch {
              return false;
            }
          }),
        ),
      );
      const imageUrls = Array.from(
        new Set(
          Array.from(card.querySelectorAll("img"))
            .map((img) => (img as HTMLImageElement).src)
            .filter((s) => s && !s.startsWith("data:")),
        ),
      );
      out.push({
        adId: id,
        detailUrl: `https://www.linkedin.com/ad-library/detail/${id}`,
        rawText: (card.innerText || "").trim(),
        destinationUrls,
        imageUrls,
        hasVideo: !!card.querySelector("video"),
      });
    }
    return out;
  });
}

// ---- Node-side field parsing (kept out of the browser for testability) ----

function classifyFormat(raw: {
  hasVideo: boolean;
  imageUrls: string[];
  rawText: string;
}): AdFormat {
  if (raw.hasVideo) return "video";
  if (raw.imageUrls.length > 1) return "carousel";
  if (raw.imageUrls.length === 1) return "single_image";
  if (raw.rawText.length > 0) return "text";
  return "unknown";
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse "Apr 3, 2024" / "April 3, 2024" → ISO date. */
function parseLooseDate(s: string): string | null {
  const m = s.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (mon === undefined) return null;
  const d = new Date(Date.UTC(Number(m[3]), mon, Number(m[2])));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Extract the date line + first/last-seen from a card's raw text. */
function parseDates(rawText: string): {
  dateText: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
} {
  // LinkedIn renders things like "Ran from Apr 3, 2024 to May 1, 2024"
  // or a single "Ran on Apr 3, 2024". We grab any line mentioning a date.
  const line =
    rawText
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /\b(ran|shown|active|from|to)\b/i.test(l) && /\d{4}/.test(l)) ?? null;

  const all = [...rawText.matchAll(/[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/g)].map((m) =>
    parseLooseDate(m[0]),
  );
  const dates = all.filter((d): d is string => !!d).sort();
  return {
    dateText: line,
    firstSeen: dates[0] ?? null,
    lastSeen: dates[dates.length - 1] ?? null,
  };
}

/** First non-empty line of the card is almost always the advertiser name. */
function parseAdvertiser(rawText: string): string | null {
  const first = rawText.split("\n").map((l) => l.trim()).find(Boolean);
  return first ?? null;
}

function toCreative(raw: Record<string, unknown>): AdCreative {
  const rawText = String(raw.rawText ?? "");
  const imageUrls = (raw.imageUrls as string[]) ?? [];
  const hasVideo = Boolean(raw.hasVideo);
  const { dateText, firstSeen, lastSeen } = parseDates(rawText);
  return {
    adId: String(raw.adId),
    detailUrl: String(raw.detailUrl),
    format: classifyFormat({ hasVideo, imageUrls, rawText }),
    text: rawText,
    destinationUrls: (raw.destinationUrls as string[]) ?? [],
    imageUrls,
    hasVideo,
    dateText,
    firstSeen,
    lastSeen,
    advertiser: parseAdvertiser(rawText),
    rawText,
    detailFormatLabel: null,
    impressions: null,
    detailFetched: false,
  };
}

/** Map LinkedIn's detail-page format label to our enum. */
function normalizeFormat(label: string): AdFormat {
  const l = label.toLowerCase();
  if (l.includes("video")) return "video";
  if (l.includes("carousel")) return "carousel";
  if (l.includes("single image")) return "single_image";
  if (l.includes("text")) return "text";
  return "unknown"; // document / spotlight / event / conversation etc. — label retained
}

/**
 * Detail-enrichment pass. Visits each creative's detail page sequentially
 * (paced) to read LinkedIn's explicit format label, plus dates/impressions
 * where the EU/DSA transparency section exists. Mutates creatives in place.
 */
async function enrichWithDetails(
  page: Page,
  creatives: AdCreative[],
  pace: number,
  limit: number,
): Promise<void> {
  // Choose which creatives to enrich: all, or a strided sample of `limit` for
  // very large advertisers (representative spread across the full list, not the first N).
  let indices = creatives.map((_, i) => i);
  if (limit > 0 && limit < creatives.length) {
    const stride = creatives.length / limit;
    indices = Array.from({ length: limit }, (_, k) => Math.floor(k * stride));
    console.log(`[detail] sampling ${limit}/${creatives.length} creatives (strided) for format/date read`);
  }
  let visited = 0;
  for (const i of indices) {
    const c = creatives[i];
    try {
      await page.goto(c.detailUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(2200);

      const text = await page.evaluate(() => document.body.innerText || "");
      const hasVideo = await page.evaluate(() => !!document.querySelector("video"));

      // Format label: the line right after "About the ad", else a known ad-type phrase.
      const lines = text.split("\n").map((l) => l.trim());
      const aboutIdx = lines.findIndex((l) => /^about the ad$/i.test(l));
      let label: string | null = null;
      if (aboutIdx >= 0) {
        label = lines.slice(aboutIdx + 1).find((l) => /ad$/i.test(l) && l.length < 40) ?? null;
      }
      if (!label) {
        const m = text.match(
          /\b(Single Image Ad|Video Ad|Carousel Ad|Text Ad|Document Ad|Spotlight Ad|Follower Ad|Event Ad|Conversation Ad|Message Ad)\b/i,
        );
        label = m ? m[1] : null;
      }

      // Dates/impressions only exist for EU-served ads (DSA). Opportunistic.
      const dates = parseDates(text);
      const imprLine = lines.find((l) => /impression/i.test(l)) ?? null;

      c.detailFormatLabel = label;
      if (label) c.format = normalizeFormat(label);
      if (hasVideo) {
        c.hasVideo = true;
        c.format = "video";
      }
      if (dates.firstSeen) {
        c.firstSeen = dates.firstSeen;
        c.lastSeen = dates.lastSeen;
        c.dateText = dates.dateText;
      }
      c.impressions = imprLine;
      c.detailFetched = true;
    } catch (err) {
      console.warn(`[detail] ${c.adId} failed: ${(err as Error).message}`);
    }
    visited++;
    if (visited % 10 === 0 || visited === indices.length) {
      const done = creatives.filter((x) => x.detailFetched).length;
      console.log(`[detail] ${visited}/${indices.length} visited (${done} parsed ok)`);
    }
    await sleep(pace);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error(
      "\n[error] --url is required.\n" +
        "  Paste the resolved LinkedIn Ad Library URL for the company, e.g.:\n" +
        '  npm run scrape:linkedin -- --url "https://www.linkedin.com/ad-library/search?companyIds=XXXX"\n',
    );
    process.exit(1);
  }
  const outPath = args.out ?? `data/${args.company}.ads.json`;

  console.log(`[start] company=${args.company} headless=${args.headless}`);
  console.log(`[start] url=${args.url}`);

  const browser: Browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    await page.goto(args.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(2500);
    await dismissOverlays(page);
    await sleep(1000);

    const initial = await countCreatives(page);
    console.log(`[load] initial creatives visible: ${initial}`);
    if (initial === 0) {
      console.warn(
        "[warn] 0 creatives found on first paint. Either the URL is wrong, a " +
          "login wall is blocking the list, or LinkedIn changed its markup. " +
          "Re-run with --debug to dump the page for inspection.",
      );
    }

    await loadAll(page, args.maxScrolls);
    const raw = await extractRaw(page);
    const creatives = raw.map(toCreative);

    if (args.detail) {
      console.log(`[detail] enriching creatives (pace ${args.detailPace}ms, limit ${args.detailLimit || "all"})…`);
      await enrichWithDetails(page, creatives, args.detailPace, args.detailLimit);
    }

    const result: AdScrapeResult = {
      company: args.company,
      platform: "linkedin",
      sourceUrl: args.url,
      scrapedAt: new Date().toISOString(),
      count: creatives.length,
      creatives,
    };

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
    console.log(`[done] wrote ${creatives.length} creatives → ${outPath}`);

    // Quick console summary so there's "something to look at" immediately.
    const fmt = creatives.reduce<Record<string, number>>((m, c) => {
      m[c.format] = (m[c.format] ?? 0) + 1;
      return m;
    }, {});
    console.log(`[summary] formats: ${JSON.stringify(fmt)}`);
    const advertisers = Array.from(new Set(creatives.map((c) => c.advertiser).filter(Boolean)));
    console.log(`[summary] advertiser(s) seen: ${advertisers.join(" | ") || "(none parsed)"}`);
    if (args.detail) {
      const withDates = creatives.filter((c) => c.firstSeen).length;
      const labels = creatives.reduce<Record<string, number>>((m, c) => {
        const k = c.detailFormatLabel ?? "(no label)";
        m[k] = (m[k] ?? 0) + 1;
        return m;
      }, {});
      console.log(`[summary] detail format labels: ${JSON.stringify(labels)}`);
      console.log(`[summary] creatives with parsed dates (EU/DSA): ${withDates}/${creatives.length}`);
    }

    if (args.debug) {
      await page.screenshot({ path: `data/${args.company}.debug.png`, fullPage: true });
      await writeFile(`data/${args.company}.debug.html`, await page.content(), "utf8");
      console.log(`[debug] wrote data/${args.company}.debug.png and .debug.html`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
