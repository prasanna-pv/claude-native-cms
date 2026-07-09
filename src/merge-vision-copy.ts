/**
 * Merge Chrome-vision-transcribed Google ad copy into a company's google.ads.json.
 *
 * Google archives many search RSAs as rendered IMAGES (simgad), so their copy
 * isn't machine-readable from the API — but it's plainly visible in the Ads
 * Transparency Center. The agent (Claude) reads those cards via Chrome MCP,
 * writes them to a JSON array, and this helper folds them into the creatives
 * that came back without text.
 *
 * Mapping note: the transparency cards don't expose creative IDs, so vision
 * copy is assigned to the empty-text creatives in order (best-effort). The ad
 * CORPUS becomes complete for scoring/rendering; per-ID precision is
 * approximate and each filled creative is tagged enrichedVia:["chrome-vision"].
 *
 *   npm run merge:vision -- --company neysa --file data/neysa.google.vision.json
 *
 * The --file JSON is an array of { "text": "...", "format"?: "text|video", "sitelinks"?: [...] }.
 */

import { readFile, writeFile } from "node:fs/promises";
import type { AdScrapeResult } from "./types.ts";

function arg(flag: string, argv: string[]): string | null {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] ?? null : null;
}

async function main() {
  const argv = process.argv.slice(2);
  const company = arg("--company", argv) ?? "company";
  const file = arg("--file", argv) ?? `data/${company}.google.vision.json`;
  const target = arg("--target", argv) ?? `data/${company}.google.ads.json`;

  const vision: Array<{ text: string; format?: string; sitelinks?: Array<{ title: string; snippet?: string }> }> =
    JSON.parse(await readFile(file, "utf8"));
  const result: AdScrapeResult = JSON.parse(await readFile(target, "utf8"));

  const empties = result.creatives.filter((c) => !c.text.trim());
  let merged = 0;
  for (let i = 0; i < vision.length && i < empties.length; i++) {
    const v = vision[i];
    const c = empties[i];
    c.text = v.text.trim();
    c.rawText = v.text.trim();
    if (v.sitelinks?.length) c.sitelinks = v.sitelinks;
    c.detailFetched = true;
    c.enrichedVia = [...new Set([...(c.enrichedVia ?? []), "chrome-vision"])];
    merged++;
  }
  // Any vision copy beyond the empty slots: append as standalone creatives so nothing is lost.
  const overflow = vision.slice(empties.length);
  for (const v of overflow) {
    result.creatives.push({
      adId: `vision-${result.creatives.length}`,
      detailUrl: "",
      format: (v.format as any) ?? "text",
      text: v.text.trim(),
      destinationUrls: [],
      imageUrls: [],
      hasVideo: v.format === "video",
      dateText: null,
      firstSeen: null,
      lastSeen: null,
      advertiser: result.creatives[0]?.advertiser ?? null,
      rawText: v.text.trim(),
      detailFormatLabel: "Chrome-vision",
      impressions: null,
      detailFetched: true,
      sitelinks: v.sitelinks,
      enrichedVia: ["chrome-vision"],
    });
  }
  result.count = result.creatives.length;

  await writeFile(target, JSON.stringify(result, null, 2), "utf8");
  const withCopy = result.creatives.filter((c) => c.text.trim()).length;
  console.log(`[done] merged ${merged} into empty slots + ${overflow.length} appended → ${target}`);
  console.log(`[summary] ${result.creatives.length} creatives · ${withCopy} with copy`);
}

main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
