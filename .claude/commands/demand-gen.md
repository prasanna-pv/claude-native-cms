---
description: Scalable demand gen — qualify companies from their real ad strategy and compose a uniquely-structured landing page per company, orchestrated end-to-end in Claude Code.
argument-hint: <company name | investor/VC name | LinkedIn profile URL>
---

# Demand-gen workflow

You are orchestrating an end-to-end demand-gen pipeline **inside Claude Code**. You (Claude) are the conductor — pre-written scripts do structured extraction, and YOU do all the judgment (sourcing, brand verification, ICP fit, qualification, narrative/structure design, copywriting, visual QA).

**Input:** `$ARGUMENTS`
**Deliverable:** one personalized landing page (Petavue → target) per *qualified* company, saved as a standalone HTML file in `output/`.

Sender is always **Petavue**: a cross-channel GTM/RevOps analytics engine — full-funnel attribution, root-cause "why did this metric move?" diagnostics, unit economics, lead/account scoring, pipeline forecasting. Its edge vs. narrow single-channel point tools: it connects spend and demand *across* channels into one revenue picture. **Positioning source of truth: `context.private.md`** (the full GTM manual — competitor teardown + Petavue battlecard; gitignored. The public repo ships only the vendor-neutral `context.md` primer). Petavue's two ★ edges: cross-channel spend efficiency and diagnostics; anchor pitches to the buyer's Layer-A fear, sell only fixable data/analysis gaps.

Scripts (run from project root). **Ad data = SearchApi.io** (`SEARCHAPI_KEY` in `.env`); Playwright scrapers are fallback.
- `npm run fetch:brand -- --company <slug> --domain <domain>` → `data/<slug>.brand.json` (+ logo). Reads `BRANDFETCH_API_KEY`.
- `npm run fetch:linkedin -- --company <slug> --advertiser "<Name>" --resolve` (see advertisers) → then re-run with `--advertiser "<Name[,Founder]>"` (exact names, no `--resolve`) → `data/<slug>.ads.json`
- `npm run fetch:meta -- --company <slug> --query "<Name>" --resolve` (candidate pages) → then `--page-id <id>` → `data/<slug>.meta.ads.json`
- `npm run fetch:google -- --company <slug> --domain <domain>` → resolves `advertiser_id`, pulls creatives + details → `data/<slug>.google.ads.json`
- `npm run merge:vision -- --company <slug> --file data/<slug>.google.vision.json` → folds Chrome-read Google copy into image-archived creatives
- `npm run score -- --company <slug>` → `data/<slug>.profile.json` (multi-platform aggregate; needs `data/<slug>.step0.json`)
- `npm run render -- --company <slug> [--shot]` → `output/<slug>.html` (reads `data/<slug>.page.json` — the PAGE SPEC you author)
- Fallback (Playwright): `npm run scrape:linkedin -- --url "…?companyIds=<ID>" --headless` — use for common-word LinkedIn names (SearchApi has no company-ID filter).

**Trust nothing Brandfetch labels.** It has mislabeled color *roles*, color *ordering*, and logo *themes* for us repeatedly. Verify colors and logos against the company's real site (Step 2).

---

## Step 0 — Classify the input
- **Company** (name/domain) → primary path; skip sourcing, this is the one candidate.
- **Investor / VC firm** → source their portfolio (Step 1), then run each through Steps 2-5.
- **LinkedIn profile URL** → do NOT scrape the profile (auth-walled). Identify the person's firm/company via web search, then treat as investor or company.

State the path and why.

## Step 1 — Source candidates (investor/profile only)
WebSearch/WebFetch the **VC's own portfolio page + Crunchbase** (NOT LinkedIn). Extract names + domains. **Cap at 5** (say how you picked). Direct-company input = a list of one.

## Step 2 — Per company: gather (scripts + browser)
Working slug = lowercase shortname.

1. **Brand + firmographics:** `fetch:brand`. Read `data/<slug>.brand.json`.
2. **VERIFY BRAND COLOR from the real site.** Screenshot the homepage (Playwright) and note the primary/CTA color. Brandfetch's color *ordering* is unreliable — it called Avoma green (it's coral), Primer blue (it's charcoal). Record the verified hex for `brandColor` in the page spec.
3. **Verify the logo asset by looking at it.** Brandfetch mislabels logo `theme` — a white logo reads invisible on the light nav. The renderer auto-recolors monochrome-white SVGs (hex or named `white`), but confirm the nav logo is visible.
4. **LinkedIn — resolve the entity, the #1 trap.** SearchApi's `advertiser` is a fuzzy NAME search (no company-ID filter), so it returns namesakes ("Plain" → ~50 advertisers).
   - `fetch:linkedin --advertiser "<Name>" --resolve` → prints the advertiser breakdown with counts.
   - Re-run `fetch:linkedin --advertiser "<ExactName>[,<Founder Name>]"` (no `--resolve`) → keeps only those advertisers, drops namesakes. Founder Thought-Leader-Ads (company-sponsored) are legitimately theirs — include the founder's exact name.
   - **Common-word name?** (generic English word) The name search paginates all namesakes (costly). Prefer the Playwright fallback: resolve `companyId` from a confirmed ad's detail page, then `scrape:linkedin --url "…?companyIds=<ID>"`.
5. **Meta — confirm the `page_id`, never keyword.** `fetch:meta --query "<Name>" --resolve` → candidate pages by `page_id` (namesakes abound). Confirm the real one, then `fetch:meta --page-id <ID>`. Zero ads = genuine true negative. (Meta gives dates + format up-front.)
6. **Google — `domain` auto-resolves the entity.** `fetch:google --domain <domain>` resolves `domain`→`advertiser_id` (fuller than the domain query) and pulls creatives + per-creative details (dates, regions, and copy *where text-based*).
   - **Hybrid copy step:** Google archives many search RSAs as rendered IMAGES, so their copy isn't in the API. Open `adstransparency.google.com/advertiser/<advertiser_id>` in Chrome, read the image-ad headlines/descriptions/sitelinks visually, write them to `data/<slug>.google.vision.json` (array of `{text, format?, sitelinks?}`), then `merge:vision`. Now every Google creative carries copy.
7. **Large advertisers:** `fetch:google --detail-limit 60` (strided sample) if you want to cap per-creative detail calls; `fetch:linkedin`/`fetch:meta` paginate fully by default.
8. **Write `data/<slug>.step0.json`** — per-platform `{count, advertiser/page_id/advertiser_id, verified}`, `source:"searchapi"`. Mark unchecked platforms `checked:false`. This drives volume + breadth in scoring.

## Step 3 — Qualify (ICP fit AND ad activity — BOTH)
- **ICP fit** (your judgment): B2B SaaS with a marketing/RevOps motion and real GTM spend. Disqualify consumer, non-tech, agencies, no-marketing.
- **Ad activity:** `npm run score` (aggregates all platform files + step0 counts into one tier). Qualify if **Heavy or Moderate**. Near-zero advertisers fail — no ad strategy to personalize on.
- One-line verdict + reason per candidate.

## Step 4 — Compose the page (YOU design structure + write copy)
**Do NOT fill a fixed template.** Author `data/<slug>.page.json` — an ordered list of typed sections you *choose* for THIS company's story, so every page has a different information architecture and narrative. `render.ts` composes them in the Petavue design system.

Spec shape: `{ company, tier, brandColor: "<verified hex>", source: "authored-in-agent", sections: [ {type, ...}, … ] }`.

**Section library** (each may set `bg: "plain" | "white" | "tint"`). This is the **refined, agent-led template** — model the page on the live winners (`go.petavue.com/l` Plain, Avoma, GPTW) and the worked example `data/neysa.page.json`:
- `hero` `{eyebrow, headline, subhead, ctaLabel, secondaryLabel?, chips?[], card?, proof?}` — lead with an **outcome** ("agents that make the next move"), NOT a rhetorical question. `chips` = 3 trust bullets. `card` = an agent-recommendation mock (see `recommendations`); `proof:true` renders the ad-data stat card instead.
- `homework` `{eyebrow, heading, body, channels:[{platform, stat, label, body}], footer?}` — "we studied how you run paid before writing a word": per-channel ad-intel recap. **The subtle personalization proof.** Frame as respect ("a sharp, deliberate engine"); use real counts + themes; end with "the engine's dialed in — here's the gap."
- `insight` `{eyebrow, heading, body, showData?}` — personalized read; `showData` renders stat tiles.
- `problem` / `opportunity` `{eyebrow, heading, body, points:[{icon,title,text}]}` — icon-list of pains / upside.
- `splitFeature` `{eyebrow, heading, body, proofline?}` — heading-left / body-right.
- `statement` `{eyebrow?, heading, body?}` — big centered pull-quote. **This is where the subtle mirror lives** (see tone rule).
- `capabilities` `{eyebrow, heading, sub?, items:[{icon,title,body}]}` — 4–6 cards, each tied to a number the team already owns.
- `agentLoop` `{eyebrow, heading, body, goals?:[{text,result}], steps:[{title,body}]}` — "point agents at a goal" → Monitor · Verify · Recommend · Act · Learn.
- `recommendations` `{eyebrow, heading, body, cards:[card], note?}` where `card = {app?, time?, tag, title, body, metrics:[{v,k}], move, impact, actions[]}` — 1–2 live Slack-style agent recommendation mocks. **Mark them illustrative** in `note` ("calibrated to your motion; on a pilot the numbers are your own").
- `comparison` `{eyebrow, heading, them:{tag,body}, us:{tag,body,points[]}}` — "why not just a dashboard / Claude".
- `calculator` `{eyebrow, heading, body, icp?, fit?, conv?, acv?, note?}` — interactive missed-pipeline sliders (defaults are illustrative; set to the target's economics).
- `defensibility` `{eyebrow, heading, body, points:[{icon,title,body}]}` — lineage · "ask why" · you-approve-every-move.
- `integrations` `{eyebrow, heading, body, groups:[{label, items:[{name, status?}]}]}` — `status: "live" | "ready"` (else plain). Their channels LIVE, others ready.
- `productPreview` `{eyebrow?, heading?, panelTitle?, panelDesc?, features?}` — honest Petavue UI mock (legacy; prefer `recommendations`/`calculator` now).
- `pilot` `{eyebrow, heading, body, steps:[{when, title, body}]}` — week-by-week timeline.
- `cta` `{heading, body, ctaLabel}`.
Icons are [Phosphor](https://phosphoricons.com) names (e.g. `flow-arrow`, `magnifying-glass`).

**The default arc (compose from this; reorder/drop per company, but this agent-led backbone is the proven pattern):**
`hero(+card+chips)` → `homework` → `statement` (the mirror) → `capabilities` → `agentLoop` → `recommendations` → `comparison` → `calculator` → `defensibility` → `integrations` → `pilot` → `cta`. Vary section mix, emphasis, and copy per company so no two read identically — but keep the hero→homework→mirror opening and the pilot→cta close.

**Tone — the subtle mirror (this is the point):**
- Lead the hero with an **outcome**, never a blunt rhetorical question.
- The mirror ("you do X for your customers — who does X for *you*?") belongs in **one** `statement`, phrased with respect and in the company's **own language** (Neysa's "finally unified", Plain's "AI deflection ≠ resolution"). **Never** "you can't measure" / "you're failing" — that's tone-deaf.
- Frame `homework` as "the engine is dialed in — here's the gap," not criticism.

**Content rules:**
- **Lead with the target's REAL themes from their ad copy** (`data/<slug>.ads.json`, `data/<slug>.google.ads.json`), not the keyword-bucket labels (they misfire cross-domain).
- Anchor each section to a specific Petavue capability (see `context.private.md`, or the public `context.md` primer). No generic SaaS filler.
- **If something is not confirmed, don't include it.** No fabricated trust logos (real logos only, in `assets/trust/`), no invented product metrics. Recommendation/calculator numbers are **illustrative — say so**.

Then render + **visually QA**: `npm run render -- --company <slug> --shot`, open `data/<slug>.preview.png`, and confirm: the page color matches the company's real brand, the nav logo is visible, CTA text is readable, sections render cleanly, structure feels intentional. Re-render if off.

## Step 5 — Report
Candidates considered, qualified vs. rejected (reasons), tier + platforms per qualified company, the chosen narrative arc, and each `output/<slug>.html` path. Keep it tight.
