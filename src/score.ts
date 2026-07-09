/**
 * Step 3 — Signal scoring + tiering.
 *
 * Reads data/<company>.ads.json (Step 1) + data/<company>.step0.json (platform
 * counts), computes the reweighted tier model, prints a full breakdown, and
 * writes data/<company>.profile.json (consumed by Step 4).
 *
 * Reweighted model (refresh velocity DROPPED — LinkedIn exposes dates only for
 * EU/DSA ads, and Avoma has none; format sophistication absorbs most of the
 * freed weight since it's now the primary "sophistication" proxy):
 *
 *   Volume ............... 40   (raw creative count)
 *   Platform breadth ..... 22   (how many libraries show any ads)
 *   Format sophistication  25   (mean production-richness across creatives)
 *   Messaging breadth .... 13   (distinct value-prop themes)
 *                          ---
 *                          100
 *
 * Tiers: Heavy >= 60 | Moderate 25-59 | Light < 25 | None = 0 ads (hard override).
 *
 * Usage: npm run score -- [--company avoma]
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type {
  AdCreative,
  AdScrapeResult,
  AdStrategyProfile,
  SignalScore,
  Tier,
} from "./types.ts";

const WEIGHTS = { volume: 40, breadth: 22, format: 25, messaging: 13 } as const;
const BOUNDARIES = { heavy: 60, moderate: 25 } as const;

// Volume: creatives at which the signal maxes out (30+ is a lot for B2B).
const VOLUME_CAP = 30;
// Format production-richness per LinkedIn label bucket.
const FORMAT_RICHNESS: Record<string, number> = {
  video: 1.0,
  carousel: 0.7,
  single_image: 0.35,
  text: 0.1,
  unknown: 0.2,
};
// Messaging: distinct themes at which the signal maxes out.
const THEME_CAP = 5;

const THEME_BUCKETS: Array<{ key: string; label: string; re: RegExp }> = [
  { key: "sdr_prospecting", label: "SDR / prospecting productivity", re: /\b(SDRs?|BDRs?|prospect\w*|outbound|cold email|account research|drafting emails?)\b/i },
  { key: "revops_crm", label: "RevOps / CRM / Salesforce activity", re: /\b(RevOps|Salesforce|CRM|activity (?:data|capture)|logging activity|pipeline hygiene)\b/i },
  { key: "consolidation", label: "Tool consolidation / all-in-one", re: /\b(all[- ]in[- ]one|consolidat\w*|juggl\w*|one platform|single platform|tech stack|too many tools|tabs)\b/i },
  { key: "competitive", label: "Competitive / comparison", re: /\b(Gong|Chorus|alternative|competitor|shortlist\w*|cheaper|costs? (?:significantly )?less|\bvs\.?\b)\b/i },
  { key: "conversation_intel", label: "Conversation intelligence / notes", re: /\b(call scoring|conversation intelligence|call recording|notetaker|AI notes|meeting (?:notes|assistant)|transcri\w*)\b/i },
  { key: "deal_forecast", label: "Deal / pipeline / forecasting", re: /\b(forecast\w*|deal intelligence|pipeline (?:intelligence|forecast)|revenue intelligence|deal risk)\b/i },
  { key: "coaching", label: "Coaching / ramp / rep performance", re: /\b(coach\w*|ramp\w*|onboarding|rep performance|scorecards?)\b/i },
  { key: "roi_cost", label: "ROI / cost / pricing", re: /\b(ROI|pricing|budget|savings?|affordable|cost\w*)\b/i },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function computeVolume(total: number, detail: string): SignalScore {
  const normalized = clamp01(total / VOLUME_CAP);
  return {
    key: "volume",
    label: "Volume",
    raw: `${total} active creatives${detail}`,
    normalized,
    weight: WEIGHTS.volume,
    points: normalized * WEIGHTS.volume,
    method: `min(1, count/${VOLUME_CAP})${total > VOLUME_CAP ? " — capped" : ""}`,
  };
}

function computeBreadth(platforms: Record<string, { count: number }>): SignalScore {
  const active = Object.entries(platforms).filter(([, v]) => (v?.count ?? 0) > 0);
  const activeCount = active.length;
  // 0→0, 1→0.33, 2→0.66, 3→1.0
  const normalized = clamp01(activeCount / 3);
  const detail = active.map(([k, v]) => `${k}:${v.count}`).join(", ") || "none";
  return {
    key: "breadth",
    label: "Platform breadth",
    raw: `${activeCount} platform(s) active (${detail})`,
    normalized,
    weight: WEIGHTS.breadth,
    points: normalized * WEIGHTS.breadth,
    method: "active libraries / 3",
  };
}

function computeFormat(creatives: AdCreative[]): { score: SignalScore; mix: Record<string, number> } {
  // Card-level format is lazy-load-unreliable; trust only detail-fetched creatives.
  // If enrichment was partial (large advertiser sampled), score over the fetched subset.
  const fetched = creatives.filter((c) => c.detailFetched);
  const basis = fetched.length ? fetched : creatives;
  const sampled = fetched.length > 0 && fetched.length < creatives.length;

  const mix = basis.reduce<Record<string, number>>((m, c) => {
    const k = c.detailFormatLabel ?? c.format;
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});
  const richnessSum = basis.reduce((s, c) => s + (FORMAT_RICHNESS[c.format] ?? 0.2), 0);
  const normalized = basis.length ? clamp01(richnessSum / basis.length) : 0;
  const videoShare = basis.length
    ? basis.filter((c) => c.format === "video").length / basis.length
    : 0;
  const sampleNote = sampled ? ` — SAMPLED ${basis.length}/${creatives.length}` : "";
  return {
    score: {
      key: "format",
      label: "Format sophistication",
      raw: `mean richness ${normalized.toFixed(2)} (${(videoShare * 100).toFixed(0)}% video)${sampleNote}`,
      normalized,
      weight: WEIGHTS.format,
      points: normalized * WEIGHTS.format,
      method: `mean(video=1.0, carousel=0.7, single_image=0.35, text=0.1)${sampled ? ` over ${basis.length}-creative sample` : ""}`,
    },
    mix,
  };
}

function computeMessaging(creatives: AdCreative[]): {
  score: SignalScore;
  themes: Array<{ key: string; label: string; hits: number }>;
} {
  const corpus = creatives.map((c) => c.text);
  const themes = THEME_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    hits: corpus.filter((t) => b.re.test(t)).length,
  }));
  const distinctThemes = themes.filter((t) => t.hits > 0).length;
  const normalized = clamp01(distinctThemes / THEME_CAP);
  return {
    score: {
      key: "messaging",
      label: "Messaging breadth",
      raw: `${distinctThemes} distinct themes`,
      normalized,
      weight: WEIGHTS.messaging,
      points: normalized * WEIGHTS.messaging,
      method: `min(1, distinctThemes/${THEME_CAP}) — keyword buckets (heuristic, refined in Step 4)`,
    },
    themes,
  };
}

function tierFor(score: number, adCount: number): Tier {
  if (adCount === 0) return "None";
  if (score >= BOUNDARIES.heavy) return "Heavy";
  if (score >= BOUNDARIES.moderate) return "Moderate";
  return "Light";
}

function bar(normalized: number, width = 20): string {
  const filled = Math.round(normalized * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function printBreakdown(profile: AdStrategyProfile): void {
  const line = "─".repeat(78);
  console.log(`\n${line}`);
  console.log(`AD-STRATEGY PROFILE — ${profile.company.toUpperCase()}   (model: ${profile.model})`);
  console.log(line);
  console.log(
    "Signal".padEnd(22) +
      "Observation".padEnd(30) +
      "Norm".padEnd(7) +
      "Wt".padEnd(5) +
      "Pts",
  );
  console.log("-".repeat(78));
  for (const s of profile.signals) {
    console.log(
      s.label.padEnd(22) +
        s.raw.slice(0, 29).padEnd(30) +
        s.normalized.toFixed(2).padEnd(7) +
        String(s.weight).padEnd(5) +
        s.points.toFixed(1),
    );
    console.log(`  ${bar(s.normalized)}  ${s.method}`);
  }
  console.log("-".repeat(78));
  console.log(`${"TOTAL".padEnd(59)}${"100".padEnd(5)}${profile.score.toFixed(1)}`);
  console.log(line);

  console.log(`\nFormat mix:`);
  for (const [k, v] of Object.entries(profile.formatMix)) console.log(`  ${k}: ${v}`);

  console.log(`\nMessaging themes (keyword buckets):`);
  for (const t of profile.themes) {
    const flag = t.hits > 0 ? "✓" : "·";
    console.log(`  ${flag} ${t.label.padEnd(38)} ${t.hits} ad(s)`);
  }

  if (profile.droppedSignals.length) {
    console.log(`\nDropped signals:`);
    for (const d of profile.droppedSignals) console.log(`  ✗ ${d.key}: ${d.reason}`);
  }

  // Boundary sanity-check the user asked for.
  const toHeavy = profile.score - profile.boundaries.heavy;
  console.log(`\n${line}`);
  console.log(`TIER: ${profile.tier}   (score ${profile.score.toFixed(1)} / 100)`);
  console.log(
    `Boundary check: Heavy ≥ ${profile.boundaries.heavy}, Moderate ≥ ${profile.boundaries.moderate}. ` +
      `${profile.company} is ${toHeavy >= 0 ? `+${toHeavy.toFixed(1)} ABOVE` : `${Math.abs(toHeavy).toFixed(1)} below`} the Heavy line.`,
  );
  // How robust is the call? Show floor = volume+breadth alone (the un-heuristic signals).
  const hard = profile.signals
    .filter((s) => s.key === "volume" || s.key === "breadth")
    .reduce((sum, s) => sum + s.points, 0);
  console.log(
    `Robustness: volume + breadth alone (no heuristics) = ${hard.toFixed(1)} pts; ` +
      `format + messaging add ${(profile.score - hard).toFixed(1)}.`,
  );
  console.log(line + "\n");
}

async function main() {
  const argv = process.argv.slice(2);
  let company = "avoma";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--company") company = argv[++i] ?? company;
  }

  const step0 = JSON.parse(await readFile(`data/${company}.step0.json`, "utf8"));

  // Multi-platform aggregation: load every platform ad file we have. Format &
  // messaging are computed over the COMBINED creative corpus; volume & breadth
  // come from step0's per-platform counts (which include platforms we only have
  // a manual count for, e.g. Google).
  const PLATFORM_FILES: Record<string, string> = {
    linkedin: `data/${company}.ads.json`,
    meta: `data/${company}.meta.ads.json`,
    google: `data/${company}.google.ads.json`,
  };
  const platName: Record<string, string> = { linkedin: "LinkedIn", meta: "Meta", google: "Google" };
  const loadedCounts: Record<string, number> = {};
  const creatives: AdCreative[] = [];
  for (const [plat, path] of Object.entries(PLATFORM_FILES)) {
    if (!existsSync(path)) continue;
    const j: AdScrapeResult = JSON.parse(await readFile(path, "utf8"));
    loadedCounts[plat] = j.creatives.length;
    creatives.push(...j.creatives);
  }

  // Per-platform counts: step0 is authoritative (records manual counts too); fall
  // back to the scraped file length where step0 has no number.
  const counts: Record<string, number> = {};
  for (const plat of Object.keys(PLATFORM_FILES)) {
    const s0 = step0.platforms?.[plat]?.count;
    counts[plat] = s0 !== null && s0 !== undefined ? Number(s0) : (loadedCounts[plat] ?? 0);
  }
  const activeParts = Object.keys(PLATFORM_FILES).filter((p) => counts[p] > 0).map((p) => `${platName[p]} ${counts[p]}`);
  const total = Object.values(counts).reduce((s, n) => s + (n || 0), 0);
  const detail = activeParts.length ? ` across ${activeParts.length} platform${activeParts.length > 1 ? "s" : ""} (${activeParts.join(" · ")})` : "";

  console.log(`[aggregate] ${creatives.length} creatives scraped across ${Object.keys(loadedCounts).length} file(s); total footprint ${total}${detail}`);

  const volume = computeVolume(total, detail);
  const breadth = computeBreadth(step0.platforms);
  const { score: format, mix } = computeFormat(creatives);
  const { score: messaging, themes } = computeMessaging(creatives);

  const signals = [volume, breadth, format, messaging];
  const score = signals.reduce((s, x) => s + x.points, 0);
  const tier = tierFor(score, total);

  // Data-driven note on why velocity is dropped (date coverage varies by platform —
  // Meta and EU/DSA LinkedIn carry dates; non-EU LinkedIn doesn't).
  const withDates = creatives.filter((c) => c.firstSeen).length;
  const fetched = creatives.filter((c) => c.detailFetched).length;
  const velocityReason =
    withDates === 0
      ? `No run-dates available (0/${creatives.length} creatives carry EU/DSA dates${fetched < creatives.length ? `, ${fetched} sampled` : ""}). Weight redistributed, primarily to format sophistication.`
      : `Dropped for model consistency, though ${withDates}/${fetched || creatives.length} sampled creatives DO carry EU/DSA dates — velocity is recoverable for this advertiser if re-enabled.`;

  const profile: AdStrategyProfile = {
    company,
    scoredAt: new Date().toISOString(),
    model: "reweighted-v1-no-velocity",
    signals,
    score,
    tier,
    boundaries: BOUNDARIES,
    formatMix: mix,
    themes,
    droppedSignals: [{ key: "refresh_velocity", reason: velocityReason }],
  };

  printBreakdown(profile);

  const out = `data/${company}.profile.json`;
  await writeFile(out, JSON.stringify(profile, null, 2), "utf8");
  console.log(`[done] wrote ${out}`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
