# Petavue demand-gen (Claude Code demo)

A demo of **scalable demand gen orchestrated inside Claude Code**. Given a company (or investor / LinkedIn profile), Claude qualifies it on real ad strategy + ICP fit and **composes a uniquely-structured** landing page (Petavue → target) as a standalone HTML file in `output/`.

**Claude is the orchestrator.** Scripts do structured extraction; Claude does the judgment: sourcing, brand verification, ICP fit, qualification, **narrative/structure design**, copywriting, and visual QA. There is **no Anthropic API, no deployment** — pages are authored in-agent, output is local HTML. Petavue positioning source of truth: **`context.private.md`** (full manual + competitor battlecard, gitignored; the public repo ships the vendor-neutral **`context.md`** primer).

**Ad data comes from SearchApi.io** (structured JSON for LinkedIn + Meta + Google ad libraries) — this replaced the Playwright scrapers as the primary path (validated against hand-built ad reports for plain.com + neysa.ai: counts, entities, and copy matched). The Playwright scrapers (`scrape:linkedin`, `scrape:meta`) are kept as a **fallback** — chiefly for LinkedIn *collision names* (see rules). One gap: Google archives many search ads as **rendered images**, so the API can't read their copy — Claude reads it visually from the Ads Transparency Center via Chrome and folds it in with `merge:vision` (the "hybrid Google copy" step). `SEARCHAPI_KEY` lives in `.env`.

## Run it

`/demand-gen <company | investor | LinkedIn profile URL>` — the full workflow. See `.claude/commands/demand-gen.md`.

## Scripts (structured tasks only)

| Script | Does | Output |
|---|---|---|
| `npm run fetch:brand -- --company <slug> --domain <d>` | Brandfetch: logo, colors, fonts, firmographics | `data/<slug>.brand.json` |
| `npm run fetch:linkedin -- --company <slug> --advertiser "<Name[,Founder]>" [--resolve]` | LinkedIn Ad Library via SearchApi; `--resolve` lists advertisers to confirm identity, then filters to the exact name(s) | `data/<slug>.ads.json` |
| `npm run fetch:meta -- --company <slug> [--query "<Name>" --resolve \| --page-id <id>]` | Meta Ad Library via SearchApi; resolve to a `page_id`, then scrape | `data/<slug>.meta.ads.json` |
| `npm run fetch:google -- --company <slug> --domain <d>` | Google Ads Transparency via SearchApi; resolves `domain`→`advertiser_id` (fuller set) + per-creative details (regions, copy where text-based) | `data/<slug>.google.ads.json` |
| `npm run merge:vision -- --company <slug> --file data/<slug>.google.vision.json` | Folds Chrome-vision-read Google copy into image-archived creatives | updates `data/<slug>.google.ads.json` |
| `npm run score -- --company <slug>` | Tier/qualification, **aggregated across all platform files** | `data/<slug>.profile.json` |
| `npm run render -- --company <slug> [--shot]` | Composes the page spec into HTML | `output/<slug>.html` |

**Fallback (Playwright, pre-SearchApi):** `npm run scrape:linkedin -- --url "…?companyIds=<ID>" --headless` and `npm run scrape:meta -- --page-id <id> --headless`. Use `scrape:linkedin` when a LinkedIn name is a common word (SearchApi has no company-ID filter, so a name search paginates all namesakes — the native `companyIds=` URL is cleaner). See `src/searchapi-probe.ts` to dump raw payloads for comparison.

**`render.ts` is a section composer, not a template.** It reads the **page spec** Claude authors — `data/<slug>.page.json`, an ordered list of typed sections — so structure/narrative vary per company. The **refined, agent-led library** (modeled on the live `go.petavue.com/l` pages; worked example: `data/neysa.page.json`): `hero(+agent-card+chips) · homework · statement(the subtle mirror) · capabilities · agentLoop · recommendations · comparison · calculator · defensibility · integrations · pilot · cta` (legacy `insight · problem · opportunity · splitFeature · productPreview` still render). Default arc + tone rules live in `.claude/commands/demand-gen.md` Step 4. **Design system = the fixed Petavue design language** (modeled on the live `go.petavue.com/l` pages): Instrument Serif display headings + Manrope body/UI, a navy base (`#151C2E`), generous radii, `fadeUp` scroll motion, dark statement/comparison/pilot bands, Phosphor icons. The **target brand color drives the accent only** (buttons, eyebrows, agent-card/calculator highlights) via `deriveBrand()` from the verified `brandColor` — the **typeface is always Petavue's (Instrument Serif + Manrope), never the brand's font**.

## Hard-won rules (encoded in the command)

- **Identity resolution is the #1 trap.** Names collide (two real "Primer" companies; searching "Plain" surfaces ~50 advertisers — PlainID, Plains State Bank, White Plains Hospital…). Resolve per engine, never trust a raw name: **Google** → `domain` auto-resolves to the verified legal entity, then use its `advertiser_id` (fuller than the domain query — Neysa returned 21 by advertiser vs 13 by domain); **Meta** → confirm the `page_id` (`--resolve`), never keyword; **LinkedIn** → SearchApi has no ID filter, so `--resolve` to see the advertiser breakdown, then pass the exact name(s) to `--advertiser` (founder Thought-Leader-Ad names are legitimately the company's). For common-word LinkedIn names, prefer the Playwright fallback with `companyIds=<ID>`.
- **Trust nothing Brandfetch labels.** It has mislabeled color *roles*, color *ordering*, and logo *themes*. **Verify the brand color from the company's real site** (screenshot the homepage) and set it as `brandColor` in the page spec; look at the logo to confirm it's visible.
- **Compose the arc from the business** — don't default to hero→metrics→features→cta. A measurement vendor gets an opportunity-led arc, a workflow company a process-bottleneck problem arc, etc.
- **Lead with the target's real ad themes**, read from their ad copy — the scoring keyword-buckets misfire across domains.
- **If it's not confirmed, don't include it** — no fabricated trust logos (real logos only, in `assets/trust/`), no invented product metrics.

## Layout

- `src/` — SearchApi fetchers (`searchapi` client, `fetch-linkedin`, `fetch-meta`, `fetch-google`, `merge-vision-copy`) · `fetch-brand` · `score` · `render` · `types.ts` · Playwright fallbacks (`scrape-linkedin`, `scrape-meta`) · `searchapi-probe` (raw-payload dumper)
- `data/` — intermediate artifacts (ads, brand, profile, step0, **page specs**, previews)
- `output/` — final landing pages
- `assets/` — Petavue's own brand (logos, favicon); `assets/trust/` — real customer logos (empty until confirmed)
- `context.private.md` — full GTM manual + Petavue positioning/battlecard (gitignored). `context.md` — vendor-neutral public primer (competitor teardown & battlecard removed)
- `.env` — `BRANDFETCH_API_KEY`, `SEARCHAPI_KEY` (gitignored)
