/**
 * Step 5 — Compose a sales page from a per-company PAGE SPEC.
 *
 * Not a fixed template. render.ts is a SECTION COMPOSER: it reads
 * data/<slug>.page.json — an ordered list of typed sections chosen by the
 * orchestrator for THIS company's story — and renders each with the Petavue
 * design system. Structure/narrative vary per company; the visual system stays
 * consistent.
 *
 * Section types (refined agent-led template; see .claude/commands/demand-gen.md Step 4):
 *   hero · homework · statement · capabilities · agentLoop · recommendations ·
 *   comparison · calculator · defensibility · integrations · pilot · cta
 *   (legacy: insight · problem · opportunity · splitFeature · productPreview).
 * Each may set `bg`: "plain" (n-50) | "white" | "tint" (brand p-50).
 *
 * Design system = the FIXED Petavue design language, modeled on the "Avoma"
 * hand-crafted reference: heavy Manrope 800 display headlines + Manrope body/UI +
 * Manrope 700 uppercase eyebrows, with Instrument Serif as an ITALIC ACCENT only
 * (emphasis words in headlines + the statement pull-quote). LIGHT-FIRST rhythm (the
 * "Plain" reference): the page OPENS light and CLOSES light; `dark` is used for AT MOST
 * ~2 sections, spaced far apart, as emphasis (typically the statement pull-quote + the
 * pilot band) — never the hero. Everything else white/tint. Generous radii, refined shadows,
 * fadeUp scroll motion, Phosphor icons. DUAL ACCENT: the selected brand's COLOR is
 * the PRIMARY accent (buttons, eyebrows, capability number badges + outcome pills,
 * integration LIVE pills) via deriveBrand(); a fixed Petavue PURPLE (#6F57FF) is the
 * SECONDARY accent for the "Petavue voice" (agent-card avatar/app name + the
 * recommendation band). Numbered cards (capabilities/agentLoop) with tinted badges
 * and accent OUTCOME pills; rich agent cards (What I found / Why it matters); a
 * 3-column comparison TABLE (Capability | Dashboards | Petavue agents). The TYPEFACE
 * is always Petavue's, never the brand's. Real ad data fills proof blocks.
 *
 * Usage: npm run render -- --company <slug> [--shot]
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { BrandProfile } from "./types.ts";

interface Args { company: string; out: string | null; shot: boolean }
function parseArgs(argv: string[]): Args {
  const a: Args = { company: "avoma", out: null, shot: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--company": a.company = argv[++i] ?? a.company; break;
      case "--out": a.out = argv[++i] ?? null; break;
      case "--shot": a.shot = true; break;
    }
  }
  return a;
}
const esc = (s: string): string => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Headline escaper: like esc(), but *starred words* become an <em> serif-italic accent
// (the Avoma move — one or two emphasis words per headline carry the Instrument Serif).
const escH = (s: string): string => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const TRUST_GREY = "#8E93AF";

// ---------- color math ----------
function hexToRgb(hex: string): [number, number, number] { const m = hex.replace("#", "").match(/^([0-9a-fA-F]{6})$/); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r: number, g: number, b: number): string { const h = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"); return `#${h(r)}${h(g)}${h(b)}`; }
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  const l = (max + min) / 2; return [h, d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l];
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2; let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function luminance(hex: string): number { const [r, g, b] = hexToRgb(hex).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(a: string, b: string): number { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
const hueDist = (a: number, b: number): number => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
function readableOnWhite(h: number, s: number, startL: number): string { let l = Math.min(startL, 0.5), c = hslToHex(h, s, l), g = 0; while (contrast(c, "#ffffff") < 4.5 && l > 0.12 && g++ < 20) { l -= 0.04; c = hslToHex(h, s, l); } return c; }

interface Theme { p50: string; p100: string; p300: string; p500: string; p800: string; pText: string; onP: string; accent50: string; fmt: string[]; }
function deriveBrand(brand: BrandProfile, override?: string): Theme {
  const all = (brand.colors.all ?? []).map((c) => c.hex).filter(Boolean);
  const info = all.map((hex) => { const [h, s, l] = rgbToHsl(...hexToRgb(hex)); return { hex, h, s, l, chroma: s * (1 - Math.abs(2 * l - 1)) }; });
  const hues = info.filter((c) => c.l >= 0.12 && c.l <= 0.85 && c.chroma >= 0.12);
  // A human-verified brandColor (from the page spec) wins — Brandfetch's color
  // ordering is unreliable (it called Avoma green, Primer blue; both wrong).
  const primaryInfo = info.find((c) => c.hex.toLowerCase() === (brand.colors.primary ?? "").toLowerCase());
  const anchor = override
    ? (() => { const [h, s, l] = rgbToHsl(...hexToRgb(override)); return { hex: override, h, s, l, chroma: s * (1 - Math.abs(2 * l - 1)) }; })()
    : (primaryInfo && hues.includes(primaryInfo) ? primaryInfo : [...hues].sort((a, b) => b.chroma - a.chroma)[0]) ?? info[0] ?? { hex: "#3661ED", h: 225, s: 0.85, l: 0.57, chroma: 0.4 };
  const others = hues.filter((c) => c.hex !== anchor.hex);
  const acc = [...others].sort((a, b) => hueDist(b.h, anchor.h) - hueDist(a.h, anchor.h))[0] ?? { hex: hslToHex((anchor.h + 35) % 360, Math.max(anchor.s, 0.5), 0.55), h: (anchor.h + 35) % 360, s: Math.max(anchor.s, 0.5), l: 0.55 };
  const H = anchor.h, Sat = anchor.s;
  return {
    p500: anchor.hex, p50: hslToHex(H, Math.min(Sat, 0.5), 0.965), p100: hslToHex(H, Math.min(Sat, 0.55), 0.92),
    p300: hslToHex(H, Sat * 0.7, 0.72), p800: hslToHex(H, Sat, Math.max(0.24, anchor.l - 0.22)),
    pText: readableOnWhite(H, Sat, anchor.l), onP: contrast("#ffffff", anchor.hex) >= 3.5 ? "#ffffff" : "#232532",
    accent50: hslToHex(acc.h, Math.min(acc.s, 0.5), 0.94),
    fmt: [anchor.hex, hslToHex(H, Sat, 0.68), hslToHex(H, Sat, Math.max(0.26, anchor.l - 0.2)), acc.hex, hslToHex(H, Sat * 0.55, 0.5), hslToHex(H, Sat * 0.85, 0.8)],
  };
}

// ---------- fonts (FIXED Petavue type system: heavy Manrope display + Instrument Serif accent) ----------
// The brand's own fonts are intentionally NOT loaded — every generated page shares one
// premium type system, modeled on the hand-crafted Avoma page: a BOLD Manrope (800) is the
// display/headline face; Instrument Serif is a SPICE, used italic on <em> emphasis words and
// the statement pull-quote only. Eyebrows are Manrope (no monospace). Brand identity comes
// from COLOR (the accent), never the typeface. Signature kept so callers still work.
function fontSetup(_brand: BrandProfile) {
  const head = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">`;
  const sans = `'Manrope', system-ui, -apple-system, Segoe UI, sans-serif`;
  return { head, headingStack: sans, bodyStack: sans, monoStack: sans, serifStack: `'Instrument Serif', Georgia, 'Times New Roman', serif`, title: "Manrope", loadTitle: true };
}

// ---------- assets ----------
async function dataUri(path: string | null): Promise<string | null> { if (!path || !existsSync(path)) return null; const buf = await readFile(path); const ext = path.split(".").pop()?.toLowerCase() ?? "png"; const mime = ext === "svg" ? "image/svg+xml" : ext === "jpeg" || ext === "jpg" ? "image/jpeg" : "image/png"; return `data:${mime};base64,${buf.toString("base64")}`; }
function svgColors(svg: string): string[] { return [...new Set((svg.match(/#[0-9a-fA-F]{3,6}/g) ?? []).map((c) => c.toLowerCase()))]; }
const isWhiteHex = (c: string) => c === "#fff" || c === "#ffffff";
async function targetLogo(path: string | null): Promise<string | null> {
  if (!path || !existsSync(path)) return null; const ext = path.split(".").pop()?.toLowerCase() ?? "png";
  if (ext !== "svg") return dataUri(path);
  let svg = await readFile(path, "utf8"); const colors = svgColors(svg);
  // Monochrome-white logos (hex OR named "white") are invisible on the light nav — recolor to ink.
  const whiteish = /fill\s*[:=]\s*["']?\s*(?:white|#fff(?:fff)?)\b/i.test(svg);
  const hasColor = colors.some((c) => !isWhiteHex(c));
  if (whiteish && !hasColor) svg = svg.replace(/#FFFFFF/gi, "#232532").replace(/#FFF\b/gi, "#232532").replace(/fill:\s*white/gi, "fill:#232532").replace(/fill="white"/gi, 'fill="#232532"');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function monochromeSvg(svg: string, color: string): string { return svg.replace(/(fill|stroke)="(?!none")[^"]*"/gi, `$1="${color}"`).replace(/(fill|stroke):\s*(?!none)[^;"}]+/gi, `$1:${color}`).replace(/currentColor/gi, color); }
async function trustLogos(): Promise<string[]> { const dir = "assets/trust"; if (!existsSync(dir)) return []; const out: string[] = []; for (const f of readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) out.push(`data:image/svg+xml;utf8,${encodeURIComponent(monochromeSvg(await readFile(`${dir}/${f}`, "utf8"), TRUST_GREY))}`); return out; }

// ---------- viz ----------
const FORMATS = [{ label: "single-image", re: /single image|single_image/i }, { label: "video", re: /video/i }, { label: "carousel", re: /carousel/i }, { label: "document", re: /document/i }, { label: "dynamic", re: /dynamic|dco/i }, { label: "text", re: /text/i }];
function buildViz(profile: any, step0: any) {
  const total = parseInt(((profile.signals?.find((s: any) => s.key === "volume")?.raw ?? "").match(/\d+/) ?? ["0"])[0], 10);
  const mix: Record<string, number> = profile.formatMix ?? {}; const buckets = FORMATS.map((f) => ({ label: f.label, count: 0 })); let other = 0;
  for (const [k, v] of Object.entries(mix)) { const idx = FORMATS.findIndex((f) => f.re.test(k)); if (idx >= 0) buckets[idx].count += v as number; else other += v as number; }
  if (other) buckets.push({ label: "other", count: other });
  const segs = buckets.filter((b) => b.count > 0).sort((a, b) => b.count - a.count); const mixTotal = segs.reduce((s, b) => s + b.count, 0);
  const plats = step0?.platforms ?? {}; const pl: Record<string, string> = { linkedin: "LinkedIn", google: "Google", meta: "Meta" };
  const active = Object.entries(plats).map(([k, v]: any) => ({ label: pl[k] ?? k, count: v?.count ?? 0 })).filter((p) => p.count > 0).sort((a, b) => b.count - a.count);
  const names = active.map((p) => p.label);
  const list = names.length <= 1 ? (names[0] ?? "LinkedIn") : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  return { total, segs, mixTotal, formatSampled: mixTotal > 0 && mixTotal < total, reach: names.length > 1 ? `across ${list}` : `on ${list}`, platforms: active };
}

const icon = (name: string) => `<i class="ph ph-${name}"></i>`;

// ---------- section composer ----------
interface Ctx { T: Theme; viz: ReturnType<typeof buildViz>; brand: BrandProfile }
type Section = any;

function wrap(bg: string | undefined, cls: string, inner: string, id?: string): string {
  const bgc = bg === "dark" ? "bg-dark" : bg === "white" ? "bg-white" : bg === "tint" ? "bg-tint" : "bg-plain";
  return `<section class="sec ${cls} ${bgc}"${id ? ` id="${id}"` : ""}><div class="padding-global"><div class="container-large">${inner}</div></div></section>`;
}
function proofCard(C: Ctx): string {
  const v = C.viz;
  const bar = v.segs.map((s, i) => `<span class="ms" style="flex:${s.count};background:${C.T.fmt[i % C.T.fmt.length]}" title="${esc(s.label)}"></span>`).join("");
  const sum = v.segs.slice(0, 2).map((s) => `${Math.round((s.count / v.mixTotal) * 100)}% ${esc(s.label)}`).join(", ") + (v.segs.length > 2 ? " + more" : "");
  return `<div class="proof"><div class="lab">What you're running right now</div><div class="n">${v.total}</div><div class="nsub">live creatives ${esc(v.reach)}</div><div class="mini">${bar}</div><div class="fx">${sum}${v.formatSampled ? " <span style='color:var(--n-400)'>(sampled)</span>" : ""}</div></div>`;
}
function statTiles(C: Ctx): string {
  const v = C.viz;
  const topFmt = v.segs[0] ? `${Math.round((v.segs[0].count / v.mixTotal) * 100)}% ${esc(v.segs[0].label)}` : "—";
  const t = [
    { k: "Live creatives", val: String(v.total) },
    { k: "Platforms", val: v.platforms.map((p) => p.label).join(", ") || "—" },
    { k: "Dominant format", val: topFmt },
  ];
  return `<div class="stat-row">${t.map((x) => `<div class="stat"><div class="sk">${esc(x.k)}</div><div class="sv">${esc(x.val)}</div></div>`).join("")}</div>`;
}

function secHero(s: Section, C: Ctx): string {
  const right = s.card ? agentCard(s.card) : s.proof ? proofCard(C) : "";
  const chips = (s.chips || []).map((c: string) => `<span class="hero-chip">${icon("check")} ${esc(c)}</span>`).join("");
  const inner = `<div class="${right ? "hero-split" : "hero-solo"}">
    <div>
      <div class="section-label">${esc(s.eyebrow)}</div>
      <h1>${escH(s.headline)}</h1>
      <p class="subtitle">${esc(s.subhead)}</p>
      <div class="hero-ctas"><a class="btn-primary" href="#cta">${esc(s.ctaLabel || "Book a walkthrough")}</a>${s.secondaryLabel ? `<a class="btn-secondary" href="#body">${esc(s.secondaryLabel)} ${icon("arrow-right")}</a>` : ""}</div>
      ${chips ? `<div class="hero-chips">${chips}</div>` : ""}
    </div>${right}</div>`;
  return wrap(s.bg, "hero", inner);
}
function secInsight(s: Section, C: Ctx): string {
  return wrap(s.bg ?? "tint", "insight", `<div class="section-label">${icon(s.icon || "chart-bar")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2><p class="section-sub big">${esc(s.body)}</p>${s.showData ? statTiles(C) : ""}`);
}
function secList(s: Section, kind: "problem" | "opportunity"): string {
  const def = kind === "problem" ? "warning-circle" : "check-circle";
  const items = (s.points || []).map((p: any) => `<div class="li-row">${icon(p.icon || def)}<div>${p.title ? `<b>${esc(p.title)}</b><br>` : ""}${esc(p.text)}</div></div>`).join("");
  return wrap(s.bg, kind, `<div class="split2"><div><div class="section-label">${icon(s.icon || (kind === "problem" ? "warning" : "lightning"))} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2></div><div><p class="body">${esc(s.body)}</p>${items ? `<div class="li-list">${items}</div>` : ""}</div></div>`);
}
function secSplit(s: Section): string {
  return wrap(s.bg, "feat", `<div class="split2"><div><div class="section-label">${icon(s.icon || "target")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2></div><div><p class="body">${esc(s.body)}</p>${s.proofline ? `<p class="proofline">${icon("check-circle")} ${esc(s.proofline)}</p>` : ""}</div></div>`);
}
function secStatement(s: Section): string {
  return wrap(s.bg ?? "tint", "state", `<div class="statement">${s.eyebrow ? `<div class="section-label center">${icon(s.icon || "quotes")} ${esc(s.eyebrow)}</div>` : ""}<h2>${escH(s.heading)}</h2>${s.body ? `<p class="body">${esc(s.body)}</p>` : ""}</div>`);
}
function secComparison(s: Section): string {
  const head = `<div class="section-label">${icon(s.icon || "scales")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.sub ? `<p class="section-sub big">${esc(s.sub)}</p>` : ""}`;
  // Preferred: a 3-column capability table (Capability | Dashboards | Petavue agents).
  if (Array.isArray(s.rows) && s.rows.length) {
    const rows = s.rows.map((r: any) => `<tr><th scope="row">${esc(r.capability)}</th><td class="ct-no">${esc(r.dashboards)}</td><td class="ct-yes">${esc(r.petavue)}</td></tr>`).join("");
    const table = `<div class="ctable-wrap"><table class="ctable"><thead><tr><th>Capability</th><th>${esc(s.themLabel || "Dashboards")}</th><th class="ct-p">${esc(s.usLabel || "Petavue agents")}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    return wrap(s.bg ?? "white", "comp comp-table", `${head}${table}`);
  }
  // Backward-compat: the older two-column {them, us} shape.
  const pills = ((s.us && s.us.points) || []).map((p: string) => `<li>${icon("check")} ${esc(p)}</li>`).join("");
  return wrap(s.bg ?? "dark", "comp comp-cols", `${head}<div class="cols"><div class="col them"><div class="tag">${esc(s.them.tag)}</div><p class="body">${esc(s.them.body)}</p></div><div class="col us"><div class="tag">${esc(s.us.tag)}</div><p class="body">${esc(s.us.body)}</p>${pills ? `<ul class="pills">${pills}</ul>` : ""}</div></div>`);
}
function secCapabilities(s: Section): string {
  const n = (s.items || []).length;
  const cards = (s.items || []).map((it: any, i: number) => `<div class="cap"><div class="cap-top"><span class="cap-num">${String(i + 1).padStart(2, "0")}</span>${it.icon ? `<span class="cap-ic">${icon(it.icon)}</span>` : ""}</div><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p>${it.outcome ? `<span class="cap-outcome">${esc(it.outcome)}</span>` : ""}</div>`).join("");
  return wrap(s.bg, "caps", `<div class="section-label">${icon(s.icon || "stack")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.sub ? `<p class="section-sub big">${esc(s.sub)}</p>` : ""}<div class="cap-grid cols-${n % 3 === 0 ? 3 : 2}">${cards}</div>`);
}
function secProduct(s: Section): string {
  const feats = (s.features || [{ icon: "chart-line-up", text: "Which channel, campaign, and creative produced pipeline" }, { icon: "magnifying-glass", text: "Why a metric moved — root cause, not just a dashboard" }, { icon: "trend-up", text: "Unit economics & pipeline forecasting, across channels" }]).map((f: any) => `<div class="frow">${icon(f.icon || "circle")}<span>${esc(f.text)}</span></div>`).join("");
  const inner = `<div class="section-label center">${icon(s.icon || "chart-line-up")} ${esc(s.eyebrow || "The product")}</div><h2 class="section-heading center">${escH(s.heading || "See where your pipeline actually comes from")}</h2>${s.sub ? `<p class="section-sub center">${esc(s.sub)}</p>` : ""}
    <div class="mock"><div class="tb"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span class="u">app.petavue.com</span></div>
      <div class="g"><div class="side"><div class="b">Petavue</div><a class="on">${icon("chart-line-up")} Attribution</a><a>${icon("magnifying-glass")} Diagnostics</a><a>${icon("trend-up")} Pipeline forecast</a><a>${icon("coins")} Unit economics</a><a>${icon("crosshair")} Account scoring</a></div>
      <div class="main"><div class="mh">${esc(s.panelTitle || "Cross-channel attribution")}</div><p class="mdesc">${esc(s.panelDesc || "Every channel's spend connected to closed revenue — LinkedIn, Google, Meta, events, organic — in one model.")}</p><div class="frows">${feats}</div></div></div></div>`;
  return wrap(s.bg ?? "tint", "prod", inner, "product");
}
function secCta(s: Section): string {
  return wrap(s.bg, "cta", `<div class="ctablock"><h2>${escH(s.heading)}</h2><p>${esc(s.body)}</p><a class="btn-primary" href="#">${esc(s.ctaLabel || "Book a teardown")} ${icon("arrow-right")}</a></div>`, "cta");
}
// ---------- refined-template sections (agent-led) ----------
// A reusable Slack/inbox-style agent recommendation card — used in the hero and the recommendations section.
function agentCard(c: any): string {
  const metrics = (c.metrics || []).map((m: any) => `<div class="acm"><div class="acm-v">${esc(m.v)}</div><div class="acm-k">${esc(m.k)}</div></div>`).join("");
  const actions = (c.actions || []).map((a: string, i: number) => `<span class="ac-btn${i === 0 ? " pri" : ""}">${esc(a)}</span>`).join("");
  return `<div class="acard">
    <div class="ac-top"><span class="ac-dot">${icon("sparkle")}</span><span class="ac-app">${esc(c.app || "Petavue Agent")}</span><span class="ac-time">${esc(c.time || "6:02 AM")}</span></div>
    ${c.tag ? `<div class="ac-tag">${esc(c.tag)}</div>` : ""}
    <div class="ac-title">${esc(c.title)}</div>
    ${c.found ? `<p class="ac-para"><b>What I found:</b> ${esc(c.found)}</p>` : ""}
    ${c.why ? `<p class="ac-para"><b>Why it matters:</b> ${esc(c.why)}</p>` : ""}
    ${c.body ? `<p class="ac-body">${esc(c.body)}</p>` : ""}
    ${metrics ? `<div class="ac-metrics">${metrics}</div>` : ""}
    ${c.move ? `<div class="ac-move"><b>Recommendation</b> ${esc(c.move)}</div>` : ""}
    ${c.impact ? `<div class="ac-impact">${icon("trend-up")} ${esc(c.impact)}</div>` : ""}
    ${actions ? `<div class="ac-actions">${actions}</div>` : ""}
  </div>`;
}
// "We did our homework" — per-channel ad-intelligence recap (the subtle personalization proof).
function secHomework(s: Section): string {
  const cards = (s.channels || []).map((ch: any) => `<div class="hw-card"><div class="hw-plat">${esc(ch.platform)}</div><div class="hw-stat">${esc(ch.stat)}</div><div class="hw-label">${esc(ch.label)}</div><p>${esc(ch.body)}</p></div>`).join("");
  return wrap(s.bg ?? "white", "hw", `<div class="section-label">${icon(s.icon || "binoculars")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="hw-grid">${cards}</div>${s.footer ? `<p class="hw-footer">${esc(s.footer)}</p>` : ""}`);
}
// "Point the agents at a goal" — example goals + the monitor→act loop.
function secAgentLoop(s: Section): string {
  const goals = (s.goals || []).map((g: any) => `<div class="al-goal"><div class="al-goal-tag">Example goal</div><div class="al-goal-t">${esc(g.text)}</div><p>${esc(g.result)}</p></div>`).join("");
  const steps = (s.steps || []).map((st: any, i: number) => `<div class="al-step"><div class="al-n">${String(i + 1).padStart(2, "0")}</div><h3>${esc(st.title)}</h3><p>${esc(st.body)}</p></div>`).join("");
  return wrap(s.bg ?? "tint", "al", `<div class="section-label">${icon(s.icon || "target")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}${goals ? `<div class="al-goals">${goals}</div>` : ""}<div class="al-steps">${steps}</div>`);
}
// "Two engines, running daily" — live agent recommendation mocks.
function secRecommendations(s: Section): string {
  const cards = (s.cards || []).map((c: any) => agentCard(c)).join("");
  return wrap(s.bg ?? "plain", "recs", `<div class="section-label">${icon(s.icon || "lightning")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="recs-grid">${cards}</div>${s.note ? `<p class="recs-note">${esc(s.note)}</p>` : ""}`);
}
// Interactive missed-pipeline calculator.
function secCalculator(s: Section): string {
  const icp0 = s.icp ?? 50, fit0 = s.fit ?? 60, conv0 = s.conv ?? 3, acv0 = s.acv ?? 50000;
  const inner = `<div class="section-label center">${icon(s.icon || "calculator")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}
   <div class="calc">
     <div class="calc-inputs">
       <label>ICP accounts engaging ads / month <b><span id="calc-icp-v">${icp0}</span></b><input id="calc-icp" type="range" min="10" max="300" step="5" value="${icp0}"></label>
       <label>True-fit ICP <b><span id="calc-fit-v">${fit0}</span>%</b><input id="calc-fit" type="range" min="20" max="90" step="5" value="${fit0}"></label>
       <label>Pipeline conversion <b><span id="calc-conv-v">${conv0}</span>%</b><input id="calc-conv" type="range" min="1" max="20" step="1" value="${conv0}"></label>
       <label>Average contract value <b>$<span id="calc-acv-v">${acv0.toLocaleString()}</span></b><input id="calc-acv" type="range" min="10000" max="250000" step="5000" value="${acv0}"></label>
     </div>
     <div class="calc-out">
       <div class="calc-flow">
         <div class="cf"><span>ICP accounts engage your ads</span><b id="calc-o-icp">${icp0}</b></div>
         <div class="cf"><span>True-fit ICP (right persona + stage)</span><b id="calc-o-fit">0</b></div>
         <div class="cf"><span>Reaching an opportunity today</span><b id="calc-o-opp">0</b></div>
         <div class="cf big"><span>Missed: ICP with no opportunity</span><b id="calc-o-miss">0</b></div>
       </div>
       <div class="calc-hero"><div class="calc-hero-k">Recoverable pipeline / year</div><div class="calc-hero-v" id="calc-o-year">$0</div><div class="calc-hero-sub" id="calc-o-mo">$0 / month</div></div>
     </div>
   </div>
   <p class="calc-note">${esc(s.note || "Conservative by default — most pilots find the real number is higher. Illustrative until calibrated on your own data.")}</p>
   <script>(function(){var f=function(n){return n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+Math.round(n/1e3)+'K':'$'+Math.round(n);};var g=function(id){return document.getElementById(id);};function upd(){var icp=+g('calc-icp').value,fit=+g('calc-fit').value,conv=+g('calc-conv').value,acv=+g('calc-acv').value;g('calc-icp-v').textContent=icp;g('calc-fit-v').textContent=fit;g('calc-conv-v').textContent=conv;g('calc-acv-v').textContent=acv.toLocaleString();var tf=Math.round(icp*fit/100),opp=Math.max(0,Math.round(tf*conv/100)),miss=Math.max(0,tf-opp);g('calc-o-icp').textContent=icp;g('calc-o-fit').textContent=tf;g('calc-o-opp').textContent=opp;g('calc-o-miss').textContent=miss;var mo=miss*acv;g('calc-o-year').textContent=f(mo*12);g('calc-o-mo').textContent=f(mo)+' / month';}['calc-icp','calc-fit','calc-conv','calc-acv'].forEach(function(id){g(id).addEventListener('input',upd);});upd();})();</script>`;
  return wrap(s.bg ?? "white", "calc-sec", inner);
}
// "Recommendations you can defend" — trust/defensibility cards (reuses .cap styling).
function secDefensibility(s: Section): string {
  const cards = (s.points || []).map((p: any) => `<div class="cap"><div class="cap-ic">${icon(p.icon || "shield-check")}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div>`).join("");
  return wrap(s.bg ?? "plain", "caps", `<div class="section-label center">${icon(s.icon || "shield-check")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}<div class="cap-grid cols-3">${cards}</div>`);
}
// "Connects to your stack" — integration chips with LIVE/READY badges.
function secIntegrations(s: Section): string {
  const badge = (status: string) => status === "live" ? `<span class="intg-status">Live for you</span>` : status === "ready" ? `<span class="intg-status">Ready if you add it</span>` : "";
  const groups = (s.groups || []).map((gr: any) => `<div class="intg-group"><div class="intg-glabel">${esc(gr.label)}</div><div class="intg-pills">${(gr.items || []).map((it: any) => `<div class="intg-pill${it.status === "live" ? " live" : it.status === "ready" ? " ready" : ""}"><span class="intg-name">${esc(it.name)}</span>${badge(it.status)}</div>`).join("")}</div></div>`).join("");
  return wrap(s.bg ?? "white", "intg", `<div class="section-label">${icon(s.icon || "plugs-connected")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="intg-groups">${groups}</div>`);
}
// The pilot — week-by-week timeline.
function secPilot(s: Section): string {
  const steps = (s.steps || []).map((st: any) => `<div class="pilot-step"><div class="pilot-when">${esc(st.when)}</div><h3>${esc(st.title)}</h3><p>${esc(st.body)}</p></div>`).join("");
  return wrap(s.bg ?? "tint", "pilot", `<div class="section-label center">${icon(s.icon || "rocket-launch")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}<div class="pilot-grid">${steps}</div>`);
}
// Booking — the closer: a LIVE cal.com calendar embedded in the page (no bounce to a new tab).
// The embed is themed with the page's brand color (C.T.p500), so the prospect books inside
// their own brand's page. `cal` = the cal.com link slug (default "prasanna"). Self-contained
// like the calculator — its loader script lives inside the section. NOTE: the embed pulls JS
// from app.cal.com at runtime, so it renders on the DEPLOYED page (and may be blank in a
// local --shot screenshot, which has no network). Falls back to a plain link if JS is off.
function secBooking(s: Section, C: Ctx): string {
  const cal = String(s.cal || "prasanna").replace(/[^a-zA-Z0-9/_-]/g, "");
  const brandHex = /^#[0-9a-fA-F]{6}$/.test(C.T.p500 || "") ? C.T.p500 : "#6F57FF";
  const embed = `<div class="book-embed"><div id="cal-inline" style="width:100%;height:100%;min-height:640px;overflow:auto"><noscript><a class="btn-primary" href="https://cal.com/${cal}" target="_blank" rel="noopener">Pick a time on the calendar ${icon("arrow-up-right")}</a></noscript></div></div>
<script>(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", {origin:"https://cal.com"});
Cal("inline", { elementOrSelector:"#cal-inline", calLink: "${cal}", layout: "month_view" });
Cal("ui", { styles:{ branding:{ brandColor:"${brandHex}" } }, hideEventTypeDetails:false, layout:"month_view" });</script>`;
  // id="cta" so the hero's "Book a walkthrough" button (href="#cta") scrolls here — booking
  // and cta are mutually-exclusive closers, so the anchor is unambiguous.
  return wrap(s.bg ?? "white", "book", `<div class="section-label center">${icon(s.icon || "calendar-check")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${escH(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}${embed}`, "cta");
}

const RENDERERS: Record<string, (s: Section, C: Ctx) => string> = {
  hero: secHero, insight: secInsight, problem: (s) => secList(s, "problem"), opportunity: (s) => secList(s, "opportunity"),
  splitFeature: (s) => secSplit(s), statement: (s) => secStatement(s), comparison: (s) => secComparison(s),
  capabilities: (s) => secCapabilities(s), productPreview: (s) => secProduct(s), cta: (s) => secCta(s),
  homework: (s) => secHomework(s), agentLoop: (s) => secAgentLoop(s), recommendations: (s) => secRecommendations(s),
  calculator: (s) => secCalculator(s), defensibility: (s) => secDefensibility(s), integrations: (s) => secIntegrations(s),
  pilot: (s) => secPilot(s), booking: (s, C) => secBooking(s, C),
};

// ---------- page-spec validation (fail loud; never silently drop a section) ----------
// Minimal required fields per section type — enough to catch typos and empty sections
// before they render as an invisible HTML comment.
const REQUIRED_FIELDS: Record<string, string[]> = {
  hero: ["headline"], homework: ["channels"], insight: ["heading"], problem: ["heading"],
  opportunity: ["heading"], splitFeature: ["heading"], statement: ["heading"], capabilities: ["items"],
  agentLoop: ["steps"], recommendations: ["cards"], calculator: ["heading"],
  defensibility: ["points"], integrations: ["groups"], productPreview: [], pilot: ["steps"], cta: ["heading"],
  booking: ["heading"],
};
function validateSpec(spec: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];
  const known = new Set(Object.keys(RENDERERS));
  const secs = spec?.sections;
  if (!Array.isArray(secs) || secs.length === 0) { errors.push('spec.sections must be a non-empty array'); return { errors, warnings }; }
  secs.forEach((s: any, i: number) => {
    const t = s?.type;
    if (!t) { errors.push(`section[${i}] has no "type"`); return; }
    if (!known.has(t)) { errors.push(`section[${i}] unknown type "${t}" — it would silently vanish. Known: ${[...known].join(", ")}`); return; }
    for (const f of REQUIRED_FIELDS[t] ?? []) {
      const v = s[f];
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) errors.push(`section[${i}] "${t}" is missing required field "${f}"`);
    }
    // comparison needs EITHER the new `rows` table OR the legacy `them`+`us` two-column shape.
    if (t === "comparison") {
      const hasRows = Array.isArray(s.rows) && s.rows.length > 0;
      const hasCols = s.them != null && s.us != null;
      if (!hasRows && !hasCols) errors.push(`section[${i}] "comparison" needs either "rows" (table) or "them"+"us" (columns)`);
    }
  });
  const types = secs.map((s: any) => s?.type);
  if (!types.includes("hero")) errors.push('no "hero" section');
  else if (types[0] !== "hero") warnings.push('"hero" is not the first section');
  const closers = ["cta", "booking"];
  if (!types.some((t) => closers.includes(t))) warnings.push('no "cta" or "booking" closing section');
  else if (!closers.includes(types[types.length - 1])) warnings.push('the last section should be a "cta" or "booking" closer');
  if (!spec.brandColor) warnings.push('no verified brandColor — falling back to Brandfetch color ordering, which is unreliable');
  return { errors, warnings };
}

function shell(spec: any, brand: BrandProfile, T: Theme, F: ReturnType<typeof fontSetup>, body: string, logoUri: string | null, petavueLogo: string | null, favicon: string | null, touchIcon: string | null): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Petavue for ${esc(brand.name)}</title>
<meta name="description" content="Petavue — see where ${esc(brand.name)}'s pipeline actually comes from, across every channel.">
${favicon ? `<link rel="icon" type="image/svg+xml" href="${favicon}">` : ""}${touchIcon ? `<link rel="apple-touch-icon" href="${touchIcon}">` : ""}
${F.head}
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
<style>
  :root{--p-50:${T.p50};--p-100:${T.p100};--p-300:${T.p300};--p-500:${T.p500};--p-800:${T.p800};--p-text:${T.pText};--on-p:${T.onP};--accent-50:${T.accent50};
    /* SECONDARY accent — the fixed Petavue purple for the "Petavue voice" (agent avatar/app, rec band) */
    --purple:#6F57FF;--purple-600:#5B44E8;--purple-50:#EFECFF;--purple-100:#E2DCFF;--purple-text:#5A43E0;
    /* rich neutral / navy base (fixed) — brand color enters only as the accent above */
    --bg:#F0F1F5;--bg-card:#FFFFFF;
    --navy:#111726;--navy-mid:#1E2B45;--navy-soft:#2C3D5C;
    --teal:#0F9B6E;--teal-light:#D1F5E8;--teal-ink:#0B7A56;--coral:#E8452A;--coral-light:#FDECEA;--amber:#D97706;
    --n-50:#F0F1F5;--n-100:#E9EBF1;--n-200:#E1E4EC;--n-300:#CBD0DE;--n-400:#9BA3B8;--n-500:#757F99;--n-600:#5A6380;--n-700:#39415C;--n-800:#1E2B45;--n-900:#151C2E;
    --text:#1E2B45;--text-muted:#5A6380;--heading:#151C2E;--f-heading:${F.headingStack};--f-body:${F.bodyStack};--f-mono:${F.monoStack};--f-serif:${F.serifStack};
    /* on-dark palette */
    --d-heading:#FFFFFF;--d-text:#C5CBDE;--d-muted:#8B93AC;--d-line:rgba(255,255,255,.10);--d-card:#1A2236;
    --radius:12px;--radius-lg:20px;--radius-pill:999px;
    --shadow:0 1px 2px rgba(21,28,46,.04),0 8px 24px rgba(21,28,46,.05);--shadow-lg:0 2px 6px rgba(21,28,46,.05),0 24px 60px rgba(21,28,46,.10);}
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--text);font-family:var(--f-body);line-height:1.7;-webkit-font-smoothing:antialiased;font-weight:400}
  .padding-global{padding:0 5%}.container-large{max-width:72rem;margin:0 auto;padding:0 20px}
  .sec{padding:88px 0}.bg-plain{background:var(--bg)}.bg-white{background:var(--bg-card)}.bg-tint{background:var(--p-50)}
  .sec.bg-white{border-top:1px solid var(--n-200);border-bottom:1px solid var(--n-200)}
  /* ---- dark section: navy band, on-dark type; components get dark variants below ---- */
  .sec.bg-dark{background:var(--navy);color:var(--d-text)}
  .bg-dark h1,.bg-dark h2,.bg-dark h3{color:var(--d-heading)}
  .bg-dark .section-heading{color:var(--d-heading)}
  .bg-dark .section-label{color:var(--p-300)}
  .bg-dark .section-sub,.bg-dark .body{color:var(--d-muted)}
  .bg-dark b,.bg-dark strong{color:var(--d-heading)}
  h1,h2,h3{font-family:var(--f-heading);font-weight:800;color:var(--heading);margin:0}
  /* Instrument Serif accent — italic emphasis words in headlines + the statement pull-quote */
  .section-heading em,.hero h1 em,.cta h2 em{font-family:var(--f-serif);font-weight:400;font-style:italic;letter-spacing:-.5px;color:var(--heading)}
  .bg-dark .section-heading em,.hero.bg-dark h1 em,.cta.bg-dark h2 em{color:inherit}
  em{font-style:italic}
  .ph{vertical-align:middle;line-height:1}
  b,strong{font-weight:700;color:var(--heading)}
  /* eyebrow / section label — Manrope 700, wide-tracked uppercase, brand accent */
  .section-label{font-family:var(--f-body);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--p-text);display:inline-flex;align-items:center;gap:8px;margin-bottom:16px}
  .section-label.center{justify-content:center}.section-label .ph{font-size:15px}
  /* display heading — Instrument Serif, editorial, tight tracking */
  .section-heading{font-family:var(--f-heading);font-size:clamp(30px,4vw,46px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;color:var(--heading);max-width:20ch;margin:0}
  .section-heading.center{text-align:center;margin:0 auto}
  .section-sub{font-family:var(--f-body);font-size:16px;color:var(--text-muted);line-height:1.75;max-width:600px;margin-top:16px}
  .section-sub.big{font-size:17px;max-width:640px}.section-sub.center{text-align:center;margin-left:auto;margin-right:auto}
  .body{color:var(--text-muted);font-size:16px;line-height:1.75}
  .btn-primary,.btn-secondary{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-body);font-size:14px;font-weight:700;letter-spacing:-.1px;padding:13px 26px;border-radius:var(--radius-pill);text-decoration:none;transition:.2s;cursor:pointer}
  .btn-primary{background:var(--p-500);color:var(--on-p);border:1px solid transparent;box-shadow:0 1px 2px rgba(21,28,46,.12)}.btn-primary:hover{background:var(--p-800);transform:translateY(-1px);gap:11px}
  .btn-secondary{background:var(--bg-card);color:var(--navy);border:1.5px solid var(--n-200)}.btn-secondary:hover{border-color:var(--navy);transform:translateY(-1px)}

  .nav{padding:20px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--n-200)}
  .nav .plogo{height:24px}.nav .rhs{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--n-400)}.nav .rhs img{height:22px}
  .nav .rhs strong{color:var(--navy);font-weight:800}

  /* hero */
  .hero{padding-top:80px;padding-bottom:72px;position:relative;overflow:hidden}
  .hero .hero-split{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center;position:relative;z-index:1}
  .hero .hero-solo{max-width:820px;position:relative;z-index:1}
  .hero h1{font-size:clamp(44px,6.4vw,72px);line-height:1.02;letter-spacing:-2.4px;margin:0 0 24px;font-weight:800}
  .hero .subtitle{font-size:17px;color:var(--text-muted);max-width:52ch;margin:0 0 28px;line-height:1.75}
  .hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
  /* dark hero — navy with a subtle purple radial glow top-right (Fixify signature) */
  .hero.bg-dark::before{content:"";position:absolute;top:-180px;right:-160px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(111,87,255,.34),transparent 68%);pointer-events:none;z-index:0}
  .hero.bg-dark::after{content:"";position:absolute;bottom:-220px;left:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--p-500) 26%,transparent),transparent 70%);pointer-events:none;z-index:0}
  .hero.bg-dark .subtitle{color:var(--d-text)}
  .hero.bg-dark .subtitle strong{color:#fff}
  .hero.bg-dark .btn-secondary{background:rgba(255,255,255,.06);color:#fff;border-color:rgba(255,255,255,.18)}
  .hero.bg-dark .btn-secondary:hover{border-color:rgba(255,255,255,.5)}
  .proof{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);box-shadow:var(--shadow);padding:26px}
  .proof .lab{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--n-400);margin-bottom:12px}
  .proof .n{font-family:var(--f-body);font-variant-numeric:tabular-nums;font-size:52px;font-weight:800;color:var(--navy);line-height:1;letter-spacing:-2px}
  .proof .nsub{font-size:13px;color:var(--n-500);margin:8px 0 18px}
  .proof .mini{display:flex;gap:2px;height:10px;border-radius:99px;overflow:hidden;background:var(--n-100)}.proof .ms{min-width:3px}
  .proof .fx{margin-top:11px;font-size:13px;color:var(--text-muted)}

  /* insight stat row */
  .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}
  .stat{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius);padding:22px}
  .stat .sk{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--n-400);margin-bottom:8px}
  .stat .sv{font-family:var(--f-body);font-weight:800;font-size:24px;color:var(--navy);line-height:1.2;letter-spacing:-.5px}

  /* split (feat/problem/opportunity) */
  .split2{display:grid;grid-template-columns:1fr 1.15fr;gap:52px;align-items:start}
  .li-list{margin-top:22px;display:flex;flex-direction:column;gap:14px}
  .li-row{display:flex;gap:13px;align-items:flex-start;font-size:15.5px;color:var(--text-muted)}
  .li-row .ph{color:var(--p-text);font-size:21px;flex:none;margin-top:1px}.li-row b{color:var(--heading)}
  .proofline{margin-top:18px;color:var(--p-text);font-weight:600;font-size:15px;display:flex;gap:9px;align-items:flex-start}.proofline .ph{font-size:19px;flex:none}

  /* statement — big editorial serif quote */
  .state{padding:104px 0}
  .state .statement{text-align:center;max-width:860px;margin:0 auto}
  .state h2{font-family:var(--f-serif);font-weight:400;font-size:clamp(32px,4.6vw,54px);font-style:italic;line-height:1.14;letter-spacing:-1px;margin:0 auto;max-width:22ch;color:var(--navy)}
  .state .body{margin:24px auto 0;color:var(--text-muted);font-size:18px;max-width:56ch}
  .bg-dark.state h2{color:#fff}.bg-dark.state .body{color:var(--d-text)}
  .bg-dark.state .section-label{justify-content:center}

  /* comparison — preferred: a 3-column capability TABLE (Capability | Dashboards | Petavue agents) */
  .ctable-wrap{margin-top:44px;overflow-x:auto;border-radius:var(--radius-lg);border:1px solid var(--n-200);box-shadow:var(--shadow)}
  .ctable{width:100%;border-collapse:collapse;background:var(--bg-card);min-width:640px}
  .ctable thead th{font-family:var(--f-body);font-size:12px;font-weight:800;letter-spacing:.02em;text-align:left;padding:16px 20px;background:var(--n-50);color:var(--text-muted);border-bottom:1px solid var(--n-200)}
  .ctable thead th.ct-p{color:var(--p-text)}
  .ctable tbody th{font-family:var(--f-body);font-size:14px;font-weight:800;letter-spacing:-.2px;color:var(--heading);text-align:left;padding:18px 20px;vertical-align:top;width:30%;border-bottom:1px solid var(--n-200)}
  .ctable td{font-size:13.5px;line-height:1.6;padding:18px 20px;vertical-align:top;border-bottom:1px solid var(--n-200)}
  .ctable tr:last-child th,.ctable tr:last-child td{border-bottom:none}
  .ctable .ct-no{color:var(--text-muted)}.ctable .ct-no::before{content:"✗";color:var(--coral);font-weight:700;margin-right:9px}
  .ctable .ct-yes{color:var(--text);background:color-mix(in srgb,var(--p-500) 5%,transparent)}.ctable .ct-yes::before{content:"✓";color:var(--teal);font-weight:700;margin-right:9px}
  .bg-dark .ctable-wrap{border-color:var(--d-line)}.bg-dark .ctable{background:var(--d-card)}
  .bg-dark .ctable thead th{background:rgba(255,255,255,.04);color:var(--d-muted);border-color:var(--d-line)}
  .bg-dark .ctable tbody th{color:#fff;border-color:var(--d-line)}.bg-dark .ctable td{color:var(--d-text);border-color:var(--d-line)}

  /* comparison (legacy two-column) — dark navy "dashboard vs agents" panel */
  .sec.comp-cols{background:var(--navy)}
  .comp-cols .section-label{color:var(--p-300)}
  .comp-cols .section-heading{color:#fff}
  .comp-cols .section-sub{color:var(--n-400)}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:stretch;margin-top:40px}
  .col{border-radius:var(--radius-lg);padding:30px;display:flex;flex-direction:column}
  .col.them{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}
  .col.us{background:linear-gradient(180deg,color-mix(in srgb,var(--p-500) 24%,var(--navy)),color-mix(in srgb,var(--p-500) 12%,var(--navy)));border:1px solid color-mix(in srgb,var(--p-500) 45%,transparent);box-shadow:0 20px 50px rgba(0,0,0,.25)}
  .col .tag{font-family:var(--f-body);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px}
  .col.them .tag{color:var(--n-400)}.col.us .tag{color:#8FB6FF}
  .col.them .body{color:#AEB6CC;font-size:15px}.col.us .body{color:#E7ECF6;font-size:16px;margin:0 0 20px}
  .col.them h2,.col.us h2{color:#fff}
  .pills{list-style:none;margin:auto 0 0;padding:20px 0 0;border-top:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;gap:12px}
  .pills li{display:flex;gap:11px;align-items:flex-start;font-size:14.5px;color:#DCE3F1}.pills li .ph{font-size:18px;flex:none;margin-top:1px;color:#4ADE9B}

  /* capabilities grid — numbered cards + accent outcome pill */
  .cap-grid{display:grid;gap:18px;margin-top:44px}.cap-grid.cols-3{grid-template-columns:repeat(3,1fr)}.cap-grid.cols-2{grid-template-columns:repeat(2,1fr)}
  .cap{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);padding:26px;box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column}
  .cap:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}
  .cap-top{display:flex;align-items:center;gap:11px;margin-bottom:16px}
  .cap-num{font-family:var(--f-mono);font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--p-text);background:var(--p-50);border-radius:8px;padding:5px 9px;line-height:1}
  .cap-ic{width:34px;height:34px;border-radius:9px;background:var(--p-50);color:var(--p-text);display:flex;align-items:center;justify-content:center;font-size:18px}
  .cap>.cap-ic{width:42px;height:42px;border-radius:11px;font-size:20px;margin-bottom:18px}
  .cap h3{font-family:var(--f-body);font-size:16px;font-weight:800;letter-spacing:-.3px;margin:0 0 8px;color:var(--heading)}.cap p{margin:0;font-size:14px;color:var(--text-muted);line-height:1.65}
  .cap-outcome{align-self:flex-start;margin-top:16px;font-family:var(--f-mono);font-size:11.5px;font-weight:500;letter-spacing:-.1px;color:var(--p-text);background:var(--p-50);border:1px solid var(--p-100);border-radius:var(--radius-pill);padding:6px 13px;line-height:1.3}
  /* capabilities on dark */
  .bg-dark .cap{background:var(--d-card);border-color:var(--d-line);box-shadow:none}
  .bg-dark .cap:hover{box-shadow:0 24px 50px rgba(0,0,0,.35)}
  .bg-dark .cap h3{color:#fff}.bg-dark .cap p{color:var(--d-muted)}
  .bg-dark .cap-num{background:color-mix(in srgb,var(--p-500) 20%,transparent);color:var(--p-300)}
  .bg-dark .cap-ic{background:color-mix(in srgb,var(--p-500) 18%,transparent);color:var(--p-300)}
  .bg-dark .cap-outcome{background:color-mix(in srgb,var(--p-500) 16%,transparent);border-color:color-mix(in srgb,var(--p-500) 34%,transparent);color:var(--p-300)}

  /* product mockup */
  .prod .mock{max-width:940px;margin:44px auto 0;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);border:1px solid var(--n-200);text-align:left;background:var(--bg-card)}
  .mock .tb{display:flex;align-items:center;gap:8px;padding:13px 16px;background:var(--bg);border-bottom:1px solid var(--n-200)}
  .mock .tb i.dot{width:11px;height:11px;border-radius:50%;background:var(--n-300);display:inline-block}.mock .tb .u{margin-left:14px;font-family:var(--f-body);font-size:12px;font-weight:600;color:var(--n-400)}
  .mock .g{display:grid;grid-template-columns:210px 1fr}
  .mock .side{background:var(--bg);padding:20px 14px;border-right:1px solid var(--n-200)}.mock .side .b{font-family:var(--f-body);font-weight:800;font-size:15px;margin:0 8px 18px;color:var(--heading)}
  .mock .side a{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;color:var(--n-500);font-size:13px;font-weight:600;margin-bottom:3px;text-decoration:none}.mock .side a .ph{font-size:17px}.mock .side a.on{background:var(--p-50);color:var(--p-text);font-weight:700}
  .mock .main{padding:26px}.mock .main .mh{font-family:var(--f-body);font-weight:800;font-size:18px;letter-spacing:-.3px;margin:0 0 10px;color:var(--heading)}
  .mdesc{color:var(--text-muted);font-size:14px;margin:0 0 18px;max-width:52ch}
  .frows{display:flex;flex-direction:column;gap:10px}.frow{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text);background:var(--bg);border:1px solid var(--n-200);border-radius:10px;padding:13px 15px}.frow .ph{color:var(--p-text);font-size:18px;flex:none}

  /* cta */
  .cta{padding:104px 0}.cta .ctablock{text-align:center;max-width:680px;margin:0 auto}
  .cta h2{font-size:clamp(32px,4.6vw,52px);letter-spacing:-1.2px;line-height:1.06;margin:0 auto 18px;max-width:18ch}.cta p{color:var(--text-muted);font-size:17px;margin:0 auto 28px;max-width:46ch;line-height:1.7}

  footer{background:var(--navy);border-top:1px solid rgba(255,255,255,.06);padding:30px 0}
  footer .container-large{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  footer .plogo{height:20px;filter:brightness(0) invert(1);opacity:.85}footer .fine{font-size:12px;color:#64748B;font-weight:500}
  footer strong{color:#fff}

  /* hero trust chips */
  .hero-chips{display:flex;gap:22px;flex-wrap:wrap;margin-top:28px}
  .hero-chip{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:500;color:var(--text-muted)}
  .hero-chip .ph{color:var(--teal);font-size:12px;background:var(--teal-light);width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center}
  .hero.bg-dark .hero-chip{color:var(--d-text)}
  .hero.bg-dark .hero-chip .ph{color:#4ADE9B;background:rgba(74,222,155,.14)}

  /* agent recommendation card — refined Slack-style, brand-accented */
  .acard{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);padding:22px;text-align:left;display:flex;flex-direction:column}
  .ac-top{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--n-400);margin-bottom:14px;padding-bottom:13px;border-bottom:1px solid var(--n-200)}
  .ac-dot{width:28px;height:28px;border-radius:8px;background:var(--purple);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex:none}
  .ac-app{font-weight:800;color:var(--purple-text)}.ac-time{margin-left:auto;font-weight:500;color:var(--n-400)}
  .ac-tag{font-family:var(--f-mono);font-size:9.5px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--p-text);background:var(--p-50);align-self:flex-start;padding:4px 9px;border-radius:6px;margin-bottom:12px}
  .ac-title{font-family:var(--f-body);font-weight:800;font-size:16px;letter-spacing:-.3px;color:var(--navy);line-height:1.32;margin-bottom:12px}
  .ac-para{font-size:13px;color:var(--text-muted);margin:0 0 10px;line-height:1.6}.ac-para b{color:var(--navy);font-weight:700}
  .ac-body{font-size:13px;color:var(--text-muted);margin:0 0 16px;line-height:1.6}
  .ac-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
  .acm{background:var(--bg);border:1px solid var(--n-200);border-radius:10px;padding:12px 8px;text-align:center}
  .acm-v{font-family:var(--f-body);font-variant-numeric:tabular-nums;font-weight:800;font-size:19px;color:var(--navy);line-height:1;letter-spacing:-.5px}
  .acm-k{font-size:9px;font-weight:600;color:var(--n-400);text-transform:uppercase;letter-spacing:.04em;margin-top:6px;line-height:1.2}
  .ac-move{font-size:13px;color:var(--purple-text);background:var(--purple-50);border:1px solid var(--purple-100);border-radius:10px;padding:12px 14px;margin-bottom:14px;line-height:1.55}.ac-move b{color:var(--purple);display:block;font-family:var(--f-mono);font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
  .ac-impact{background:var(--teal-light);border:1px solid #A7EDD2;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:800;letter-spacing:-.2px;color:var(--teal-ink);margin-bottom:16px;display:flex;align-items:center;gap:8px}.ac-impact .ph{font-size:16px}
  .ac-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
  .ac-btn{flex:1;text-align:center;font-size:12.5px;font-weight:700;padding:9px 12px;border-radius:8px;background:var(--bg-card);color:var(--n-600);border:1px solid var(--n-200)}
  .ac-btn.pri{background:var(--navy);color:#fff;border-color:transparent}

  /* homework (ad-intel recap) */
  .hw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
  .hw-card{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);padding:26px;box-shadow:var(--shadow)}
  .bg-white .hw-card{background:var(--bg)}
  .hw-plat{font-family:var(--f-body);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--p-text);background:var(--p-50);align-self:flex-start;display:inline-block;padding:4px 10px;border-radius:99px;margin-bottom:14px}
  .hw-stat{font-family:var(--f-body);font-variant-numeric:tabular-nums;font-size:44px;font-weight:800;color:var(--navy);line-height:1;letter-spacing:-2px}
  .hw-label{font-family:var(--f-body);font-size:14px;font-weight:800;letter-spacing:-.2px;color:var(--heading);margin:10px 0 10px}
  .hw-card p{margin:0;font-size:13.5px;color:var(--text-muted);line-height:1.65}
  .hw-footer{margin-top:28px;background:var(--navy);border-radius:var(--radius-lg);padding:22px 26px;font-size:15px;color:#AEB6CC;max-width:none;line-height:1.7}.hw-footer b,.hw-footer strong{color:#8FB6FF}

  /* agent loop */
  .al-goals{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:44px 0 8px}
  .al-goal{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);padding:22px 24px;box-shadow:var(--shadow);position:relative;overflow:hidden}
  .al-goal::before{content:"";position:absolute;top:0;left:0;bottom:0;width:4px;background:var(--p-500)}
  .al-goal-tag{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--n-400);margin-bottom:10px}
  .al-goal-t{font-family:var(--f-body);font-weight:800;font-size:16px;letter-spacing:-.3px;color:var(--navy);line-height:1.38;margin-bottom:10px}
  .al-goal p{margin:0;font-size:13px;color:var(--text-muted);line-height:1.6}
  .al-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:32px;border:1px solid var(--n-200);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-card)}
  .al-step{padding:22px 20px;border-right:1px solid var(--n-200)}.al-step:last-child{border-right:none}
  .al-n{font-family:var(--f-body);font-variant-numeric:tabular-nums;font-size:12px;font-weight:800;color:var(--p-text);background:var(--p-50);width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .al-step h3{font-family:var(--f-body);font-size:15px;font-weight:800;letter-spacing:-.2px;margin:0 0 7px;color:var(--navy)}.al-step p{margin:0;font-size:13px;color:var(--text-muted);line-height:1.55}

  /* recommendations */
  .recs-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px;align-items:start}
  .recs-note{margin-top:24px;font-size:13px;color:var(--n-500);font-style:italic}
  .bg-dark .recs-note{color:var(--d-muted)}

  /* calculator */
  .calc{margin-top:44px;background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);padding:32px;display:grid;grid-template-columns:1fr 1.05fr;gap:32px;align-items:stretch}
  .calc-inputs{display:flex;flex-direction:column;gap:16px}
  .calc-inputs label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--n-400);background:var(--bg);border:1px solid var(--n-200);border-radius:var(--radius);padding:14px 16px}
  .calc-inputs label b{float:right;font-size:16px;color:var(--navy);font-family:var(--f-body);font-weight:800;letter-spacing:-.3px;text-transform:none}
  .calc-inputs input[type=range]{width:100%;margin-top:12px;accent-color:var(--p-500);cursor:pointer}
  .calc-flow{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
  .cf{display:flex;justify-content:space-between;align-items:center;font-size:13.5px;color:var(--text-muted);padding:12px 15px;background:var(--bg);border:1px solid var(--n-200);border-radius:10px}
  .cf b{font-family:var(--f-body);font-variant-numeric:tabular-nums;color:var(--navy);font-weight:800;font-size:16px;letter-spacing:-.3px}
  .cf.big{background:var(--coral-light);border-color:#FACCC4}.cf.big span{color:var(--navy);font-weight:600}.cf.big b{color:var(--coral)}
  .calc-hero{background:var(--navy);color:#fff;border-radius:var(--radius-lg);padding:28px;text-align:center;display:flex;flex-direction:column;justify-content:center;box-shadow:0 20px 50px rgba(21,28,46,.28)}
  .calc-hero-k{font-size:11px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:.08em}
  .calc-hero-v{font-family:var(--f-body);font-variant-numeric:tabular-nums;font-size:52px;font-weight:800;line-height:1.05;letter-spacing:-2px;margin:8px 0 4px;color:#fff}
  .calc-hero-sub{font-size:14px;opacity:.75;font-weight:500}
  .calc-note{text-align:center;margin-top:20px;font-size:12.5px;color:var(--n-500);font-style:italic}

  /* integrations — pill rows with mono LIVE FOR YOU / READY IF YOU ADD IT status */
  .intg-groups{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px;align-items:start}
  .intg-group{background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);padding:24px}
  .bg-white .intg-group{background:var(--bg)}
  .intg-glabel{font-family:var(--f-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--n-500);margin-bottom:16px}
  .intg-pills{display:flex;flex-direction:column;gap:10px}
  .intg-pill{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--n-200);background:var(--bg);border-radius:var(--radius-pill);padding:12px 18px}
  .bg-white .intg-pill{background:var(--bg-card)}
  .intg-name{font-family:var(--f-body);font-size:14.5px;font-weight:700;letter-spacing:-.2px;color:var(--heading)}
  .intg-status{font-family:var(--f-mono);font-size:9.5px;font-weight:500;letter-spacing:.03em;text-transform:uppercase;color:var(--n-500);white-space:nowrap}
  .intg-pill.live{background:var(--p-50);border-color:var(--p-300)}
  .intg-pill.live .intg-name{color:var(--p-text)}.intg-pill.live .intg-status{color:var(--p-text);opacity:.78}

  /* pilot timeline — dark navy band (echoes reference pilot section) */
  .sec.pilot{background:var(--navy)}
  .pilot .section-label{color:#8FB6FF}.pilot .section-heading{color:#fff;letter-spacing:-1px}.pilot .section-sub{color:var(--n-400)}
  .pilot-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:44px;border-top:1px solid rgba(255,255,255,.12)}
  .pilot-step{padding:28px 24px 4px 0;border-right:1px solid rgba(255,255,255,.12)}
  .pilot-step:last-child{border-right:none;padding-right:0}
  .pilot-step:not(:first-child){padding-left:24px}
  .pilot-when{font-family:var(--f-body);font-size:20px;font-weight:800;letter-spacing:-.5px;color:#6E9BF0;text-transform:none;margin-bottom:10px}
  .pilot-step h3{font-family:var(--f-body);font-size:16px;font-weight:800;letter-spacing:-.2px;margin:0 0 10px;color:#fff}.pilot-step p{margin:0;font-size:13px;color:#8892AB;line-height:1.7}

  /* booking — live cal.com embed, brand-themed, in a framed card (the closer) */
  .sec.book .section-label,.sec.book .section-heading,.sec.book .section-sub{text-align:center;margin-left:auto;margin-right:auto}
  .sec.book .section-heading{max-width:none}
  .book-embed{max-width:960px;margin:44px auto 0;background:var(--bg-card);border:1px solid var(--n-200);border-radius:var(--radius-lg);box-shadow:0 24px 60px rgba(21,28,46,.10);padding:10px;overflow:hidden}
  .book-embed #cal-inline{border-radius:calc(var(--radius-lg) - 8px)}
  .bg-dark.book .book-embed{box-shadow:0 24px 70px rgba(0,0,0,.4)}
  @media (max-width:860px){.book-embed{margin-top:28px;padding:6px}.book-embed #cal-inline{min-height:560px}}

  /* scroll reveal */
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  .js .sec>.padding-global>.container-large{opacity:0}
  .js .sec>.padding-global>.container-large.in{animation:fadeUp .65s cubic-bezier(.22,.7,.25,1) both}
  @media (prefers-reduced-motion:reduce){.js .sec>.padding-global>.container-large{opacity:1;animation:none}}

  @media (max-width:860px){.sec{padding:56px 0}.hero .hero-split,.split2,.cols,.stat-row,.cap-grid.cols-3,.cap-grid.cols-2,.mock .g,.hw-grid,.al-goals,.al-steps,.recs-grid,.calc,.pilot-grid,.intg-groups{grid-template-columns:1fr;gap:16px}
    .al-steps,.pilot-grid{border:1px solid var(--n-200)}.al-step,.pilot-step{border-right:none;border-bottom:1px solid var(--n-200);padding:20px}.al-step:last-child,.pilot-step:last-child{border-bottom:none}
    .pilot-step{border-bottom-color:rgba(255,255,255,.12);padding:20px 0}.pilot-step:not(:first-child){padding-left:0}
    .hero h1{font-size:38px}.mock .side{display:none}}
</style>
<script>document.documentElement.className="js"</script>
</head><body>
  <div class="padding-global"><div class="container-large"><header class="nav">${petavueLogo ? `<img class="plogo" src="${petavueLogo}" alt="Petavue">` : `<strong>Petavue</strong>`}<div class="rhs">Prepared for ${logoUri ? `<img src="${logoUri}" alt="${esc(brand.name)}">` : `<strong>${esc(brand.name)}</strong>`}</div></header></div></div>
  <div id="body"></div>
${body}
  <footer><div class="padding-global"><div class="container-large">${petavueLogo ? `<img class="plogo" src="${petavueLogo}" alt="Petavue">` : `<strong>Petavue</strong>`}<div class="fine">See where your pipeline actually comes from — across every channel, in one model.</div></div></div></footer>
<script>(function(){var t=document.querySelectorAll(".sec>.padding-global>.container-large");if(!("IntersectionObserver"in window)){t.forEach(function(e){e.classList.add("in")});return;}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");o.unobserve(e.target);}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});t.forEach(function(e){o.observe(e);});})();</script>
</body></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(await readFile(`data/${args.company}.page.json`, "utf8"));
  const brand: BrandProfile = JSON.parse(await readFile(`data/${args.company}.brand.json`, "utf8"));
  const profile = JSON.parse(await readFile(`data/${args.company}.profile.json`, "utf8"));
  const step0 = JSON.parse(await readFile(`data/${args.company}.step0.json`, "utf8"));

  // Validate BEFORE rendering — a malformed spec errors clearly instead of shipping a page with holes.
  const { errors, warnings } = validateSpec(spec);
  for (const w of warnings) console.warn(`[validate] ⚠ ${w}`);
  if (errors.length) {
    console.error(`[validate] ✗ ${errors.length} error(s) — refusing to render:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`[validate] ✓ ${spec.sections.length} sections OK`);

  const T = deriveBrand(brand, spec.brandColor), F = fontSetup(brand), viz = buildViz(profile, step0);
  const C: Ctx = { T, viz, brand };
  // hideTargetLogo: verified escape hatch when Brandfetch's logo asset is broken/wrong
  // (e.g. Alaan's download was a malformed grey stripe) — fall back to the styled text name.
  const logoUri = spec.hideTargetLogo ? null : await targetLogo(brand.logo.localPath);
  const petavueLogo = await dataUri("assets/petavue-logo.svg");
  const favicon = await dataUri("assets/favicon.svg"), touchIcon = await dataUri("assets/apple-touch-icon.png");
  await trustLogos();

  const body = (spec.sections as Section[]).map((s) => (RENDERERS[s.type] ?? (() => `<!-- unknown section: ${esc(s.type)} -->`))(s, C)).join("\n");
  const html = shell(spec, brand, T, F, body, logoUri, petavueLogo, favicon, touchIcon);
  const out = args.out ?? `output/${args.company}.html`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html, "utf8");
  const types = (spec.sections as Section[]).map((s) => s.type).join(" → ");
  console.log(`[done] wrote ${out} — brand ${T.p500} · ${spec.sections.length} sections: ${types}`);

  if (args.shot) {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto("file://" + resolve(out), { waitUntil: "networkidle", timeout: 30000 });
    // Force the scroll-reveal open for every section so the full-page capture shows
    // fully-revealed content (the IntersectionObserver only fires for what scrolls into view).
    await page.evaluate(() => document.querySelectorAll(".sec>.padding-global>.container-large").forEach((e) => e.classList.add("in")));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `data/${args.company}.preview.png`, fullPage: true });
    await browser.close();
    console.log(`[shot] wrote data/${args.company}.preview.png`);
  }
}
main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
