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
 * Design system = Petavue's STRUCTURE (layout, spacing, components, Phosphor
 * icons, neutral greys). COLOR + FONT = the SELECTED BRAND's (never Petavue's),
 * derived from Brandfetch. Real ad data (count/format/reach) fills proof blocks.
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

// ---------- fonts (brand's, never Petavue's) ----------
const GOOGLE_FONTS = new Set(["DM Sans", "Inter", "Roboto", "Roboto Condensed", "Open Sans", "Lato", "Montserrat", "Poppins", "Work Sans", "Nunito", "Manrope", "Sora", "Space Grotesk", "Figtree", "Plus Jakarta Sans", "Outfit", "Epilogue", "IBM Plex Sans", "Rubik", "Mulish", "Karla", "Public Sans", "Libre Franklin", "Archivo", "Hanken Grotesk", "Onest", "Oswald", "Anton", "Barlow Condensed", "Tajawal", "Cairo", "IBM Plex Sans Arabic"]);
const cleanFont = (f: string | null): string | null => f && !/var\(|--|[,;]/.test(f) && f.trim().length > 0 && f.length < 40 ? f.trim() : null;
function fontSetup(brand: BrandProfile) {
  const title = cleanFont(brand.fonts.title), body = cleanFont(brand.fonts.body);
  const loadTitle = !!(title && GOOGLE_FONTS.has(title)), loadBody = !!(body && GOOGLE_FONTS.has(body));
  const fams: string[] = []; if (loadTitle) fams.push(title!); if (loadBody && body !== title) fams.push(body!);
  const head = fams.length ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap" rel="stylesheet">` : "";
  return { head, headingStack: `${title ? `'${title}', ` : ""}${body ? `'${body}', ` : ""}system-ui, sans-serif`, bodyStack: `${body ? `'${body}', ` : ""}${title ? `'${title}', ` : ""}system-ui, sans-serif`, title, loadTitle };
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
  const bgc = bg === "white" ? "bg-white" : bg === "tint" ? "bg-tint" : "bg-plain";
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
      <h1>${esc(s.headline)}</h1>
      <p class="subtitle">${esc(s.subhead)}</p>
      <div class="hero-ctas"><a class="btn-primary" href="#cta">${esc(s.ctaLabel || "Book a walkthrough")}</a>${s.secondaryLabel ? `<a class="btn-secondary" href="#body">${esc(s.secondaryLabel)} ${icon("arrow-right")}</a>` : ""}</div>
      ${chips ? `<div class="hero-chips">${chips}</div>` : ""}
    </div>${right}</div>`;
  return wrap(s.bg, "hero", inner);
}
function secInsight(s: Section, C: Ctx): string {
  return wrap(s.bg ?? "tint", "insight", `<div class="section-label">${icon(s.icon || "chart-bar")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2><p class="section-sub big">${esc(s.body)}</p>${s.showData ? statTiles(C) : ""}`);
}
function secList(s: Section, kind: "problem" | "opportunity"): string {
  const def = kind === "problem" ? "warning-circle" : "check-circle";
  const items = (s.points || []).map((p: any) => `<div class="li-row">${icon(p.icon || def)}<div>${p.title ? `<b>${esc(p.title)}</b><br>` : ""}${esc(p.text)}</div></div>`).join("");
  return wrap(s.bg, kind, `<div class="split2"><div><div class="section-label">${icon(s.icon || (kind === "problem" ? "warning" : "lightning"))} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2></div><div><p class="body">${esc(s.body)}</p>${items ? `<div class="li-list">${items}</div>` : ""}</div></div>`);
}
function secSplit(s: Section): string {
  return wrap(s.bg, "feat", `<div class="split2"><div><div class="section-label">${icon(s.icon || "target")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2></div><div><p class="body">${esc(s.body)}</p>${s.proofline ? `<p class="proofline">${icon("check-circle")} ${esc(s.proofline)}</p>` : ""}</div></div>`);
}
function secStatement(s: Section): string {
  return wrap(s.bg ?? "tint", "state", `<div class="statement">${s.eyebrow ? `<div class="section-label center">${icon(s.icon || "quotes")} ${esc(s.eyebrow)}</div>` : ""}<h2>${esc(s.heading)}</h2>${s.body ? `<p class="body">${esc(s.body)}</p>` : ""}</div>`);
}
function secComparison(s: Section): string {
  const pills = (s.us.points || []).map((p: string) => `<li>${icon("check")} ${esc(p)}</li>`).join("");
  return wrap(s.bg, "comp", `<div class="section-label">${icon(s.icon || "scales")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2><div class="cols"><div class="col them"><div class="tag">${esc(s.them.tag)}</div><p class="body">${esc(s.them.body)}</p></div><div class="col us"><div class="tag">${esc(s.us.tag)}</div><p class="body">${esc(s.us.body)}</p>${pills ? `<ul class="pills">${pills}</ul>` : ""}</div></div>`);
}
function secCapabilities(s: Section): string {
  const n = (s.items || []).length;
  const cards = (s.items || []).map((it: any) => `<div class="cap"><div class="cap-ic">${icon(it.icon || "circle")}</div><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></div>`).join("");
  return wrap(s.bg, "caps", `<div class="section-label center">${icon(s.icon || "stack")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${esc(s.heading)}</h2>${s.sub ? `<p class="section-sub center">${esc(s.sub)}</p>` : ""}<div class="cap-grid cols-${n % 3 === 0 ? 3 : 2}">${cards}</div>`);
}
function secProduct(s: Section): string {
  const feats = (s.features || [{ icon: "chart-line-up", text: "Which channel, campaign, and creative produced pipeline" }, { icon: "magnifying-glass", text: "Why a metric moved — root cause, not just a dashboard" }, { icon: "trend-up", text: "Unit economics & pipeline forecasting, across channels" }]).map((f: any) => `<div class="frow">${icon(f.icon || "circle")}<span>${esc(f.text)}</span></div>`).join("");
  const inner = `<div class="section-label center">${icon(s.icon || "chart-line-up")} ${esc(s.eyebrow || "The product")}</div><h2 class="section-heading center">${esc(s.heading || "See where your pipeline actually comes from")}</h2>${s.sub ? `<p class="section-sub center">${esc(s.sub)}</p>` : ""}
    <div class="mock"><div class="tb"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span class="u">app.petavue.com</span></div>
      <div class="g"><div class="side"><div class="b">Petavue</div><a class="on">${icon("chart-line-up")} Attribution</a><a>${icon("magnifying-glass")} Diagnostics</a><a>${icon("trend-up")} Pipeline forecast</a><a>${icon("coins")} Unit economics</a><a>${icon("crosshair")} Account scoring</a></div>
      <div class="main"><div class="mh">${esc(s.panelTitle || "Cross-channel attribution")}</div><p class="mdesc">${esc(s.panelDesc || "Every channel's spend connected to closed revenue — LinkedIn, Google, Meta, events, organic — in one model.")}</p><div class="frows">${feats}</div></div></div></div>`;
  return wrap(s.bg ?? "tint", "prod", inner, "product");
}
function secCta(s: Section): string {
  return wrap(s.bg, "cta", `<div class="ctablock"><h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p><a class="btn-primary" href="#">${esc(s.ctaLabel || "Book a teardown")} ${icon("arrow-right")}</a></div>`, "cta");
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
  return wrap(s.bg ?? "white", "hw", `<div class="section-label">${icon(s.icon || "binoculars")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="hw-grid">${cards}</div>${s.footer ? `<p class="hw-footer">${esc(s.footer)}</p>` : ""}`);
}
// "Point the agents at a goal" — example goals + the monitor→act loop.
function secAgentLoop(s: Section): string {
  const goals = (s.goals || []).map((g: any) => `<div class="al-goal"><div class="al-goal-tag">Example goal</div><div class="al-goal-t">${esc(g.text)}</div><p>${esc(g.result)}</p></div>`).join("");
  const steps = (s.steps || []).map((st: any, i: number) => `<div class="al-step"><div class="al-n">${String(i + 1).padStart(2, "0")}</div><h3>${esc(st.title)}</h3><p>${esc(st.body)}</p></div>`).join("");
  return wrap(s.bg ?? "tint", "al", `<div class="section-label">${icon(s.icon || "target")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}${goals ? `<div class="al-goals">${goals}</div>` : ""}<div class="al-steps">${steps}</div>`);
}
// "Two engines, running daily" — live agent recommendation mocks.
function secRecommendations(s: Section): string {
  const cards = (s.cards || []).map((c: any) => agentCard(c)).join("");
  return wrap(s.bg ?? "plain", "recs", `<div class="section-label">${icon(s.icon || "lightning")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="recs-grid">${cards}</div>${s.note ? `<p class="recs-note">${esc(s.note)}</p>` : ""}`);
}
// Interactive missed-pipeline calculator.
function secCalculator(s: Section): string {
  const icp0 = s.icp ?? 50, fit0 = s.fit ?? 60, conv0 = s.conv ?? 3, acv0 = s.acv ?? 50000;
  const inner = `<div class="section-label center">${icon(s.icon || "calculator")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}
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
  return wrap(s.bg ?? "plain", "caps", `<div class="section-label center">${icon(s.icon || "shield-check")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}<div class="cap-grid cols-3">${cards}</div>`);
}
// "Connects to your stack" — integration chips with LIVE/READY badges.
function secIntegrations(s: Section): string {
  const groups = (s.groups || []).map((gr: any) => `<div class="intg-group"><div class="intg-glabel">${esc(gr.label)}</div><div class="intg-chips">${(gr.items || []).map((it: any) => `<span class="intg-chip${it.status === "live" ? " live" : it.status === "ready" ? " ready" : ""}">${esc(it.name)}${it.status === "live" ? "<em>LIVE</em>" : it.status === "ready" ? "<em>READY</em>" : ""}</span>`).join("")}</div></div>`).join("");
  return wrap(s.bg ?? "white", "intg", `<div class="section-label">${icon(s.icon || "plugs-connected")} ${esc(s.eyebrow)}</div><h2 class="section-heading">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub big">${esc(s.body)}</p>` : ""}<div class="intg-groups">${groups}</div>`);
}
// The pilot — week-by-week timeline.
function secPilot(s: Section): string {
  const steps = (s.steps || []).map((st: any) => `<div class="pilot-step"><div class="pilot-when">${esc(st.when)}</div><h3>${esc(st.title)}</h3><p>${esc(st.body)}</p></div>`).join("");
  return wrap(s.bg ?? "tint", "pilot", `<div class="section-label center">${icon(s.icon || "rocket-launch")} ${esc(s.eyebrow)}</div><h2 class="section-heading center">${esc(s.heading)}</h2>${s.body ? `<p class="section-sub center">${esc(s.body)}</p>` : ""}<div class="pilot-grid">${steps}</div>`);
}

const RENDERERS: Record<string, (s: Section, C: Ctx) => string> = {
  hero: secHero, insight: secInsight, problem: (s) => secList(s, "problem"), opportunity: (s) => secList(s, "opportunity"),
  splitFeature: (s) => secSplit(s), statement: (s) => secStatement(s), comparison: (s) => secComparison(s),
  capabilities: (s) => secCapabilities(s), productPreview: (s) => secProduct(s), cta: (s) => secCta(s),
  homework: (s) => secHomework(s), agentLoop: (s) => secAgentLoop(s), recommendations: (s) => secRecommendations(s),
  calculator: (s) => secCalculator(s), defensibility: (s) => secDefensibility(s), integrations: (s) => secIntegrations(s),
  pilot: (s) => secPilot(s),
};

// ---------- page-spec validation (fail loud; never silently drop a section) ----------
// Minimal required fields per section type — enough to catch typos and empty sections
// before they render as an invisible HTML comment.
const REQUIRED_FIELDS: Record<string, string[]> = {
  hero: ["headline"], homework: ["channels"], insight: ["heading"], problem: ["heading"],
  opportunity: ["heading"], splitFeature: ["heading"], statement: ["heading"], capabilities: ["items"],
  agentLoop: ["steps"], recommendations: ["cards"], comparison: ["them", "us"], calculator: ["heading"],
  defensibility: ["points"], integrations: ["groups"], productPreview: [], pilot: ["steps"], cta: ["heading"],
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
  });
  const types = secs.map((s: any) => s?.type);
  if (!types.includes("hero")) errors.push('no "hero" section');
  else if (types[0] !== "hero") warnings.push('"hero" is not the first section');
  if (!types.includes("cta")) warnings.push('no "cta" section');
  else if (types[types.length - 1] !== "cta") warnings.push('"cta" is not the last section');
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
    --n-50:#F8F9FC;--n-100:#EEF0F7;--n-200:#D4D9EA;--n-300:#ADB2CE;--n-400:#8E93AF;--n-500:#757A97;--n-600:#52577A;--n-700:#3A3E57;--n-800:#2D3044;--n-900:#232532;
    --text:#232532;--text-muted:#52577A;--heading:#2D3044;--f-heading:${F.headingStack};--f-body:${F.bodyStack};
    --shadow:0 1px 2px rgba(35,37,50,.04),0 12px 32px rgba(35,37,50,.06);--shadow-lg:0 2px 6px rgba(35,37,50,.05),0 30px 70px rgba(35,37,50,.10);}
  *{box-sizing:border-box}
  body{margin:0;background:var(--n-50);color:var(--text);font-family:var(--f-body);line-height:1.7;-webkit-font-smoothing:antialiased}
  .padding-global{padding:0 5%}.container-large{max-width:80rem;margin:0 auto;padding:0 20px}
  .sec{padding:96px 0}.bg-plain{background:var(--n-50)}.bg-white{background:#fff}.bg-tint{background:var(--p-50)}
  .sec+.sec.bg-plain{border-top:1px solid var(--n-100)}
  h1,h2,h3{font-family:var(--f-heading);font-weight:500;color:var(--heading);margin:0}
  .ph{vertical-align:middle;line-height:1}
  .section-label{font-family:var(--f-heading);font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--p-text);display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .section-label.center{justify-content:center}.section-label .ph{font-size:17px}
  .section-heading{font-family:var(--f-heading);font-size:42px;font-weight:500;line-height:1.16;letter-spacing:-1px;color:var(--heading);max-width:900px;margin:0}
  .section-heading.center{text-align:center;margin:0 auto}
  .section-sub{font-family:var(--f-body);font-size:16px;color:var(--text-muted);line-height:1.7;max-width:620px}
  .section-sub.big{font-size:18px;max-width:660px;margin-top:16px}.section-sub.center{text-align:center;margin-left:auto;margin-right:auto}
  .body{color:var(--text);font-size:16.5px}
  .btn-primary,.btn-secondary{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-body);font-size:16px;font-weight:500;padding:.7rem 1.6rem;border-radius:60px;text-decoration:none;transition:.15s}
  .btn-primary{background:var(--p-500);color:var(--on-p);border:1px solid rgba(255,255,255,.1)}.btn-primary:hover{background:var(--p-800);gap:12px}
  .btn-secondary{background:#fff;color:var(--n-600);border:1px solid var(--n-200)}.btn-secondary:hover{background:var(--n-50);gap:12px}

  .nav{padding:22px 0;display:flex;align-items:center;justify-content:space-between}
  .nav .plogo{height:26px}.nav .rhs{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--n-500)}.nav .rhs img{height:24px}

  /* hero */
  .hero .hero-split{display:grid;grid-template-columns:1.5fr 1fr;gap:56px;align-items:center}
  .hero .hero-solo{max-width:820px}
  .hero h1{font-size:52px;line-height:1.08;letter-spacing:-1.6px;margin:0 0 22px}
  .hero .subtitle{font-size:17px;color:var(--text-muted);max-width:46ch;margin:0 0 30px}
  .hero-ctas{display:flex;gap:14px;flex-wrap:wrap}
  .proof{background:#fff;border:1px solid var(--n-200);border-radius:16px;box-shadow:var(--shadow);padding:26px}
  .proof .lab{font-size:12.5px;color:var(--n-500);font-weight:500;margin-bottom:12px}
  .proof .n{font-family:var(--f-heading);font-variant-numeric:tabular-nums;font-size:48px;font-weight:600;color:var(--p-text);line-height:1;letter-spacing:-1px}
  .proof .nsub{font-size:13.5px;color:var(--n-500);margin:8px 0 18px}
  .proof .mini{display:flex;gap:2px;height:10px;border-radius:5px;overflow:hidden;background:var(--n-100)}.proof .ms{min-width:3px}
  .proof .fx{margin-top:11px;font-size:13px;color:var(--text)}

  /* insight stat row */
  .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}
  .stat{background:#fff;border:1px solid var(--n-200);border-radius:14px;padding:22px}
  .stat .sk{font-size:12.5px;color:var(--n-500);margin-bottom:8px}
  .stat .sv{font-family:var(--f-heading);font-weight:600;font-size:24px;color:var(--p-text);line-height:1.2}

  /* split (feat/problem/opportunity) */
  .split2{display:grid;grid-template-columns:1fr 1.15fr;gap:52px;align-items:start}
  .li-list{margin-top:22px;display:flex;flex-direction:column;gap:14px}
  .li-row{display:flex;gap:13px;align-items:flex-start;font-size:15.5px;color:var(--text)}
  .li-row .ph{color:var(--p-text);font-size:21px;flex:none;margin-top:1px}.li-row b{color:var(--heading)}
  .proofline{margin-top:18px;color:var(--p-text);font-weight:500;font-size:15px;display:flex;gap:9px;align-items:flex-start}.proofline .ph{font-size:19px;flex:none}

  /* statement */
  .state .statement{text-align:center;max-width:820px;margin:0 auto}
  .state h2{font-size:40px;line-height:1.15;letter-spacing:-1px;margin:0 auto;max-width:20ch}
  .state .body{margin:22px auto 0;color:var(--text-muted);font-size:18px;max-width:56ch}

  /* comparison */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch;margin-top:14px}
  .col{border-radius:16px;padding:30px;display:flex;flex-direction:column;box-shadow:var(--shadow)}
  .col.them{background:#fff;border:1px solid var(--n-200)}.col.us{background:var(--p-500);color:var(--on-p)}
  .col .tag{font-family:var(--f-heading);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;opacity:.85;margin-bottom:16px}
  .col.them .body{color:var(--text-muted);font-size:15.5px}.col.us .body{color:var(--on-p);font-size:16.5px;margin:0 0 20px}
  .pills{list-style:none;margin:auto 0 0;padding:20px 0 0;border-top:1px solid color-mix(in srgb,var(--on-p) 22%,transparent);display:flex;flex-direction:column;gap:13px}
  .pills li{display:flex;gap:11px;align-items:flex-start;font-size:15px}.pills li .ph{font-size:19px;flex:none;margin-top:1px}

  /* capabilities grid */
  .cap-grid{display:grid;gap:20px;margin-top:40px}.cap-grid.cols-3{grid-template-columns:repeat(3,1fr)}.cap-grid.cols-2{grid-template-columns:repeat(2,1fr)}
  .cap{background:#fff;border:1px solid var(--n-200);border-radius:16px;padding:26px;box-shadow:var(--shadow)}
  .cap-ic{width:44px;height:44px;border-radius:11px;background:var(--p-50);color:var(--p-text);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px}
  .cap h3{font-size:18px;font-weight:600;margin:0 0 8px;color:var(--heading)}.cap p{margin:0;font-size:14.5px;color:var(--text-muted);line-height:1.6}

  /* product mockup */
  .prod .mock{max-width:940px;margin:40px auto 0;border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lg);border:1px solid var(--n-200);text-align:left;background:#fff}
  .mock .tb{display:flex;align-items:center;gap:8px;padding:13px 16px;background:var(--n-50);border-bottom:1px solid var(--n-100)}
  .mock .tb i.dot{width:11px;height:11px;border-radius:50%;background:var(--n-200);display:inline-block}.mock .tb .u{margin-left:14px;font-family:var(--f-heading);font-size:12.5px;color:var(--n-400)}
  .mock .g{display:grid;grid-template-columns:200px 1fr}
  .mock .side{background:var(--n-50);padding:20px 14px;border-right:1px solid var(--n-100)}.mock .side .b{font-family:var(--f-heading);font-weight:600;font-size:16px;margin:0 8px 18px;color:var(--heading)}
  .mock .side a{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;color:var(--n-500);font-size:13.5px;margin-bottom:3px;text-decoration:none}.mock .side a .ph{font-size:17px}.mock .side a.on{background:var(--p-100);color:var(--p-800);font-weight:500}
  .mock .main{padding:24px}.mock .main .mh{font-family:var(--f-heading);font-weight:500;font-size:19px;margin:0 0 10px;color:var(--heading)}
  .mdesc{color:var(--text-muted);font-size:14.5px;margin:0 0 18px;max-width:52ch}
  .frows{display:flex;flex-direction:column;gap:11px}.frow{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text);background:var(--n-50);border-radius:10px;padding:13px 15px}.frow .ph{color:var(--p-text);font-size:18px;flex:none}

  /* cta */
  .cta{padding:100px 0}.cta .ctablock{text-align:center;max-width:700px;margin:0 auto}
  .cta h2{font-size:40px;letter-spacing:-1px;margin:0 auto 16px;max-width:20ch}.cta p{color:var(--text-muted);font-size:17px;margin:0 auto 28px;max-width:44ch}

  footer{background:#fff;border-top:1px solid var(--n-100);padding:36px 0}
  footer .container-large{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  footer .plogo{height:22px}footer .fine{font-size:12.5px;color:var(--n-500)}

  /* hero trust chips */
  .hero-chips{display:flex;gap:20px;flex-wrap:wrap;margin-top:26px}
  .hero-chip{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;color:var(--text-muted)}.hero-chip .ph{color:var(--p-text);font-size:16px}

  /* agent recommendation card */
  .acard{background:#fff;border:1px solid var(--n-200);border-radius:16px;box-shadow:var(--shadow-lg);padding:22px;text-align:left}
  .ac-top{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--n-500);margin-bottom:14px}
  .ac-dot{width:22px;height:22px;border-radius:6px;background:var(--p-500);color:var(--on-p);display:inline-flex;align-items:center;justify-content:center;font-size:13px}
  .ac-app{font-weight:600;color:var(--heading)}.ac-time{margin-left:auto}
  .ac-tag{font-family:var(--f-heading);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--p-text);margin-bottom:8px}
  .ac-title{font-family:var(--f-heading);font-weight:600;font-size:16px;color:var(--heading);line-height:1.35;margin-bottom:10px}
  .ac-body{font-size:13.5px;color:var(--text-muted);margin:0 0 16px;line-height:1.6}
  .ac-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  .acm{background:var(--n-50);border-radius:10px;padding:12px 8px;text-align:center}
  .acm-v{font-family:var(--f-heading);font-variant-numeric:tabular-nums;font-weight:600;font-size:19px;color:var(--p-text);line-height:1}
  .acm-k{font-size:9.5px;color:var(--n-500);text-transform:uppercase;letter-spacing:.03em;margin-top:6px;line-height:1.2}
  .ac-move{font-size:13.5px;color:var(--text);background:var(--p-50);border-radius:10px;padding:12px 14px;margin-bottom:12px;line-height:1.55}.ac-move b{color:var(--p-text);display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
  .ac-impact{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:500;color:var(--p-text);margin-bottom:16px}.ac-impact .ph{font-size:17px}
  .ac-actions{display:flex;gap:10px;flex-wrap:wrap}
  .ac-btn{font-size:13px;font-weight:500;padding:.5rem 1rem;border-radius:60px;background:#fff;color:var(--n-600);border:1px solid var(--n-200)}
  .ac-btn.pri{background:var(--p-500);color:var(--on-p);border-color:transparent}

  /* homework (ad-intel recap) */
  .hw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}
  .hw-card{background:#fff;border:1px solid var(--n-200);border-radius:16px;padding:26px;box-shadow:var(--shadow)}
  .hw-plat{font-family:var(--f-heading);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--n-500);margin-bottom:14px}
  .hw-stat{font-family:var(--f-heading);font-variant-numeric:tabular-nums;font-size:40px;font-weight:600;color:var(--p-text);line-height:1;letter-spacing:-1px}
  .hw-label{font-size:14px;font-weight:600;color:var(--heading);margin:8px 0 12px}
  .hw-card p{margin:0;font-size:14px;color:var(--text-muted);line-height:1.6}
  .hw-footer{margin-top:30px;font-size:16.5px;color:var(--text);max-width:900px;line-height:1.7}

  /* agent loop */
  .al-goals{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:36px 0 8px}
  .al-goal{background:#fff;border:1px solid var(--n-200);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
  .al-goal-tag{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--p-text);margin-bottom:10px}
  .al-goal-t{font-family:var(--f-heading);font-weight:500;font-size:16.5px;color:var(--heading);line-height:1.4;margin-bottom:10px}
  .al-goal p{margin:0;font-size:14px;color:var(--text-muted);line-height:1.6}
  .al-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:34px}
  .al-n{font-family:var(--f-heading);font-variant-numeric:tabular-nums;font-size:13px;font-weight:700;color:var(--on-p);background:var(--p-500);width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .al-step h3{font-size:16px;font-weight:600;margin:0 0 7px;color:var(--heading)}.al-step p{margin:0;font-size:13.5px;color:var(--text-muted);line-height:1.55}

  /* recommendations */
  .recs-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:40px;align-items:start}
  .recs-note{margin-top:24px;font-size:13.5px;color:var(--n-500);font-style:italic}

  /* calculator */
  .calc{display:grid;grid-template-columns:1fr 1.1fr;gap:32px;margin-top:40px;align-items:center;background:#fff;border:1px solid var(--n-200);border-radius:18px;box-shadow:var(--shadow-lg);padding:32px}
  .calc-inputs{display:flex;flex-direction:column;gap:22px}
  .calc-inputs label{display:block;font-size:14px;color:var(--text);font-weight:500}
  .calc-inputs label b{float:right;color:var(--p-text);font-family:var(--f-heading);font-variant-numeric:tabular-nums}
  .calc-inputs input[type=range]{width:100%;margin-top:12px;accent-color:var(--p-500)}
  .calc-flow{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
  .cf{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:var(--text-muted);padding:11px 14px;background:var(--n-50);border-radius:10px}
  .cf b{font-family:var(--f-heading);font-variant-numeric:tabular-nums;color:var(--heading);font-size:16px}
  .cf.big{background:var(--p-50)}.cf.big b{color:var(--p-text)}
  .calc-hero{background:var(--p-500);color:var(--on-p);border-radius:14px;padding:24px;text-align:center}
  .calc-hero-k{font-size:12.5px;opacity:.85;text-transform:uppercase;letter-spacing:.05em}
  .calc-hero-v{font-family:var(--f-heading);font-variant-numeric:tabular-nums;font-size:44px;font-weight:600;line-height:1.1;margin:6px 0 2px}
  .calc-hero-sub{font-size:14px;opacity:.9}
  .calc-note{text-align:center;margin-top:20px;font-size:13.5px;color:var(--n-500);font-style:italic}

  /* integrations */
  .intg-groups{display:flex;flex-direction:column;gap:22px;margin-top:36px}
  .intg-glabel{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--n-500);margin-bottom:12px}
  .intg-chips{display:flex;flex-wrap:wrap;gap:10px}
  .intg-chip{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--text);background:#fff;border:1px solid var(--n-200);border-radius:10px;padding:10px 14px}
  .intg-chip em{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 6px;border-radius:5px}
  .intg-chip.live em{background:var(--p-50);color:var(--p-text)}.intg-chip.ready em{background:var(--n-100);color:var(--n-500)}

  /* pilot timeline */
  .pilot-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:40px}
  .pilot-step{background:#fff;border:1px solid var(--n-200);border-radius:14px;padding:24px;box-shadow:var(--shadow)}
  .pilot-when{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--p-text);margin-bottom:12px}
  .pilot-step h3{font-size:16.5px;font-weight:600;margin:0 0 8px;color:var(--heading)}.pilot-step p{margin:0;font-size:13.5px;color:var(--text-muted);line-height:1.6}

  @media (max-width:768px){.sec{padding:60px 0}.hero .hero-split,.split2,.cols,.stat-row,.cap-grid.cols-3,.cap-grid.cols-2,.mock .g,.hw-grid,.al-goals,.al-steps,.recs-grid,.calc,.pilot-grid{grid-template-columns:1fr;gap:24px}
    .hero h1{font-size:34px}.section-heading,.state h2,.cta h2{font-size:28px}.mock .side{display:none}}
</style>
</head><body>
  <div class="padding-global"><div class="container-large"><header class="nav">${petavueLogo ? `<img class="plogo" src="${petavueLogo}" alt="Petavue">` : `<strong>Petavue</strong>`}<div class="rhs">Prepared for ${logoUri ? `<img src="${logoUri}" alt="${esc(brand.name)}">` : `<strong>${esc(brand.name)}</strong>`}</div></header></div></div>
  <div id="body"></div>
${body}
  <footer><div class="padding-global"><div class="container-large">${petavueLogo ? `<img class="plogo" src="${petavueLogo}" alt="Petavue">` : `<strong>Petavue</strong>`}<div class="fine">See where your pipeline actually comes from — across every channel, in one model.</div></div></div></footer>
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
    await page.screenshot({ path: `data/${args.company}.preview.png`, fullPage: true });
    await browser.close();
    console.log(`[shot] wrote data/${args.company}.preview.png`);
  }
}
main().catch((err) => { console.error("[fatal]", err); process.exit(1); });
