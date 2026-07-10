/**
 * Step 2 — Brandfetch brand fetch.
 *
 * Calls the Brandfetch Brand API for a domain, downloads the best logo (+icon),
 * and writes data/<company>.brand.json. The API key is read from the
 * BRANDFETCH_API_KEY env var and is never written to disk.
 *
 * Usage:
 *   BRANDFETCH_API_KEY=... npm run fetch:brand -- --company avoma --domain avoma.com
 */

import { writeFile, mkdir } from "node:fs/promises";
import type { BrandColor, BrandProfile } from "./types.ts";
import { loadEnv } from "./searchapi.ts";

interface Args {
  company: string;
  domain: string;
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { company: "avoma", domain: "avoma.com", out: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--domain": a.domain = argv[++i] ?? a.domain; break;
      case "--out": a.out = argv[++i] ?? null; break;
    }
  }
  return a;
}

/** Relative luminance of a #rrggbb hex, 0 (black) – 1 (white). */
function luminance(hex: string): number {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function downloadAsset(url: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv(); // Node 18 has no --env-file; load .env manually (same as the SearchApi fetchers)
  const key = process.env.BRANDFETCH_API_KEY;
  if (!key) {
    console.error("[error] BRANDFETCH_API_KEY env var is required.");
    process.exit(1);
  }

  console.log(`[start] fetching brand for ${args.domain}`);
  const res = await fetch(`https://api.brandfetch.io/v2/brands/${args.domain}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`[error] Brandfetch returned HTTP ${res.status}`);
    process.exit(1);
  }
  const b: any = await res.json();

  // ---- Colors: assign roles ourselves; Brandfetch's `type` is unreliable as a role. ----
  const rawColors: Array<{ hex: string; type?: string; brightness?: number }> = b.colors ?? [];
  const all: BrandColor[] = rawColors.map((c, i) => ({
    hex: c.hex,
    role: i === 0 ? "primary" : c.type === "accent" ? "accent" : "secondary",
    brightness: c.brightness,
    sourceType: c.type,
  }));
  const primary = all[0]?.hex ?? "#111827";
  const accent = all.find((c) => c.role === "accent")?.hex ?? all[2]?.hex ?? null;
  const secondary = all.find((c) => c.role === "secondary" && c.hex !== accent)?.hex ?? null;
  // Landing-page surface defaults are OURS, chosen for contrast — not Brandfetch's.
  const suggestedBackground = "#ffffff";
  const suggestedText = "#0b1220";

  // ---- Fonts ----
  const fonts = {
    title: (b.fonts ?? []).find((f: any) => f.type === "title")?.name ?? null,
    body: (b.fonts ?? []).find((f: any) => f.type === "body")?.name ?? null,
  };

  // ---- Logo: prefer type "logo"; note if only a dark-theme (light-colored) logo exists. ----
  const logos: any[] = b.logos ?? [];
  const logoEntries = logos.filter((l) => l.type === "logo");
  const iconEntries = logos.filter((l) => l.type === "icon" || l.type === "symbol");
  const darkThemeOnly =
    logoEntries.length > 0 && logoEntries.every((l) => l.theme === "dark");
  // Prefer a light-theme logo (for light bg); else take what exists.
  const chosenLogo =
    logoEntries.find((l) => l.theme === "light") ?? logoEntries[0] ?? null;
  const chosenFmt =
    chosenLogo?.formats?.find((f: any) => f.format === "svg") ?? chosenLogo?.formats?.[0] ?? null;

  await mkdir("data", { recursive: true });

  let logoLocal: string | null = null;
  if (chosenFmt?.src) {
    const ext = chosenFmt.format === "svg" ? "svg" : chosenFmt.format ?? "png";
    const path = `data/${args.company}.logo.${ext}`;
    if (await downloadAsset(chosenFmt.src, path)) logoLocal = path;
  }

  const iconFmt = iconEntries[0]?.formats?.[0] ?? null;
  let iconLocal: string | null = null;
  if (iconFmt?.src) {
    const ext = iconFmt.format ?? "png";
    const path = `data/${args.company}.icon.${ext}`;
    if (await downloadAsset(iconFmt.src, path)) iconLocal = path;
  }

  const profile: BrandProfile = {
    company: args.company,
    domain: args.domain,
    fetchedAt: new Date().toISOString(),
    name: b.name ?? args.company,
    description: b.description ?? null,
    longDescription: b.longDescription ?? null,
    colors: { primary, secondary, accent, suggestedBackground, suggestedText, all },
    fonts,
    logo: {
      localPath: logoLocal,
      theme: chosenLogo?.theme ?? null,
      format: chosenFmt?.format ?? null,
      background: chosenFmt?.background ?? null,
      sourceUrl: chosenFmt?.src ?? null,
      darkThemeOnly,
    },
    icon: iconLocal || iconFmt?.src ? { localPath: iconLocal, sourceUrl: iconFmt?.src ?? null } : null,
    companyMeta: {
      foundedYear: b.company?.foundedYear ?? null,
      employees: b.company?.employees ?? null,
      location: b.company?.location
        ? [b.company.location.city, b.company.location.state, b.company.location.countryCode]
            .filter(Boolean)
            .join(", ")
        : null,
      industries: (b.company?.industries ?? []).map((x: any) => x.name).filter(Boolean),
    },
    qualityScore: b.qualityScore ?? null,
  };

  const out = args.out ?? `data/${args.company}.brand.json`;
  await writeFile(out, JSON.stringify(profile, null, 2), "utf8");

  // Readout
  console.log(`\n[brand] ${profile.name} — ${profile.domain}`);
  console.log(`[brand] primary ${primary} (lum ${luminance(primary).toFixed(2)}) | accent ${accent} | secondary ${secondary}`);
  console.log(`[brand] fonts: title=${fonts.title} body=${fonts.body}`);
  console.log(`[brand] logo: ${logoLocal ?? "(failed)"} theme=${profile.logo.theme} darkThemeOnly=${darkThemeOnly}`);
  if (darkThemeOnly) {
    console.log(`[brand] ⚠ only a dark-theme (light-colored) logo exists — Step 5 must place it on a dark surface, not white.`);
  }
  console.log(`[brand] company: founded ${profile.companyMeta.foundedYear}, ${profile.companyMeta.employees} employees, ${profile.companyMeta.location}`);
  console.log(`[done] wrote ${out}`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
