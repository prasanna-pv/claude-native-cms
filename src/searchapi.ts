/**
 * Shared SearchApi.io client for the ad-library fetchers.
 *
 * Replaces the Playwright scrapers: instead of driving a browser, we call
 * SearchApi's structured engines (linkedin_ad_library, meta_ad_library,
 * google_ads_transparency_center[_ad_details]) and map the JSON into the same
 * AdScrapeResult schema the rest of the pipeline (score/render) already reads.
 *
 * Validated 2026-07 against hand-built Chrome-MCP reports for plain.com and
 * neysa.ai — counts, entities and ad copy matched. See searchapi-probe.ts.
 */

import { readFile } from "node:fs/promises";

const ENDPOINT = "https://www.searchapi.io/api/v1/search";

/** Minimal .env loader — the repo targets Node 18 (no --env-file). */
export async function loadEnv(path = ".env"): Promise<void> {
  try {
    const raw = await readFile(path, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* rely on ambient env */ }
}

export async function requireKey(): Promise<string> {
  await loadEnv();
  const key = process.env.SEARCHAPI_KEY;
  if (!key) {
    console.error("[error] SEARCHAPI_KEY not set. Add it to .env (SEARCHAPI_KEY=…).");
    process.exit(1);
  }
  return key;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One SearchApi request. GET by default; POST (JSON body) for engines whose
 * pagination tokens overflow a URL — notably meta_ad_library, which 414s on GET
 * once next_page_token grows.
 */
export async function callSearchApi(
  params: Record<string, string>,
  key: string,
  method: "GET" | "POST" = "GET",
): Promise<any> {
  const doFetch = async (): Promise<Response> => {
    if (method === "POST") {
      return fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, api_key: key }),
      });
    }
    const url = new URL(ENDPOINT);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("api_key", key);
    return fetch(url);
  };

  // Retry on 429 (throughput cap) with exponential backoff.
  for (let attempt = 0; ; attempt++) {
    const res = await doFetch();
    const body = await res.text();
    if (res.ok) return JSON.parse(body);
    if (res.status === 429 && attempt < 5) {
      const wait = 2000 * 2 ** attempt; // 2s,4s,8s,16s,32s
      console.warn(`  [rate-limit] 429 — backing off ${wait / 1000}s (attempt ${attempt + 1}/5)`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

/** Follow next_page_token until exhausted or `cap` pages. Returns all items. */
export async function paginate(
  engine: string,
  base: Record<string, string>,
  key: string,
  resultsKey: string,
  opts: { method?: "GET" | "POST"; cap?: number; pace?: number; onPage?: (n: number, total: number) => void } = {},
): Promise<any[]> {
  const { method = "GET", cap = 60, pace = 500, onPage } = opts;
  const items: any[] = [];
  let token: string | null = null;
  for (let p = 0; p < cap; p++) {
    const params = { ...base, engine, ...(token ? { next_page_token: token } : {}) };
    const json = await callSearchApi(params, key, method);
    const batch = Array.isArray(json?.[resultsKey]) ? json[resultsKey] : [];
    items.push(...batch);
    onPage?.(batch.length, items.length);
    token = json?.pagination?.next_page_token ?? json?.next_page_token ?? null;
    if (!token) break;
    await sleep(pace);
  }
  return items;
}

/** Parse a date that may be a unix epoch (number/numeric string) or an ISO string → ISO date (YYYY-MM-DD). */
export function toIsoDate(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number" || /^\d+$/.test(String(v))) {
    const n = Number(v);
    if (!n) return null;
    const d = new Date(n < 1e12 ? n * 1000 : n); // seconds vs ms
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Recursively collect non-URL string values from a content object (for ad copy). */
export function collectText(node: unknown, skipKeys = /^(image|images|thumbnail|logo|link|url|.*_url|.*_link|video)$/i): string[] {
  const out: string[] = [];
  const walk = (n: unknown, key?: string) => {
    if (typeof n === "string") {
      if (key && skipKeys.test(key)) return;
      if (/^https?:\/\//i.test(n)) return;
      const t = n.trim();
      if (t) out.push(t);
    } else if (Array.isArray(n)) {
      for (const x of n) walk(x, key);
    } else if (n && typeof n === "object") {
      for (const [k, v] of Object.entries(n)) walk(v, k);
    }
  };
  walk(node);
  return [...new Set(out)];
}
