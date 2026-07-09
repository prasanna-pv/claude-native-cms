/**
 * SearchApi.io validation probe — NOT part of the pipeline.
 *
 * Calls the three ad-library engines (linkedin_ad_library, meta_ad_library,
 * google_ads_transparency_center) for one company, paginates until stable, and
 * dumps the RAW JSON to data/<slug>.searchapi.<platform>.json so we can compare
 * SearchApi's payload against the Chrome-MCP reports we already produced —
 * before deciding whether to replace the Playwright scrapers.
 *
 * Reads SEARCHAPI_KEY from the environment (.env).
 *
 * Usage (run via the npm script so .env is loaded):
 *   npm run probe:searchapi -- --company camunda \
 *     --li-advertiser "Camunda" \
 *     --meta-query "Camunda" \
 *     --google-domain camunda.com
 *
 * Any platform whose identifier flag is omitted is skipped.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Minimal .env loader — Node 18 lacks --env-file. Only sets keys not already in env. */
async function loadEnv(path = ".env"): Promise<void> {
  try {
    const raw = await readFile(path, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env — rely on ambient env */ }
}

const ENDPOINT = "https://www.searchapi.io/api/v1/search";
const MAX_PAGES = 40; // safety cap on pagination

interface Args {
  company: string;
  liAdvertiser: string | null; // LinkedIn: advertiser name
  liQuery: string | null; // LinkedIn: keyword search
  metaQuery: string | null; // Meta: keyword search (resolve step)
  metaPageId: string | null; // Meta: confirmed page_id (clean scrape)
  googleDomain: string | null; // Google: verified domain
  googleAdvertiserId: string | null; // Google: advertiser_id
  country: string | null; // optional; omitted → broadest results
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    company: "company",
    liAdvertiser: null,
    liQuery: null,
    metaQuery: null,
    metaPageId: null,
    googleDomain: null,
    googleAdvertiserId: null,
    country: null,
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--li-advertiser": a.liAdvertiser = argv[++i] ?? null; break;
      case "--li-query": a.liQuery = argv[++i] ?? null; break;
      case "--meta-query": a.metaQuery = argv[++i] ?? null; break;
      case "--meta-page-id": a.metaPageId = argv[++i] ?? null; break;
      case "--google-domain": a.googleDomain = argv[++i] ?? null; break;
      case "--google-advertiser-id": a.googleAdvertiserId = argv[++i] ?? null; break;
      case "--country": a.country = argv[++i] ?? a.country; break;
      default: if (argv[i].startsWith("--")) console.warn(`[warn] unknown flag: ${argv[i]}`);
    }
  }
  return a;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One page of a SearchApi engine. Returns the parsed JSON. */
async function callOnce(params: Record<string, string>, key: string): Promise<any> {
  const url = new URL(ENDPOINT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", key);
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

/** Follow next_page_token until it stops or the cap is hit. Returns all raw pages. */
async function paginate(
  engine: string,
  base: Record<string, string>,
  key: string,
  resultsKey: string,
): Promise<{ pages: any[]; items: any[] }> {
  const pages: any[] = [];
  const items: any[] = [];
  let token: string | null = null;
  for (let p = 0; p < MAX_PAGES; p++) {
    const params = { ...base, engine, ...(token ? { next_page_token: token } : {}) };
    const json = await callOnce(params, key);
    pages.push(json);
    const batch = Array.isArray(json?.[resultsKey]) ? json[resultsKey] : [];
    items.push(...batch);
    token = json?.pagination?.next_page_token ?? json?.next_page_token ?? null;
    console.log(`  [${engine}] page ${p + 1}: +${batch.length} (total ${items.length})${token ? " …more" : ""}`);
    if (!token) break;
    await sleep(600);
  }
  return { pages, items };
}

async function dump(company: string, platform: string, payload: unknown): Promise<string> {
  const out = `data/${company}.searchapi.${platform}.json`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(payload, null, 2), "utf8");
  return out;
}

/** Quick copy-coverage readout so we can eyeball quality without opening the file. */
function summarize(platform: string, items: any[], getText: (x: any) => string): void {
  const withText = items.filter((x) => getText(x).trim().length > 0).length;
  const sample = items.find((x) => getText(x).trim().length > 0);
  console.log(`[summary:${platform}] ${items.length} ads · ${withText} with copy text`);
  if (sample) console.log(`[summary:${platform}] sample copy: "${getText(sample).replace(/\s+/g, " ").slice(0, 140)}…"`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv();
  const key = process.env.SEARCHAPI_KEY;
  if (!key) {
    console.error("[error] SEARCHAPI_KEY not set. Add it to .env and run via `npm run probe:searchapi`.");
    process.exit(1);
  }

  console.log(`[start] SearchApi probe · company=${args.company} country=${args.country}\n`);

  // ---- LinkedIn ----
  if (args.liAdvertiser || args.liQuery) {
    console.log("[linkedin_ad_library]");
    const base: Record<string, string> = {};
    if (args.country) base.country = args.country;
    if (args.liAdvertiser) base.advertiser = args.liAdvertiser;
    if (args.liQuery) base.q = args.liQuery;
    try {
      const { pages, items } = await paginate("linkedin_ad_library", base, key, "ads");
      const out = await dump(args.company, "linkedin", { engine: "linkedin_ad_library", base, count: items.length, ads: items, _pages: pages });
      summarize("linkedin", items, (x) => [x?.content?.headline, x?.content?.title, x?.content?.description, x?.content?.intro, x?.content?.body].filter(Boolean).join(" "));
      const byAdv = new Map<string, number>();
      for (const x of items) { const n = x?.advertiser?.name ?? "?"; byAdv.set(n, (byAdv.get(n) ?? 0) + 1); }
      console.log(`  [linkedin] advertisers: ${[...byAdv.entries()].map(([n, c]) => `${n} (${c})`).join(" · ")}`);
      console.log(`  → ${out}\n`);
    } catch (e) { console.error(`  [linkedin] failed: ${(e as Error).message}\n`); }
  }

  // ---- Meta ----
  if (args.metaQuery || args.metaPageId) {
    console.log("[meta_ad_library]");
    const base: Record<string, string> = { country: args.country ?? "ALL", active_status: "all" };
    if (args.metaPageId) base.page_id = args.metaPageId;
    if (args.metaQuery) base.q = args.metaQuery;
    try {
      const { pages, items } = await paginate("meta_ad_library", base, key, "ads");
      const out = await dump(args.company, "meta", { engine: "meta_ad_library", base, count: items.length, ads: items, _pages: pages });
      summarize("meta", items, (x) => x?.snapshot?.body?.text ?? "");
      // advertiser breakdown so we can confirm identity resolution
      const byPage = new Map<string, number>();
      for (const x of items) { const n = x?.page_name ?? "?"; byPage.set(n, (byPage.get(n) ?? 0) + 1); }
      console.log(`  [meta] advertisers: ${[...byPage.entries()].map(([n, c]) => `${n} (${c})`).join(" · ")}`);
      console.log(`  → ${out}\n`);
    } catch (e) { console.error(`  [meta] failed: ${(e as Error).message}\n`); }
  }

  // ---- Google ----
  if (args.googleDomain || args.googleAdvertiserId) {
    console.log("[google_ads_transparency_center]");
    const base: Record<string, string> = { num: "100" };
    if (args.googleAdvertiserId) base.advertiser_id = args.googleAdvertiserId;
    if (args.googleDomain) base.domain = args.googleDomain;
    try {
      const { pages, items } = await paginate("google_ads_transparency_center", base, key, "ad_creatives");
      const out = await dump(args.company, "google", { engine: "google_ads_transparency_center", base, count: items.length, ad_creatives: items, _pages: pages });
      // listing has no copy — report formats + date coverage + advertiser instead
      const fmt = items.reduce<Record<string, number>>((m, x) => ((m[x?.format ?? "?"] = (m[x?.format ?? "?"] ?? 0) + 1), m), {});
      const advs = [...new Set(items.map((x) => x?.advertiser?.name ?? x?.advertiser ?? "?"))];
      console.log(`[summary:google] ${items.length} creatives · formats ${JSON.stringify(fmt)} · advertiser(s): ${advs.join(" | ")}`);
      console.log(`  [google] NOTE: listing carries no ad copy — copy needs the Ad Details engine per creative id.`);
      console.log(`  → ${out}\n`);
    } catch (e) { console.error(`  [google] failed: ${(e as Error).message}\n`); }
  }

  console.log("[done] compare the data/*.searchapi.*.json dumps against the Chrome-MCP reports.");
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
