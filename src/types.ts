// Shared types for the ad-strategy pipeline.
// Step 1 (this file's consumer) produces `AdScrapeResult`, written to data/<company>.ads.json.

export type AdFormat = "video" | "carousel" | "single_image" | "text" | "unknown";

/** Per-country stat: reach/impression band and/or last-shown, from DSA/transparency detail. */
export interface GeoStat {
  country: string;
  code?: string;
  /** Share of audience in this country, 0-100 (LinkedIn audience breakdown). */
  pct?: number;
  impressionsLow?: number;
  impressionsHigh?: number;
  lastShown?: string | null;
}

/** Audience & targeting detail read from an ad's detail page (LinkedIn/Meta DSA). */
export interface AdAudience {
  geo?: GeoStat[];
  ageRanges?: string[];
  genders?: string[];
  /** Targeting criteria: job titles, seniorities, industries, member interests, etc. */
  targeting?: string[];
  /** Explicit audience exclusions (e.g. countries excluded). */
  exclusions?: string[];
}

/** One ad creative as observed on the LinkedIn Ad Library results page. */
export interface AdCreative {
  /** LinkedIn ad-library detail id, parsed from the /ad-library/detail/<id> link. */
  adId: string;
  /** Absolute URL to the LinkedIn ad-library detail page for this creative. */
  detailUrl: string;
  /** Best-effort format classification from card contents. */
  format: AdFormat;
  /** Full ad copy as shown on the card (intro text + headline, undivided). */
  text: string;
  /** External destination/CTA URLs found on the card (non-linkedin.com hrefs). */
  destinationUrls: string[];
  /** Image asset URLs found on the card. */
  imageUrls: string[];
  /** True if the card contains a <video> element. */
  hasVideo: boolean;
  /** Raw date strings scraped from the card ("Ran from ...", etc.), unparsed. */
  dateText: string | null;
  /** Best-effort parsed first-seen date (ISO), or null if unparseable. */
  firstSeen: string | null;
  /** Best-effort parsed last-seen date (ISO), or null if unparseable. */
  lastSeen: string | null;
  /** Advertiser name as printed on the card, for sanity-checking identity resolution. */
  advertiser: string | null;
  /** Untouched innerText of the whole card — resilience net if a selector missed a field. */
  rawText: string;
  /** LinkedIn's own format label from the detail page, e.g. "Single Image Ad" (null if detail not fetched). */
  detailFormatLabel: string | null;
  /** Impressions text from the detail page's EU/DSA section, if present. */
  impressions: string | null;
  /** Whether the detail page was successfully fetched and parsed. */
  detailFetched: boolean;

  // ---- Optional deep-fidelity fields (populated by the enrichment passes;
  //      all optional so existing consumers — score.ts / render.ts — are unaffected). ----
  /** Structured impressions/reach range, where disclosed. */
  impressionsRange?: string | null;
  /** Per-country geographic footprint (Google regions, LinkedIn/Meta reach). */
  regions?: GeoStat[];
  /** Audience & targeting detail from the ad's detail page (DSA), where available. */
  audience?: AdAudience | null;
  /** Sitelinks (Google search/RSA ads). */
  sitelinks?: Array<{ title: string; snippet?: string }>;
  /** Callout/extension snippets (Google search ads). */
  callouts?: string[];
  /** Publisher platforms — Meta: facebook/instagram/…; Google: search/youtube/…. */
  publisherPlatforms?: string[];
  /** Number of days the ad actually ran (Google total_days_shown). */
  daysShown?: number | null;
  /** Funder/beneficiary disclaimer ("Paid for by …"). */
  paidBy?: string | null;
  /** Provenance of copy/detail: e.g. ["searchapi", "searchapi-details", "chrome-vision"]. */
  enrichedVia?: string[];
}

export type Tier = "Heavy" | "Moderate" | "Light" | "None";

/** One scored signal in the tiering model. */
export interface SignalScore {
  key: string;
  label: string;
  /** Human-readable raw observation (e.g. "49 creatives"). */
  raw: string;
  /** Normalized 0-1 value fed into the weighting. */
  normalized: number;
  /** Weight (percentage points) this signal carries in the reweighted model. */
  weight: number;
  /** normalized * weight — points contributed to the 0-100 total. */
  points: number;
  /** Method note, for transparency. */
  method: string;
}

/** Step 3 output — written to data/<company>.profile.json, consumed by Step 4. */
export interface AdStrategyProfile {
  company: string;
  scoredAt: string;
  model: "reweighted-v1-no-velocity";
  signals: SignalScore[];
  score: number;
  tier: Tier;
  boundaries: { heavy: number; moderate: number };
  /** Format mix by LinkedIn label, for the readout. */
  formatMix: Record<string, number>;
  /** Messaging themes detected (keyword buckets) with hit counts. */
  themes: Array<{ key: string; label: string; hits: number }>;
  /** Signals we could not compute and why. */
  droppedSignals: Array<{ key: string; reason: string }>;
}

export interface BrandColor {
  hex: string;
  /** Our assigned role: primary | secondary | accent. */
  role: string;
  brightness?: number;
  /** Brandfetch's own type label (dark/light/accent) — retained for reference. */
  sourceType?: string;
}

/** Step 2 output — written to data/<company>.brand.json, consumed by Step 5. */
export interface BrandProfile {
  company: string;
  domain: string;
  fetchedAt: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  colors: {
    primary: string;
    secondary: string | null;
    accent: string | null;
    /** Sane defaults WE chose for a landing page — not from Brandfetch. */
    suggestedBackground: string;
    suggestedText: string;
    all: BrandColor[];
  };
  fonts: { title: string | null; body: string | null };
  logo: {
    localPath: string | null;
    theme: string | null;
    format: string | null;
    background: string | null;
    sourceUrl: string | null;
    /** True if the only logo available is a dark-theme (light-colored) logo — Step 5 must place it on a dark surface. */
    darkThemeOnly: boolean;
  };
  icon: { localPath: string | null; sourceUrl: string | null } | null;
  companyMeta: {
    foundedYear: number | null;
    employees: number | null;
    location: string | null;
    industries: string[];
  };
  qualityScore: number | null;
}

export interface AdScrapeResult {
  company: string;
  platform: "linkedin" | "meta" | "google";
  /** The resolved ad-library URL we actually scraped. */
  sourceUrl: string;
  /** ISO timestamp of the scrape. */
  scrapedAt: string;
  /** Number of creatives captured. */
  count: number;
  creatives: AdCreative[];
}
