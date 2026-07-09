# The GTM & Marketing Analytics Manual

*A layman's manual, built for Petavue · v2*

Learn the GTM & marketing world well enough to think like a RevOps.

A comprehensive, ground-up guide to the go-to-market world — marketing, sales, and the analytics beneath them. Written for someone with no prior GTM background, it teaches the domain the way practitioners actually think *inside* it: the people and their real pains, the funnel, the metrics, the channels, and how every piece connects. Not a surface skim — the working mental models of the field.

> **Purpose of this document.** This manual is built to be read as an easy, document-style primer AND to be fed to a model as context — so that any output (website design changes, UX design, UX-language/copy changes, positioning, messaging) is tailored to GTM/marketing personas and the way they actually think. When using it that way, anchor every recommendation to a real persona and their real pain, at the right altitude, and remember: dashboards, alerts, recommendations are *delivery formats*, not pains.

---

## The anchor — never lose this thread

Every concept in here exists to answer five questions in order. When you feel lost in detail, come back to these:

1. **Who is the customer?** (which persona, in whose chair)
2. **What is their real pain?** (the job/outcome — not the dashboard)
3. **How do others (like a narrow single-channel tool) solve it?**
4. **Is it actually solved, or does pain remain — and why?**
5. **Where can Petavue step in?**

*Remember: dashboards, alerts, recommendations are* **delivery formats**, *not pains. The pain is the outcome the person is desperate for. Diagnose pain first, choose the format second.*

## How to use this manual

1. **Read in order.** Modules build on each other, 1 → 10. Read them in order; each builds on the last.
2. **Watch the tags.** Every concept is tagged by funnel stage and "theory vs from-the-field," so you always know where it lives.
3. **Ask & note.** Hit anything fuzzy? Ask back-and-forth. Jot opinions as you go.

### The colour code you'll see everywhere (rendered here as inline tags)

- `[Top]` awareness · `[Mid]` consideration · `[Bottom]` decision · `[Post]` retain/expand
- **Example —** a worked illustration
- **From the field —** practitioner knowledge, not textbook
- **⚠ The pain —** the outcome-level problem
- **⚓ Loop back to the anchor —** ties the module back to the five questions

## The modules

| # | Module | What it covers |
| --- | --- | --- |
| 1 | Personas & their goals | A day in the life. What each role optimizes for, and the pains — at the problem layer and the data layer. |
| 2 | The language of marketing | Source, channel, medium, campaign, UTMs — the vocabulary, tied to the journey. |
| 3 | The metrics dictionary | Every metric (CTR→ROAS→CAC), each tagged top/mid/bottom funnel. Plus where PathFactory fits. |
| 4 | Funnel & lifecycle | Stages, lead→MQL→SQL→deal, sourced vs influenced pipeline. |
| 5 | Channels compared | Google vs Meta vs LinkedIn vs YouTube — intent, cost, B2B/B2C fit, where to put the money. |
| 6 | Attribution, deep | Every model, 95-5, dark funnel, sourced vs influenced — and which funnel stage each touches. |
| 7 | The analytics concept map | All the metric families beyond attribution: velocity, CAC, LTV, coverage, retention. |
| 8 | Data layer & blindspots | Why visibility breaks — root-caused into data problem vs process problem. |
| 9 | Benchmarking & lookalikes | Comparing to a reference — internal cohorts, ICP-fit, industry. |
| 10 | 20 journey scenarios | 95% of real customer journeys, inception → won/lost → renewal. A gallery to internalise. |

---

## Module 1 — Personas & their goals

*To find the real pain, sit in the chair. This module puts you in each GTM person's seat — what they're chasing, the decision they sweat, and where it hurts. We split every pain into two layers, because that split is the whole game.*

### First, the two layers of every pain

Whenever someone is stuck, the cause sits in one of two layers. Keep this lens on for the whole manual.

- **Layer A · The problem layer (the goal)** — What they're actually trying to achieve, the outcome they're judged on. "Create pipeline I can defend." "Hit the number predictably." This is the *pain*. It rarely changes.
- **Layer B · The data/ops layer (why it's hard)** — The plumbing that blocks the goal: missing data, broken integrations, anonymity, messy CRM, slow process. This is where the *difficulty* lives, and where tools like a narrow point tool operate.

> **⚓ Anchor —** A product that only fixes Layer B (cleaner data) without relieving Layer A (the goal) feels like a "nice tool" but doesn't get bought. A product that names the Layer A pain and fixes the Layer B cause of it — that gets paid for. Hold this through every persona below.

### A day in the life: the Demand Gen Manager

Meet **Maya**, demand-gen lead at **Lumen** (B2B SaaS, ~$20k deals, ~3-month cycle). She's the person a narrow point tool sells to, so her head is the most important one to live inside. Her one-line goal: **create efficient, provable pipeline.** She's judged on pipeline created/influenced and on efficiency (cost per pipeline dollar).

#### What's on her mind — in priority order

*This ranking* is *the insight. The top items are existential; the lower ones are optimizations.*

1. **Am I creating enough pipeline to hit the number?** [Top] [Mid]
 *"If pipeline dries up, nothing else matters. This is survival."*
2. **Is my spend going to the right place?** Which channel and campaign returns real pipeline, not just cheap clicks? [Top]
 *"I have a fixed budget. LinkedIn vs Google vs Meta — where's each dollar best spent?"*
3. **Can I prove marketing's impact to my CRO?** [All stages]
 *"At the QBR, David asks what marketing did for revenue. I need a defensible answer or my budget gets cut."*
4. **Which messages and creatives are landing?** [Top]
 *"Is the founder's thought-leader post working better than the product ad? Image vs text?"*
5. **Are these leads good-fit, or junk?** [Mid]
 *"Volume is easy to fake. 200 student emails ≠ 5 VPs at target accounts."*
6. **Is sales actually following up on what I hand over?** [Mid] [Bottom]
 *"I pass MQLs and they vanish. Then sales says marketing's leads are bad."*
7. **What's working in the market / for competitors?** [Top]
 *"What are others running? What's the going benchmark for my numbers?"*

#### Her hiccups — and which layer each one is

Notice how almost every difficulty is a **Layer B** (data/process) block standing between her and a **Layer A** goal:

| What Maya says | Layer | Root cause |
| --- | --- | --- |
| "I can't see which ads led to closed deals." | B · data | Engagement is anonymous + each platform is a walled garden + no closed loop to the CRM. |
| "LinkedIn, Google and Meta each claim the same deal." | B · data | Walled-garden self-attribution — every platform over-credits itself. |
| "Reps don't log where the lead came from." | B · process | Manual CRM entry; no enforced source capture. |
| "Brand work clearly helps, but I can't prove it." | B · measurement | The dark funnel — influence with no click to record. |
| "I don't know if my LinkedIn-vs-Google split is right." | A · decision | A Layer-A decision she *can't make* because Layer B doesn't give her the truth. |

> **From the field —** This is the exact gap a seasoned operator lived as a marketer, and why his pitch lands: he's not selling "a dashboard," he's selling Maya the ability to walk into the QBR and *defend her budget with proof*. Same data, but aimed at her Layer-A fear.

### Everyone else in the room

Each persona shows the **goal**, what they **optimize for**, the **decision they sweat**, and their pain in **both layers**. Grouped Marketing → Sales → Ops → Leadership.

#### Marketing — work the top & middle

**Performance / Paid Marketer** — *Marketing · the ad operator*
- **Goal:** turn ad budget into the most pipeline per dollar.
- **Optimizes for:** ROAS, cost-per-lead, cost-per-pipeline. Bids, budgets, audiences, creatives.
- **Decision they sweat:** which campaign/creative/audience to scale or kill, this week.
- **Layer A pain:** "Am I scaling the thing that makes *revenue*, or just the thing with cheap clicks?"
- **Layer B pain:** platforms only report up to the click; the revenue truth is in a CRM they can't see into.

**Content / Brand Marketer** — *Marketing · the long game*
- **Goal:** make the right people know & trust us before they're ready to buy.
- **Optimizes for:** reach, engagement, share of voice, branded search growth.
- **Decision they sweat:** what story/format to publish; where to show up.
- **Layer A pain:** "My work compounds for months — but I get judged on this quarter's leads."
- **Layer B pain:** brand impact has no click to trace — the dark funnel makes it nearly unmeasurable.

#### Sales — work the bottom

**SDR / BDR** — *Sales · the opener*
- **Goal:** book qualified meetings for AEs.
- **Optimizes for:** meetings booked, accounts worked, reply rate.
- **Decision they sweat:** who do I reach out to *right now*?
- **Layer A pain:** "I waste hours on accounts that were never going to buy."
- **Layer B pain:** no signal on who's warming — the intent is invisible (anonymity again).

**Account Executive (AE)** — *Sales · the closer*
- **Goal:** close deals and hit quota.
- **Optimizes for:** closed-won revenue, win rate, deal velocity.
- **Decision they sweat:** which deals to pour time into this month.
- **Layer A pain:** "I need warm, ready buyers — not to educate cold ones from scratch."
- **Layer B pain:** can't see the marketing context (what the buyer already engaged with) — it never reached the CRM.

**Sales Manager / VP Sales** — *Sales · the leader*
- **Goal:** the team hits its number, predictably.
- **Optimizes for:** quota attainment, forecast accuracy, pipeline coverage.
- **Decision they sweat:** where to coach, where to allocate reps, what to forecast.
- **Layer A pain:** "Is there enough *quality* pipeline to make the number?"
- **Layer B pain:** pipeline data they can't fully trust — dirty CRM, optimistic reps.

#### Ops — build the machine, own the data

**Marketing Ops** — *Ops · marketing systems*
- **Goal:** give marketing clean data, working tools, and trustworthy attribution.
- **Optimizes for:** data quality, integration uptime, attribution setup, routing speed.
- **Decision they sweat:** what to integrate, how to model attribution, how to keep data clean.
- **Layer A pain:** "Marketing's decisions are only as good as the numbers I can give them."
- **Layer B pain:** tools that don't talk to each other; this *is* their daily life. Often the one who installs a narrow point tool.

**Sales Ops** — *Ops · sales systems*
- **Goal:** a clean CRM and an accurate forecast.
- **Optimizes for:** CRM hygiene, pipeline accuracy, process automation, rep adoption.
- **Decision they sweat:** what process/automation to enforce so data stays trustworthy.
- **Layer A pain:** "Leadership forecasts off my data — it has to be right."
- **Layer B pain:** reps don't log consistently; data decays the moment it's entered.

**RevOps** — *Ops · the unifier (= Sam)*
- **Goal:** one source of truth across the whole revenue process.
- **Optimizes for:** end-to-end data integrity, aligned hand-offs, full-funnel reporting.
- **Decision they sweat:** how to unify marketing + sales + CS data and process so nothing breaks at the seams.
- **Layer A pain:** "The teams argue because they're each looking at different numbers."
- **Layer B pain:** data breaks exactly at the marketing↔sales handoff — the seam a narrow point tool stitches.

**Lifecycle / Email Marketer** — *Marketing/Ops · the nurturer*
- **Goal:** move known leads from interested → sales-ready.
- **Optimizes for:** nurture conversion, email engagement, MQL→SQL rate.
- **Decision they sweat:** which sequence/offer moves a lead to the next stage.
- **Layer A pain:** "I need to warm the 95% who aren't ready yet — without annoying them."
- **Layer B pain:** engagement data is scattered across email, site, ads — no single view of the person.

#### Leadership — own the number

**CMO / VP Marketing** — *Leadership · owns marketing*
- **Goal:** prove and grow marketing's contribution to revenue.
- **Optimizes for:** marketing-sourced/influenced pipeline, CAC, budget efficiency.
- **Decision they sweat:** how to split budget across channels & teams.
- **Layer A pain:** "I have to defend my budget to the CEO with hard numbers."
- **Layer B pain:** attribution they can't fully trust, so the defense is shaky.

**CRO / Head of Revenue** — *Leadership · owns all revenue (= David)*
- **Goal:** predictable, efficient revenue growth.
- **Optimizes for:** total revenue, CAC payback, net revenue retention, forecast accuracy.
- **Decision they sweat:** where does growth *really* come from, and where to invest next?
- **Layer A pain:** "I can't confidently say which engine is driving growth."
- **Layer B pain:** a fragmented view stitched across marketing, sales and CS systems.

> **⚓ Loop back to the anchor —** Across every persona, the **Layer A pain barely changes** — "create/prove/grow revenue I can trust." What changes is whose seat you're in. And every one of them is blocked by the **same Layer B cause**: the data that would answer them is anonymous, walled-off, or stuck in a system the next person can't see. That single Layer-B cause, sitting under many Layer-A pains, is the territory a narrow point tool farms — and the territory Petavue has to understand cold. Modules 2–9 dissect that territory; the keystone modules show how a narrow point tool monetizes it.
---

## Module 2 — The language of marketing

*Before any number means anything, every interaction has to be labelled — where it came from, how, and as part of what. These labels (source, medium, channel, campaign, content) are the grammar of all marketing analytics. Get them precise and the rest of the manual reads cleanly.*

### The five labels on every interaction

When someone arrives from a marketing touch, five questions get answered about it. Each has a precise name (and a matching `UTM` tag — the parameters added to a link so analytics can read the labels).

| Label | Answers | Example value | UTM |
| --- | --- | --- | --- |
| **Source** | Where exactly did it come from? (the specific origin) | `linkedin`, `google`, `newsletter` | `utm_source` |
| **Medium** | What *type* of traffic is it? (the mechanism) | `cpc` (paid), `organic`, `email`, `social` | `utm_medium` |
| **Campaign** | Part of which initiative? | `q3-webinar`, `spring-launch` | `utm_campaign` |
| **Content** | Which specific variant? (for A/B) | `image-a` vs `text-b` | `utm_content` |
| **Term** | Which paid keyword? (search only) | `project+management` | `utm_term` |

**"But people say `channel` all the time?"** Right — and notice it's *not* in this table. Channel isn't a label you set on a link; it's a bucket the tool *derives* by rolling up source + medium. That's the next section.

> **Example — The anatomy of one tagged link.**
> `https://lumen.com/demo?utm_source=linkedin&utm_medium=cpc&utm_campaign=q3-webinar&utm_content=founder-post`
>
> Maya puts this link in a LinkedIn ad. When someone clicks, her analytics records: came from **linkedin**, via **paid (cpc)**, as part of **q3-webinar**, specifically the **founder-post** creative. That record is what makes attribution possible later.

### Source vs Channel — the one people confuse

A `channel` isn't a sixth label — it's the **bucket analysts report on**, formed by rolling up **source + medium**. Individual sources are too granular for a budget conversation; channels are the altitude leaders think in.

| Source + Medium | Rolls up to Channel |
| --- | --- |
| google / cpc · bing / cpc | **Paid Search** |
| linkedin / cpc · meta / cpc | **Paid Social** |
| google / organic | **Organic Search** |
| linkedin / social (unpaid post) | **Organic Social** |
| newsletter / email | **Email** |
| another site links to you / referral | **Referral** |
| no label / typed the URL | **Direct** |

> **Key — Hold the distinction.** **Source** = the specific origin (linkedin). **Medium** = the mechanism (paid vs organic). **Channel** = the reporting bucket the two roll into (Paid Social). When someone says "which channel should I invest in," they mean the bucket — that's the M5 question.

### Three more splits worth knowing

- **Paid · Owned · Earned** — **Paid** = you bought the reach (ads). **Owned** = your own channels (website, newsletter). **Earned** = others spread it for you (press, word-of-mouth, shares).
- **Inbound vs Outbound** — **Inbound** = they come to you (content, search, ads they chose to click). **Outbound** = you go to them (SDR cold email, cold calls).
- **Organic vs Paid** — **Organic** = unpaid reach (a post that spreads, ranking in search). **Paid** = you paid for placement. Same platform can be both (a LinkedIn post vs a LinkedIn ad).

### How the labels ride the journey

Every touch on the customer journey carries these labels. That's what lets you later reconstruct the path and assign credit. Here is one account's first three touches:

| Touch | Source / Medium | Channel | Funnel |
| --- | --- | --- | --- |
| Saw the founder's boosted post | linkedin / cpc | Paid Social | [Top] |
| Later googled "Lumen" and clicked the unpaid result | google / organic | Organic Search | [Mid] |
| Clicked the "book a demo" link in a nurture email | newsletter / email | Email | [Bottom] |

> **⚠ The pain — Where it breaks (preview of M8).** When a touch has *no* label — someone heard about you on a podcast, then typed your URL — analytics files it as **Direct**. That "Direct" bucket is often the biggest and least understood, and it's the visible tip of the `dark funnel`. Labels are only as good as your ability to capture them.

> **⚓ Loop back to the anchor —** This vocabulary is the grammar every later module speaks. **Channels** are what the "where do I spend?" pain is about (M5). **Source/medium labels** are the raw material attribution works on (M6). And the **unlabelled "Direct" bucket** is the first crack in the data layer (M8). Precise labels in, trustworthy answers out.

---

## Module 3 — The metrics dictionary

*Every metric lives at a point in the funnel and answers a different question. Read them in funnel order — top (exposure) to post-sale (retention) — and you'll always know whether a number is measuring awareness, consideration, decision, or value. Each section is tagged by stage.*

**The funnel at a glance:**
- **TOP** — Impressions · Reach · Frequency · CPM · CTR · CPC
- **MIDDLE** — Visitors · Conversion rate · Leads · CPL · MQL · stage-conversion rates
- **BOTTOM** — SQL · Opportunities · Pipeline · Win rate · CAC · ROAS · Velocity
- **POST** — LTV · LTV:CAC · Payback · NRR · Churn

### Top-funnel metrics [Top] awareness / exposure

| Metric | What it is | What it tells you |
| --- | --- | --- |
| **Impressions** | Number of times your ad/content was shown (double-counts repeats). | Raw exposure volume. |
| **Reach** | Number of *unique* people who saw it. | How many distinct people, not how many views. |
| **Frequency** | `impressions ÷ reach` | Average times each person saw it (too high = fatigue). |
| **CPM** | Cost per 1,000 impressions: `(spend ÷ impressions) × 1000` | The price of exposure. |
| **CTR** (click-through rate) | `clicks ÷ impressions` | How compelling the ad/creative is — relevance signal. |
| **CPC** (cost per click) | `spend ÷ clicks` | The price of getting someone to act once. |
| **Engagement rate** | `engagements ÷ impressions` (likes, comments, clicks) | Resonance, especially for organic/social. |

> **From the field — the vanity-metric trap.** Impressions, CTR and CPC are easy to inflate and feel good, but on their own they are **vanity metrics** — they say nothing about revenue. The marketers worth learning from (seasoned operators included) judge ads by the *pipeline* they produce, not the clicks. Always push a top-funnel number down to a bottom-funnel outcome before trusting it.

### Mid-funnel metrics [Mid] consideration / capture

| Metric | What it is | What it tells you |
| --- | --- | --- |
| **Visitors / Sessions** | People (or visits) arriving on your site. | Top-of-site traffic volume. |
| **Conversion rate** | `conversions ÷ visitors` (e.g., visit → lead) | How well a page/offer turns interest into a hand-raise. |
| **Lead** | A captured, known contact (usually a form fill). | You now have a name to work. |
| **CPL** (cost per lead) | `spend ÷ leads` | The price of one hand-raise (watch for cheap-but-junk). |
| **MQL** | Marketing-Qualified Lead — scored ready to pass to sales. | Marketing's signal that this lead is worth sales' time. |
| **Cost per MQL** | `spend ÷ MQLs` | Cost of a *qualified* lead — closer to real value than CPL. |
| **Stage-conversion rates** | `Lead→MQL`, `MQL→SQL` percentages. | Where leads progress or leak between stages. |

### Bottom-funnel metrics [Bottom] decision / revenue

| Metric | What it is | What it tells you |
| --- | --- | --- |
| **SQL / SAL** | Sales-Qualified / Sales-Accepted Lead — sales agrees it's real. | The marketing→sales handoff succeeded. |
| **Opportunity** | A deal in the CRM with a $ value and close date. | Countable future revenue. |
| **Pipeline created (sourced)** | Total $ value of opportunities created. | How much future revenue marketing/sales generated. |
| **Win rate** | `deals won ÷ opportunities` | How efficiently opportunities become revenue. |
| **Sales cycle length** | Average days from opportunity to close. | How fast money moves through the funnel. |
| **CAC** | `(sales + marketing spend) ÷ new customers` | What it costs to acquire one customer. |
| **ROAS** | `revenue ÷ ad spend` | Return on each ad dollar (common in B2C/ecommerce). |
| **Pipeline velocity** | `(opps × win-rate × avg deal) ÷ cycle length` | $ generated per day — a single composite of health. |

### Post-sale & efficiency metrics [Post] value / retention

| Metric | What it is | What it tells you |
| --- | --- | --- |
| **LTV** (lifetime value) | Total revenue a customer brings over their life: ~`ARPA ÷ churn rate`. | What a customer is ultimately worth. |
| **LTV : CAC** | Ratio of value to acquisition cost (a healthy rule of thumb is ~3:1). | Whether growth is economically sound. |
| **CAC payback** | Months of revenue to recoup CAC. | How fast acquisition pays for itself. |
| **NRR** (net revenue retention) | Revenue kept + expansion − churn, vs a year ago. >100% = growing without new sales. | How well you keep and grow existing customers. |
| **Churn** | % of customers/revenue lost in a period. | The leak in the bucket. |
| **Marketing-sourced %** | Share of pipeline where marketing created the *first* touch. | Marketing's role in *originating* demand. |
| **Marketing-influenced %** | Share of pipeline marketing touched *anywhere* in the journey. | Marketing's role in *assisting* demand (the broader, fairer view). |

> **Key — Sourced vs influenced — remember this pair.** **Sourced** credits marketing only for deals it *started*. **Influenced** credits it for any deal it *touched*. Sales tends to argue "sourced" (less credit to marketing); marketing argues "influenced." This is the credit war from the pain landscape — and it's a *definition* fight, not a data fight. M6 goes deeper.

### Connecting metrics: "did my ads drive revenue?"

This is the family you were looking for. Pipeline-per-dollar is one of a small set of metrics whose entire job is to **bridge the top of the funnel (spend) to the bottom (pipeline, revenue)**. These are the numbers marketers actually live or die by.

| Metric | What it is | Bridges |
| --- | --- | --- |
| **Pipeline created (sourced)** | $ value of opportunities your spend produced. | spend → pipeline |
| **Pipeline per dollar** | `pipeline ÷ spend` (inverse = cost per pipeline $) | spend → pipeline |
| **Cost per SQL / opportunity** | `spend ÷ SQLs (or opps)` | spend → qualified demand |
| **ROAS** | `revenue ÷ ad spend` (needs *closed* revenue) | spend → revenue |
| **CAC** | `(sales + mktg spend) ÷ new customers` | spend → customers |
| **Pipeline velocity** | $ generated per day (opps × win × deal ÷ cycle) | whole funnel → speed |
| **Marketing-sourced / influenced %** | Share of pipeline marketing started / touched. | activity → revenue credit |

> **Key — Leading vs lagging within this family.** **Pipeline-per-dollar** is an *early* read — pipeline appears when a deal is created. **ROAS** and **CAC** are the *verdict* — they need *closed* revenue, which in a 3-month cycle arrives too late to steer this quarter's spend. So marketers watch pipeline-per-dollar to act, and ROAS/CAC to confirm.

### How marketers are actually evaluated

Which class of metric a marketer is judged on tells you how mature the org is.

- **Leading / activity** — Impressions, clicks, leads, MQLs. Immediate and easy to move — but **gameable** (200 junk leads look like "results"). A weak basis for judgement.
- **Lagging / outcome** — SQLs, pipeline created, revenue, sourced/influenced %. Slow to arrive, but **real** — they can't be faked into existence.

> **From the field — The shift you should know.** Marketers *used* to be judged on **MQLs / leads** (leading, gameable). Good modern orgs now hold demand-gen accountable to **pipeline and revenue** (lagging, real), because sales ignores low-quality MQLs and budget follows proof. So a demand-gen lead increasingly carries a **pipeline number**, not just an MQL count — which is precisely why "prove marketing's revenue impact" is a top-priority pain.

#### Who owns which part of the funnel

| Stage | Owner |
| --- | --- |
| [Top] Awareness | **Marketing** |
| [Mid] Consideration → MQL | **Marketing** (SDRs begin entering here) |
| [Mid]→[Bottom] the MQL → SQL handoff | **Shared / contested** — the seam where the fight happens |
| [Bottom] SQL → Close | **Sales** (the AE) |
| [Post] Retain / Expand | **Customer Success** |

> **Key — Not a clean cut.** Marketing roughly owns top + mid, sales owns bottom — but SDRs (a sales function) do mid-funnel outreach, and modern marketing is held accountable *into* pipeline even though sales executes the close. The messiness at the handoff is exactly why **RevOps** exists: to own the whole chain so no one argues over different numbers.

### Where PathFactory fits

You asked where a product like **PathFactory** sits. It's a **content engagement (or "content experience") platform**, and it lives squarely in the [Mid] mid-funnel — the consideration/nurture stretch most metrics measure poorly.

- **What it does** — Bundles your content into **tracks/hubs**, recommends the next best asset, and — critically — measures **how deeply** a prospect consumes content: which assets, time spent, "binge" behaviour. It turns that depth into an **engagement score / intent signal** fed to the MAP/CRM.
- **The metric it adds** — Ordinary mid-funnel metrics stop at "they clicked / downloaded." PathFactory adds **content engagement time and depth** — a far better warmth signal than a single click, because reading 4 assets for 12 minutes means something a click does not.

> **Example — On the journey.** A prospect downloads one Lumen guide ([Mid] mid-funnel). PathFactory serves a track of related assets and records she spends **12 minutes across 4 of them**. That depth scores her up and signals sales she's warming — visibility a plain "1 download" event would have missed. So PathFactory is a **mid-funnel engagement-measurement layer**, not an attribution or ad tool; it deepens the *consideration* signal.

### All the metrics, along one journey

The clearest way to hold these together: follow one account (Acme, via Lumen's LinkedIn campaign) from first impression to renewal, and watch which metric appears at each step.

| # | What happens | Metric(s) that appear | Funnel |
| --- | --- | --- | --- |
| 1 | Lumen's LinkedIn ad is shown 100,000 times | Impressions · CPM | [Top] |
| 2 | 2,000 people click it | Clicks · CTR (2%) · CPC | [Top] |
| 3 | Priya at Acme lands on the site | Visitors / Sessions | [Mid] |
| 4 | She fills the "book a demo" form | Lead · CPL · conversion rate | [Mid] |
| 5 | Marketing scores her ready | MQL · Lead→MQL rate · cost per MQL | [Mid] |
| 6 | An SDR accepts her as real | SQL · MQL→SQL rate | [Mid]→[Bottom] |
| 7 | The AE opens a deal worth $20k | Opportunity · Pipeline created · cost per opportunity | [Bottom] |
| 8 | Across the whole campaign | **Pipeline per dollar** (pipeline ÷ spend) — the early efficiency read | bridge |
| 9 | The deal closes | Closed-Won / Revenue · Win rate · Sales-cycle length | [Bottom] |
| 10 | Efficiency check after close | ROAS · CAC · Marketing-sourced % (the ad was first touch) | bridge |
| 11 | A year later she renews + adds seats | NRR · LTV · LTV:CAC | [Post] |

> **Example — The takeaway.** Top-funnel metrics (1–2) are about *exposure*, mid (3–6) about *capture & qualification*, bottom (7, 9) about *revenue*, and the **bridge metrics** (8, 10) are the ones that answer "did the ad spend actually pay off?" — the question that started this section.

> **⚓ Loop back to the anchor —** The skill isn't memorising formulas — it's knowing **which funnel stage a metric speaks for**, and always pulling a top-funnel number (impressions, CTR) down toward a bottom-funnel outcome (pipeline, revenue) before you trust it. That instinct — refusing to be satisfied by vanity metrics — is exactly what separates a real operator from a dashboard-watcher.
---

## Module 4 — Funnel & lifecycle

*The funnel is the spine everything hangs on. This module separates the two things people merge — the* lifecycle *of a person and the* stages *of a deal — shows the funnel as arithmetic (where it leaks), and pins down sourced vs influenced pipeline.*

### Two ladders people merge: lifecycle vs deal stage

"Stage" means two different things depending on whether you're talking about a **person** or a **deal**. Keeping them apart removes most funnel confusion.

- **Lifecycle stage (the person)** — how qualified a *person/contact* is: `Subscriber → Lead → MQL → SQL → Opportunity → Customer`. Owned mostly by marketing (up to SQL).
- **Deal stage (the opportunity)** — how far along a *deal* is, once it exists: `Discovery → Demo → Proposal → Negotiation → Closed-Won / Lost`. Owned by sales (the AE).

> **Key — Where they connect.** The person's lifecycle and the deal's stages meet at one moment: when an **SQL** becomes an **Opportunity**, the baton passes from the lifecycle ladder (marketing) to the deal-stage ladder (sales). Same funnel, two owners, one handoff.

### The funnel is arithmetic — and it leaks

A funnel is just a series of conversion rates. Seeing it as numbers shows exactly where you're losing people. One quarter for Maya:

| Stage | Count | Conversion |
| --- | --- | --- |
| [Top] Impressions | 100,000 | — |
| [Top] Clicks | 2,000 | 2% CTR |
| [Mid] Leads | 400 | 20% |
| [Mid] MQLs | 120 | 30% |
| [Mid] SQLs | 60 | 50% |
| [Bottom] Opportunities | 30 | 50% |
| [Bottom] Closed-Won | 10 | 33% win |

> **Example — Reading the leak.** Each step is a conversion rate; multiply them and 100,000 impressions become 10 customers. The power of this view: if you want more revenue you can either pour in **more top** (impressions) *or* **fix a leaking rate** (e.g., lift MQL→SQL from 50%). Fixing a mid-funnel rate is usually cheaper than buying more top. This is the core of what a demand-gen analyst does all day.

### Sourced vs influenced pipeline

When a deal closes after many touches, which marketing gets the credit? Two definitions — and the gap between them is the sales-vs-marketing credit war from the pain landscape.

One account's touches before a $20k deal:
`LinkedIn ad (1st touch) → Webinar → Nurture email → SDR call → Demo → won`

- **Sourced — marketing *started* it** — Credit only the deal whose **first touch** was marketing (the LinkedIn ad). Narrow. Sales prefers this — it gives marketing less.
- **Influenced — marketing *touched* it** — Credit the deal if marketing touched it **anywhere** (ad, webinar, email all count). Broad. Marketing prefers this — it gives marketing more.

> **⚠ The pain — Why this is a definition fight, not a data fight.** Both sides are looking at the same touches; they just draw the credit line differently. That's why "we can't agree on attribution" is often a *governance* problem (agree the definition) before it's a *tooling* problem. Tools that don't force a shared definition just give each side ammunition.

### Beyond the funnel: the retention loop

The classic funnel ends at "Closed-Won," but in subscription businesses most of the money comes *after*. The modern view bends the funnel into a loop: a won customer feeds **retention → expansion → advocacy**, which feeds new demand.

> **From the field —** This is why you'll hear "funnel is dead, think flywheel." Don't over-index on the slogan — the funnel is still the right tool for a single deal's progression. The flywheel just reminds you that **keeping and growing** a customer (NRR > 100%) usually beats winning a new one, so post-sale metrics deserve as much attention as acquisition.

> **⚓ Loop back to the anchor —** The funnel-as-arithmetic view is where most marketer pains *live*: "where's the leak?" (a conversion-rate question), "is my pipeline real?" (a bottom-of-funnel trust question), "who gets credit?" (a sourced-vs-influenced definition question). When you read a point tool's use cases, notice which **funnel rate or handoff** each one is trying to make visible.

---

## Module 5 — Channels compared

*"Where should I put my next dollar — Google, Meta, LinkedIn?" is the highest-priority pain in the whole landscape. To answer it you need one mental model and one comparison. Here they are.*

### The one model: capture vs create demand

Every channel does one of two jobs. Get this and the rest falls into place.

- **Capture demand** — **Search (Google).** The person is *already* looking ("project management software"). You meet existing intent. High intent, converts fast, easy to attribute (a click right before the action). But you can only capture demand that already exists.
- **Create demand** — **Social & video (LinkedIn, Meta, YouTube).** The person *wasn't* looking — you interrupt their feed and create interest. Slower, harder to attribute (influence with no immediate click), but it's the only way to grow the pool of future buyers (the 95% not in-market yet).

> **Key — Why this matters for measurement.** Capture channels look great in last-click reports (they get the final click). Create channels look weak there (their influence is invisible). So **the way you measure decides which channel you praise** — and naive last-click measurement systematically over-funds search and starves the social/video that fed it. This is the bridge to M6.

> **Example — Watch it happen.** Priya sees Lumen's LinkedIn ad **6 times over three weeks but never clicks** — she just absorbs it. One day she googles "Lumen," clicks the Google ad, and books a demo. A **last-click** report credits **Google with 100%** of that $20k deal and **LinkedIn with 0%**. Maya reads it as "Google works, LinkedIn is a waste" and shifts budget to Google. But Priya only searched for Lumen *because* LinkedIn made her aware. Cut LinkedIn, and next quarter fewer people search for "Lumen" at all — so Google's results shrink too. **Last-click rewarded the harvester and punished the farmer.**

### The four channels, side by side

| Channel | Job | How you target | Cost | Best for | Fit |
| --- | --- | --- | --- | --- | --- |
| **Google Search** | Capture | Keywords (what they type) | Med–High per click | [Bottom] harvesting existing intent | B2B + B2C |
| **LinkedIn** | Create | Job title, company, industry (firmographic) | High CPM/CPC | [Top] [Mid] reaching B2B decision-makers | B2B |
| **Meta** (FB/Insta) | Create | Interests, behaviours, lookalikes | Low CPM (cheap reach) | [Top] [Mid] broad reach, retargeting, visual | B2C-lean |
| **YouTube** | Create | Interests + Google's intent data | Low per view | [Top] awareness via video | B2B + B2C |

Also in the mix: **Google Display/PMax** (cheap broad reach), **TikTok** (B2C, younger), **Email** (owned, nurture — not paid acquisition), **SEO/Organic** (owned, capture — free but slow).

### B2B vs B2C — why the channel mix differs

- **B2B — few buyers, high value, long cycle** — You can name your buyer by **job title**, so **LinkedIn** dominates (only place to target "RevOps Manager at 200–2000-person firms"). High deal sizes justify expensive clicks. Long cycles + buying committees make attribution hard. Demand-*creation* and thought-leadership matter because so few are in-market now.
- **B2C — many buyers, low value, short cycle** — You target by **interest/behaviour**, so **Meta & Google** dominate (cheap mass reach). Low margins demand efficient **ROAS**; purchases are fast and individual, so attribution is comparatively easier. If someone posts on Instagram for their business, that's a B2C context.

### So where *should* you spend? A decision sequence

1. **Where are your buyers reachable?** *B2B decision-makers → LinkedIn. Broad consumers → Meta/Google. Don't fish where they aren't.*
2. **Is there existing demand to capture?** *If people already search for your category → fund Search first (cheapest path to revenue). If you're a new category nobody searches → you must create demand (social/video).*
3. **Which funnel stage is the gap?** *Thin top → create (social/video). Strong top but leaking at capture → search + retargeting.*
4. **Do the economics allow it?** *High deal size absorbs LinkedIn's expensive clicks; thin B2C margins need cheap, ROAS-positive Meta/Google.*
5. **Treat it as a portfolio, not a winner.** *Capture + create work together: social/video grows the pool, search harvests it. The real question isn't "which one" but "what mix" — and you can't tune the mix without seeing across all of them.*

> **⚠ The pain — The catch — and the #1 pain.** That last step is exactly where it breaks: each platform reports its own walled-garden numbers and over-credits itself, so you *cannot* compare LinkedIn vs Google vs Meta on a common revenue basis. That's the High-priority "where's my next dollar best spent?" pain — a **data gap**, and the cross-channel attribution problem M6 unpacks.

> **⚓ Loop back to the anchor —** The customer's real pain here isn't "I want a channel report" (a format). It's **"I'm afraid I'm wasting half my budget and can't prove where to shift it."** a narrow point tool answers it for one channel (LinkedIn). The unmet, higher-value version is answering it **across all channels at once** — which needs the flexible, cross-source engine that is Petavue's opening.

---

## Module 6 — Attribution, deep

*Attribution is one question:* **when a deal closes after many touches, who gets the credit?** *The answer you pick literally reshapes the budget (M5). Here are all the models, how each splits the credit, which funnel stage each one flatters, and why seasoned marketers half-distrust the whole exercise.*

### One journey, judged ten ways

Throughout, we use one account's five touches before a $20k deal. Every model below splits 100% of the credit across these same five touches differently.

- **T1 · LinkedIn ad** [Top]
- **T2 · Webinar** [Mid]
- **T3 · Nurture email** [Mid]
- **T4 · G2 review** [Mid]
- **T5 · Branded search** [Bottom]

> **Key — Read the credit split.** In each model below, watch how the credit slides from "all at the start" to "all at the end" to "spread out."

### Wait — why is this even hard? We can see the engagement

Fair challenge, and worth answering before the models. Measuring the **ad side** is easy — impressions, clicks, engagement per ad are right there. That is *not* the hard part. The hard part is the **join**: connecting that engagement to the revenue, which lives in a different system and is about a person who was **anonymous** when they engaged.

- **The ad platform knows:** "An **anonymous** someone engaged with Ad X."
- **The CRM knows:** "**Priya at Acme** became a $20k deal."

> **⚠ The pain — Two lists, no shared key.** You have *both halves*. Nothing links "the anonymous engager" to "Priya/Acme" — because on the ad side, nobody had a name yet. That missing link **is** the black box. It's not missing data — it's a missing *connection* between two datasets you fully possess.

> **Example — The guest-book analogy.** Your shop has a counter at each door logging *how many* people enter Door A (LinkedIn) vs Door B (Google) — but **not who**. Separately, your till logs *who bought*. You know 1,000 walked in and 10 bought, but you **can't tell which door the 10 buyers came through** — the door-counter never captured identity.

And even if you *could* join them, four things still keep it murky:

| Problem | Why it blocks attribution |
| --- | --- |
| **Many touches, no ground truth** | A buyer saw 6 ads + a webinar + a podcast. Which *caused* it? You can't rerun reality — so you must *guess* the split. (That guess = the ten models below.) |
| **Invisible touches** | The most persuasive ones (podcast, peer rec, a post read without clicking) leave *no record at all* — the dark funnel. |
| **Time lag** | Engagement now, purchase 3 months later — after cookies expire and new campaigns muddy the trail. |
| **Walled gardens** | LinkedIn, Google, Meta each show only *their own* engagement and each claim the *same* deal; they won't share data to dedupe. |

> **From the field — Why a point tool's trick works anyway.** a narrow point tool builds a join key at the **company** level — LinkedIn exposes *which companies* engaged, and the CRM has companies as accounts. So it links "Acme engaged" → "Acme became a deal" **without ever needing the person's name**. That's how it beats the anonymity — though it's still blind to dark-funnel and multi-touch nuance. (M8 dissects this whole data layer.)

### Single-touch models — credit one touch

Simplest, and the most misleading. They hand 100% to a single touch and ignore the rest.

**First-touch** — *credits Top*
- Split: T1 = 100%, all others = 0.
- All credit to whatever *created* awareness (the LinkedIn ad).
- ✅ Good for judging **demand creation** — what fills the top.
- ❌ Ignores everything that actually closed the deal.

**Last-touch** — *credits Bottom*
- Split: T5 = 100%, all others = 0.
- All credit to the final click (branded search). The default in most basic reports.
- ✅ Dead simple; fine for very short, single-touch journeys.
- ❌ The M5 disease — over-credits the harvester (search), buries the create channels that fed it.

**Last non-direct** — *credits Bottom*
- Split: like last-touch, but if the final touch is "Direct" (unlabelled), it skips back to the last *known* source (here T4 = 100%).
- ❌ Still single-touch — still ignores the journey.

### Multi-touch models — spread the credit

These share credit across touches. Fairer, and the right direction for B2B's many-touch journeys — but each makes a different assumption about *which* touches matter.

**Linear** — *credits all stages equally*
- Split: 20% / 20% / 20% / 20% / 20%.
- ✅ Simple, fair, acknowledges the whole journey.
- ❌ Treats a 2-second ad glance the same as a 30-minute demo. Not all touches are equal.

**Time-decay** — *leans Mid/Bottom*
- Split: 5% / 10% / 15% / 30% / 40% — more credit to recent touches, less to old ones.
- ✅ Rewards the touches near the decision; good for short cycles.
- ❌ Under-credits early awareness — punishes the create channels again.

**U-shaped (position-based)** — *credits Top + Bottom*
- Split: 40% first / 7% / 6% / 7% / 40% last — 40% to the first touch (created it), 40% to the last (closed it), 20% shared among the middle.
- ✅ Credits both demand *creation* and *capture* — a sensible default for many B2B teams.
- ❌ Assumes the middle nurture barely matters (often untrue).

**W-shaped** — *credits 3 milestones*
- Split: 30% first touch / 30% the touch that created the **lead/MQL** / 10% / 30% the touch that created the **opportunity**. Built for B2B funnels.
- ✅ Maps to the funnel's real milestones, not just position.
- ❌ More complex; needs clean stage data to know which touch hit which milestone.

**Full-path** — *3 milestones + the close*
- Split: 22% / 22% / 12% / 22% / 22% **close**. W-shaped plus credit to the **closing touch** — so it values sales' final push too. The most complete (and most data-hungry).

### The advanced two — and the B2B answer

- **Data-driven (algorithmic)** — Instead of a fixed rule, an algorithm looks across *thousands* of journeys and assigns credit by each touch's observed **marginal contribution** (journeys with vs without it). Used by Google/large platforms.
 - ✅ Most "fair" in theory.
 - ❌ A black box; needs huge data; still blind to the dark funnel.
- **Influence-based / incrementality** — A different question entirely. Not "who gets the slice?" but **"did being exposed make a deal more likely at all?"** — measured by comparing exposed vs unexposed groups (lift). This is what B2B (and a point tool's Lift Analysis) leans on.
 - ✅ Answers causation, survives the dark funnel (works at company level, no click needed).

> **From the field — why B2B drifts here.** Because B2B journeys are long, multi-person and mostly anonymous, splitting exact credit across touches is often false precision. So practitioners increasingly stop asking "what % did LinkedIn get?" and instead ask "**are deals that saw our ads more likely to close?**" (influence/lift) and "**how much pipeline did this campaign create?**" (sourced pipeline). Directional truth beats precise fiction.

### Which model, when

| Situation | Reasonable model |
| --- | --- |
| Short, single-touch journey (cheap B2C) | Last-touch (fine here) |
| You want to value demand *creation* | First-touch or U-shaped |
| Standard B2B with clear funnel milestones | W-shaped / Full-path |
| You need to prove ads *caused* revenue | Influence-based / incrementality |
| Huge data, want an algorithm to decide | Data-driven |

### Why every model is partly wrong: the 95-5 rule & dark funnel

- **The 95-5 rule** — Only ~**5%** of buyers are in-market at any moment; **95%** aren't ready yet. Most of your marketing's job is influencing that 95% for a future they'll act on *months* later — long after any tracking window, and impossible to tie to a click.
- **The dark funnel** — The most persuasive touches leave **no trackable record**: a podcast, a Slack-community recommendation, a peer's text, a LinkedIn post they read but didn't click. They surface later as "Direct" or "branded search" — so whatever channel *did* the persuading goes uncredited.

> **Key — The pragmatic patch — self-reported attribution.** Because tracking misses the dark funnel, many teams just **ask**: a "How did you hear about us?" field on the demo form. Imperfect and biased, but it often reveals influence (podcasts, communities, word-of-mouth) that *no* tracking model can see. Smart teams triangulate: tracked attribution *plus* self-reported *plus* incrementality — and trust the direction, not the decimals.

> **⚓ Loop back to the anchor —** Attribution is never the pain — it's the **means** to two pains: "prove marketing's worth" and "decide where to spend." Every model is an imperfect attempt, and the data layer (anonymity, dark funnel, walled gardens — M8) is *why* it stays imperfect. That permanent imperfection is exactly why attribution is a huge, valuable, never-fully-solved market — the one a narrow point tool sells into, and the one Petavue must navigate with eyes open.

---

## Module 7 — The analytics concept map

*You asked: is attribution the spinal cord of marketing analytics, or one concept among many? Answer: one among many. This module is the map of all the analysis types, organised by the question they answer — so you can place attribution (and everything else) precisely.*

### The real spine: four questions, rising in value

Every analytics concept is really answering one of four questions. They form a ladder — each rung is harder and worth more than the one below.

- **Descriptive** — **"What happened?"** — CPL was $50 last month; pipeline was $340k. Plain reporting & dashboards.
- **Diagnostic** — **"Why did it happen?"** — CPL rose because LinkedIn CPMs spiked and the new creative underperformed. Root-cause.
- **Predictive** — **"What will happen?"** — at this rate we'll hit 80% of target. Forecasting, scoring.
- **Prescriptive** — **"What should I do?"** — move $10k from Meta to LinkedIn and refresh creative B. Recommendations.

> **Key — Where almost everyone is stuck — and where the value is.** The overwhelming majority of BI tools and dashboards stop at **descriptive** ("here's what happened"). The leap to **diagnostic** ("why") is rare, hard, and exactly what an operator actually needs to act. This rung is Petavue's natural home — and it's why "why did our numbers change?" is an unsolved, high-value pain.

### The concept families — and where attribution sits

The named analysis types in GTM analytics. Notice attribution is **one row**, not the table.

| Concept | The question it answers | Funnel | Ladder rung |
| --- | --- | --- | --- |
| **Attribution** | Which touch gets credit for the revenue? | Full | Descriptive, Diagnostic |
| **Funnel / conversion analysis** | Where are we leaking between stages? | Full | Descriptive, Diagnostic |
| **Segmentation** | How do results differ by slice (industry, size, channel)? | Full | Descriptive |
| **Cohort analysis** | How do groups sharing a trait/start-date behave over time? | [Mid] [Post] | Diagnostic |
| **Benchmarking** | Is this number good or bad versus a reference? | Full | Descriptive (M9) |
| **Incrementality / experiment** | Did X actually *cause* the lift? | Full | Diagnostic |
| **Forecasting** | What will pipeline / revenue be? | [Bottom] | Predictive |
| **Lead / account scoring** | Who is likely to convert / is a good fit? | [Mid] | Predictive |
| **Unit economics** | Are we acquiring customers profitably? | Full [Post] | Descriptive, Diagnostic |
| **Pipeline / velocity analysis** | How much and how fast is moving toward revenue? | [Bottom] | Descriptive |

> **⚓ Loop back to the anchor — So is attribution the spinal cord? No.** The spine is the **funnel** (the journey) plus the **four-question ladder** (what/why/what-next/what-to-do). **Attribution is one important concept** hanging off that spine — the one obsessed over in *marketing measurement* specifically, because budget defence depends on it. But forecasting, scoring, diagnostics and unit economics matter just as much to the wider revenue team. Don't let attribution's loudness fool you into thinking it's the whole body.

### Principles from the field (not in textbooks)

These aren't metrics — they're the hard-won mental models experienced operators carry. The kind a veteran operator teaches on YouTube. Knowing these is what makes you sound like a practitioner, not a student.

- **Vanity vs actionable** — Impressions and clicks feel good and mean little. Always pull a number down to pipeline/revenue before trusting it.
- **Leading vs lagging** — MQLs are fast but gameable; revenue is slow but real. Judge by lagging, steer by leading.
- **Correlation ≠ causation** — Your "best" ads may just attract people who'd have bought anyway. Lift tests, not raw conversions, prove cause.
- **ICP fit > volume** — 200 junk leads are worth less than 5 right-fit accounts. Quality beats quantity at every stage.
- **The 95-5 rule** — Only ~5% are in-market now; most marketing is an investment in the 95% for later. Patience is the strategy.
- **Directional > precise** — Chasing a perfect attribution number is a trap. Be roughly right and decisive, not precisely wrong.
- **Garbage in, garbage out** — Every analysis is only as good as the CRM data under it. Dirty data quietly poisons every chart (M8).
- **Brand compounds** — Some effects (trust, recall) show up months later as "Direct" traffic. The slow-burn work rarely shows in this quarter's report.

> **⚓ Loop back to the anchor —** This map is your radar for the customer's *real* pains. Most pains live on the **diagnostic** rung ("why did it change?") where almost no tool plays — which is precisely Petavue's opening. When you read a narrow point tool, place each use case on this map: which concept, which rung, which funnel stage. You'll see a narrow point tool clusters at **descriptive attribution** for one channel — leaving the diagnostic, predictive and cross-channel territory wide open.

---

## Module 8 — The data layer & its blindspots

*Under every chart is a chain of systems passing data along — and it breaks at the seams. This module maps where visibility is lost and, crucially, root-causes each blindspot into* **data**, **process**, *or* **mechanism** *— because that diagnosis decides whether a product can fix it at all.*

### The chain — and where it snaps

Data is supposed to flow left to right, from the first ad to the boardroom dashboard. Every red seam is a place it leaks, distorts, or stops.

`Ad platforms (LinkedIn, Google, Meta)` → *[seam: anonymous · walled]* → `Website / analytics (GA, tracking)` → *[seam: cookies · identity]* → `MAP (HubSpot, Marketo)` → *[seam: handoff]* → `CRM (Salesforce)` → *[seam: hygiene]* → `Warehouse / BI (the dashboard)`

> **Key — The core truth.** The data you need almost always *exists somewhere* in this chain. The problem is it's **anonymous at the start**, **fragmented across boxes that don't share keys**, and **degraded by humans in the middle**. Visibility breaks not from too little data, but from **broken joins and broken discipline**.

### The blindspots, root-caused

Each blindspot gets a cause tag — **Data** (missing/anonymous/siloed), **Process** (human/workflow), **Mechanism** (plumbing not built) — and a verdict on whether a product can fix it.

| Blindspot | What it is | Cause | Product-fixable? |
| --- | --- | --- | --- |
| **Anonymity** | Ad/site engagement isn't tied to a named person until they identify themselves. | Data | **Partly** — resolve at company level (a point tool's trick) |
| **Identity resolution** | Stitching the same person/company across devices, touches, anonymous→known. | Data, Mech | **Partly** — hard, never perfect |
| **Walled gardens** | Each ad platform reports only its own data and self-credits; no cross-platform truth. | Data | **Partly** — unify what each will share; gaps remain |
| **Dark funnel** | The most persuasive touches (podcast, peer rec, unclicked post) leave no record. | Data | **Largely no** — only self-reported surveys help |
| **CRM hygiene** | Reps don't log sources, leave fields blank, enter late/optimistically. | Process | **No** — a tool can't fix a habit people won't keep |
| **Lookback & cycle length** | Tracking windows expire before a long B2B deal closes; touches fall off. | Data, Process | **Partly** — longer windows, but cookies die |
| **Tool silos** | The ad, MAP, CRM and BI systems aren't connected, so no end-to-end view. | Mechanism | **Yes** — integration/plumbing is buildable |
| **Model distortion** | The attribution model you chose skews which channel looks good (M6). | Mechanism | **Yes** — better methods/choice of model |

### The strategic split: data vs process

This is the most important takeaway in the module. Blindspots fall into two camps, and only one is a business opportunity for a product.

- **Fixable by a product** — Data & mechanism gaps: silos, model choice, company-level resolution, unifying what platforms share. These are **engineering/analysis problems**. Build the join, run the analysis, the blindspot shrinks.
- **NOT fixable by a product alone** — Process gaps: dirty CRM, reps not logging, the dark funnel. **No tool fixes a habit people won't keep, or captures a touch that left no trace.** These need behaviour change or are simply unknowable.

> **From the field — why attribution projects fail.** Teams buy a shiny attribution tool, point it at a CRM full of blank "source" fields and stale stages, and get garbage — then blame the tool. **Garbage in, garbage out.** The veterans know: data/mechanism problems are worth solving with software; process problems must be solved with discipline first. Selling software against a pure process problem is selling a cure for the wrong disease.

> **⚓ Loop back to the anchor —** Now the whole picture connects: the data layer is **why** attribution stays imperfect (M6), why narrow tools win by sidestepping it (a narrow point tool resolves at company level), and why some loud pains can't be sold against (pure process gaps). For Petavue the lesson is sharp: **aim at the data/mechanism/analysis blindspots a product can actually close** — especially the diagnostic "why" (M7) — and don't promise to fix what is really a process or dark-funnel problem. Knowing the difference is the strategy.

---

## Module 9 — Benchmarking & lookalikes

*Two words Samuel keeps using. Benchmarking gives a number a yardstick so you can judge it; lookalikes use your winners to find more like them. Both are about* comparison to a reference *— and both are everyday analysis types, like attribution.*

### Benchmarking: a number alone means nothing

> **Example — The hook.** Your LinkedIn ad has a **0.4% CTR**. Good or bad? You *cannot* answer that without a reference. 0.4% is great for some formats and terrible for others. **Benchmarking is the act of supplying that reference** so a raw number becomes a judgement.

There are three references you can measure against — and they answer different questions:

| Benchmark type | Compares against | Answers | Funnel |
| --- | --- | --- | --- |
| **Internal · historical** | Your own past (last month/quarter/year) | "Are we improving or sliding?" | Full |
| **Internal · cohort/segment** | Comparable groups inside your data (by source, industry, size) | "Which segments perform best for us?" | Full |
| **External · industry** | Peers / industry averages | "Are we good or bad versus the market?" | Full |

### Your read, made precise

You described benchmarking as: *"from past customer journeys, learn what worked — which lead backgrounds nurtured well to conversion, and which aren't worth chasing — then compare current pipeline against that."* That's exactly right, and it's actually **two concepts working together**:

- **Step 1 — Cohort/segment analysis** — Group past deals by a shared trait (industry, company size, source) and see which groups **converted well vs poorly**. This produces your **baseline** — e.g., "fintech accounts from LinkedIn close at 18%; sub-50-employee from cold email close at 2%."
- **Step 2 — Benchmark against it** — Now hold your **current pipeline** up to that baseline (average, median). Deals that look like your historical *winners* get prioritised; ones that look like historical *losers* get less ad/SDR effort. That's benchmarking driving allocation.

> **Key — Don't conflate the three.** **Cohort analysis** finds which groups perform. **Benchmarking** compares a number to a reference. **Lead scoring** (M7) predicts an individual's odds. Your instinct chained cohort → benchmark → prioritise — which is precisely how a good RevOps person reasons.

### Lookalikes: "find more like my winners"

A **lookalike** takes a **seed list** of your best customers/converters and finds *new* people or companies who **resemble** them — so you can target acquisition at people likely to behave the same way.

- **In ads (B2C-style)** — You upload your best buyers; Meta/Google build a "lookalike audience" of similar profiles and show your ads to them. Pure [Top] top-funnel targeting to scale acquisition efficiently.
- **In B2B (Samuel's sense)** — Take your best **accounts** and find **lookalike accounts** — companies with similar firmographics (industry, size, tech stack). This builds the target account list for ABM and outbound. Same idea, account-level.

> **Key — Why it depends on benchmarking.** A lookalike is only as good as the **seed**. To find "more like my winners," you first have to *know who your winners are* — which is cohort analysis + benchmarking. So lookalikes sit downstream of the comparison work: **understand your best, then clone the pattern.**

### What a point tool's benchmarks page is

a point tool's "Benchmarks" use case is the **external · industry** type: it shows how your LinkedIn-ad numbers (CTR, CPL, engagement) compare to peers, so a marketer can answer "is my 0.4% good?" It's a **descriptive, context-giving** use case (M7) — useful, low-risk, and the kind of thing that needs scale data a narrow point tool has from many customers.

> **From the field — benchmark with care.** Two traps veterans watch for: (1) **benchmarks are directional** — an "industry average" hides huge variation, so don't over-trust a single peer number; (2) **"best" is relative to your ICP** — a CTR that's great for enterprise may be poor for SMB. Benchmark against *comparable* things, or you'll chase the wrong target.

> **⚓ Loop back to the anchor —** Benchmarking and lookalikes are both **comparison engines** — and like attribution, they're only as good as the data layer underneath (M8). a narrow point tool offers benchmarking as a neat, scoped use case. The richer, unmet version — "benchmark *my* pipeline against *my own* historical winners across all channels, and tell me where to lean in" — is cohort + benchmark + diagnostics together, which points straight back at a flexible engine like Petavue.

---

## Module 10 — 20 customer-journey scenarios

*Theory sinks in when you've seen the shapes. Here are 20 real journeys — inception to closed-won/lost to renewal — covering ~95% of what actually happens. Each names the path and the* **measurement wrinkle** *that ties back to earlier modules.*

### The master map: one pipeline behind all 20 journeys

Every scenario below is a different route down this *same* river. Entry points are **tributaries** flowing in from the top (Paid ads · Organic/SEO · Content/webinar · Referral/partner · Free trial/demo); they merge into one pipeline that **narrows** as deals qualify, reaches **revenue**, then opens into a **retention** pool.

- Stages left to right: **AWARENESS → CONSIDERATION → DECISION → RETENTION**
- Metric milestones along the river: `Lead → MQL → SQL → Opportunity → Closed-Won` → Revenue → Retention & expansion
- Persona lanes: **Demand Gen / Marketing** (awareness→consideration) · **SDRs** (outreach & qualify) · **AEs** (close) · **Customer Success** (retention) · **RevOps & MarkOps** (data & process beneath all of it)

*Tributaries = every way a person enters; the river narrows as the funnel qualifies them; dots are metric milestones; the bars are the personas' lanes. The 20 journeys below are routes down this river.*

**Legend:** B2B · B2C · Won · Lost · Renew/Expand · 💡 the wrinkle

---

#### Scenario 1 — Inbound high-intent · B2B · Won
- **Person:** Raj · Head of Ops at a 300-person logistics firm. **Total journey: ~2 weeks.**
- **Path:** Google search "PM software" → **demo form** → AE → won (fast)
- **Journey:**
 1. *(Day 0)* **Actively searching** [Top] — Fed up with spreadsheets, Raj googles "project management software for ops teams." He is already in-market.
 2. *(+5 min)* **Clicks the ad** [Mid] — He clicks Lumen's Google search ad and lands on a page tailored to ops teams.
 3. *(+1 day)* **Books a demo immediately** [Bottom] — No nurturing needed; he fills the "book a demo" form the same minute.
 4. **Demo next day** [Bottom] — An AE demos to Raj and two teammates; they like the fit.
 5. *(+2 weeks)* **Closed-won in 2 weeks** [Bottom] — Short cycle, clean win.
- 💡 **The wrinkle:** Last-click hands Google 100% of the credit. But Raj only searched because a peer mentioned Lumen last month — an untracked touch.
- **What to learn:** High-intent inbound is the fast lane (M4) — yet even here last-click hides what created the demand.

#### Scenario 2 — Content nurture · B2B · Won
- **Person:** Mei · Marketing Ops at a SaaS startup. **Total journey: ~2 months.**
- **Path:** LinkedIn ad → download guide → email nurture → demo → won (slow)
- **Journey:**
 1. *(Day 0)* **Sees a value offer** [Top] — Mei sees a Lumen LinkedIn ad offering a free "Ops Analytics Playbook."
 2. *(same visit)* **Downloads the guide** [Mid] — She trades her email for it — now a known lead.
 3. *(+3 weeks)* **3 weeks of nurture** [Mid] — A 5-email sequence drips case studies and tips; she opens and clicks.
 4. *(+1 day)* **Books a demo** [Mid] — After the 4th email (a customer story), she books.
 5. *(+6 weeks)* **6-week evaluation → won** [Bottom] — A considered evaluation closes the deal.
- 💡 **The wrinkle:** First-touch credits the LinkedIn ad; last-touch credits the nurture email. They disagree completely — yet both genuinely mattered.
- **What to learn:** The textbook multi-touch journey (M6). Your model choice decides who looks like the hero.

#### Scenario 3 — Dark social · B2B · Won
- **Person:** Tom · RevOps lead at a B2B software company. **Total journey: ~2.5 months.**
- **Path:** Sees founder's posts/ads for weeks (no clicks) → branded search → demo → won
- **Journey:**
 1. *(Day 0)* **Reads, never clicks** [Top] — For two months Tom reads Lumen's founder's LinkedIn posts in his feed. He never clicks an ad or visits the site.
 2. *(+2 months)* **Mentions it internally** [Mid] — He drops "we should look at Lumen" in his team's Slack.
 3. *(+1 week)* **Googles the brand** [Mid] — Ready to evaluate, he googles "Lumen" and clicks the organic result.
 4. *(+3 days)* **Demo → won** [Bottom] — He converts quickly — he was already sold by the content.
- 💡 **The wrinkle:** Branded/organic search gets the credit. The two months of founder content that actually created the demand left no trackable record — the dark funnel.
- **What to learn:** The most influential channel here is the least measurable (M6, M8).

#### Scenario 4 — Outbound SDR · B2B · Won
- **Person:** Sara · VP Marketing at a mid-market firm. **Total journey: ~4 weeks.**
- **Path:** SDR cold LinkedIn + email → meeting → demo → won
- **Journey:**
 1. *(ongoing)* **Ambient ad exposure** [Top] — Sara has scrolled past Lumen ads in her feed for weeks; the name feels familiar.
 2. *(+2 days)* **Personalised outreach** [Mid] — An SDR, Jake, sends a LinkedIn note and email referencing her recent post.
 3. *(+1 day)* **Replies because it's familiar** [Mid] — The warm familiarity makes her reply and book a meeting.
 4. *(+3 weeks)* **Demo → won** [Bottom] — A strong demo closes it.
- 💡 **The wrinkle:** Sales logs this as "outbound sourced." But the ads pre-warmed her — marketing influenced the win and gets zero credit. The sourced-vs-influenced credit war in one deal.
- **What to learn:** Sourced vs influenced (M4) is a definition fight, not a data fight.

#### Scenario 5 — Referral · B2B · Won
- **Person:** Dan · Ops Director at a manufacturing company. **Total journey: ~1.5 weeks.**
- **Path:** A happy customer refers a peer → demo → won
- **Journey:**
 1. *(Day 0)* **A peer raves** [Mid] — Over coffee, Dan's friend Priya (a happy Lumen customer) tells him it changed her workflow.
 2. *(+2 days)* **Warm intro** [Bottom] — Dan asks for an intro; Priya connects him straight to her AE.
 3. *(+1 week)* **Fast win** [Bottom] — A quick demo, minimal doubt, closed-won.
- 💡 **The wrinkle:** The cheapest, fastest, highest-converting path — and completely invisible to ad attribution. Only the "How did you hear about us?" field (Dan typed "Priya referred me") captures it.
- **What to learn:** Self-reported attribution (M6) is the only way to see referrals.

#### Scenario 6 — Webinar / event · B2B · Won
- **Person:** Lena · Demand Gen Manager at a fintech. **Total journey: ~1 month.**
- **Path:** Registers for webinar → attends → SDR follow-up → won
- **Journey:**
 1. *(Day 0)* **Registers via an ad** [Top] — A LinkedIn ad invites her to a webinar, "Scaling Ops Analytics"; she signs up.
 2. *(+1 week)* **Attends live** [Mid] — She joins and asks a question in the Q&A.
 3. *(+1 day)* **SDR follow-up** [Mid] — Next day an SDR references her exact question.
 4. *(+3 weeks)* **Demo → won** [Bottom] — The relevance earns the meeting and the deal.
- 💡 **The wrinkle:** If the webinar registration source (the LinkedIn ad) was not captured, the report says "the webinar sourced it" and the ad gets nothing.
- **What to learn:** Offline/event touches only attribute if the entry source was labelled (M2).

#### Scenario 7 — Retargeting rescue · B2B · Won
- **Person:** Omar · Ops Analyst at a logistics startup. **Total journey: ~3 weeks.**
- **Path:** Visits site, leaves → retargeting ad → returns → demo → won
- **Journey:**
 1. *(Day 0)* **Arrives from a blog** [Top] — Omar reads an industry blog that links to Lumen; he browses, checks pricing, and leaves — not ready.
 2. *(+2 weeks)* **Followed by ads** [Mid] — For two weeks Lumen retargeting ads follow him around the web.
 3. *(+1 day)* **Clicks back** [Mid] — He clicks one and returns to the site.
 4. *(+1 week)* **Books demo → won** [Bottom] — Now ready, he converts.
- 💡 **The wrinkle:** Retargeting claims the conversion. But Omar already knew Lumen from the blog — retargeting only re-surfaced existing interest; it didn't create it.
- **What to learn:** Retargeting flatters itself; separate "created" from "re-surfaced" demand (M5).

#### Scenario 8 — PLG free trial · B2B · Won
- **Person:** Nina · founder of a small marketing agency. **Total journey: ~2 weeks.**
- **Path:** Signs up free → uses product → hits a limit → upgrades
- **Journey:**
 1. *(Day 0)* **A "try free" ad** [Top] — Nina sees a Lumen "start free" ad and signs up the same day.
 2. *(over 2 weeks)* **Uses it solo** [Mid] — Over two weeks she builds dashboards herself, with no salesperson involved.
 3. *(same time)* **Hits the limit** [Bottom] — The free tier caps at 3 dashboards; she needs more.
 4. *(same day)* **Self-serve upgrade** [Bottom] — She upgrades to paid in-app, never speaking to sales.
- 💡 **The wrinkle:** The real buying signal was product usage — the "aha" inside the tool. Ad analytics can't see that, so marketing attribution looks weak even though the motion worked.
- **What to learn:** In PLG the product is the salesperson; attribution shifts to usage signals.

#### Scenario 9 — Buying committee · B2B · Won
- **People:** Aisha (Ops Mgr) + Mark (VP) + Sam (Finance) at one account. **Total journey: ~2 months.**
- **Path:** Champion engages → loops in manager + finance → group demo → won
- **Journey:**
 1. *(Day 0)* **Champion engages** [Mid] — Aisha reads content and books a demo. She loves it.
 2. *(+1 week)* **Loops in the boss** [Mid] — She brings in Mark, the decision-maker, who googles Lumen himself.
 3. *(+1 week)* **Finance joins** [Mid] — Sam from finance reads a G2 review and checks pricing.
 4. *(+6 weeks)* **Group demo → security → won** [Bottom] — A group demo, a security review, and a negotiation close it.
- 💡 **The wrinkle:** Three people, one account. Person-level attribution credits only Aisha's touches — and misses Mark's search and Sam's G2 visit entirely. You must attribute at the account level.
- **What to learn:** B2B buys are committees — person-level tracking under-counts the truth.

#### Scenario 10 — Long enterprise cycle · B2B · Won
- **Person:** Carlos · Director at a 5,000-person enterprise. **Total journey: ~12 months.**
- **Path:** 12 months, 20+ touches across every channel → won
- **Journey:**
 1. *(Month 1)* **Webinar** [Top] — Carlos attends a Lumen webinar.
 2. *(ongoing, Months 1–12)* **Ambient ads** [Top] — He sees Lumen ads throughout the year.
 3. *(+3 months, Month 4)* **Conference booth** [Mid] — He chats with Lumen at a trade show.
 4. *(+4 months, Month 8)* **Exec dinner** [Mid] — An invite-only dinner builds the relationship.
 5. *(+2 months, Month 10)* **POC** [Bottom] — A proof-of-concept with his team.
 6. *(+2 months, Month 12)* **Procurement → won** [Bottom] — Legal and procurement finally close it.
- 💡 **The wrinkle:** Over 20 touches in a year. The tracking lookback window (often 90 days) expired nine months before close — the webinar and conference touches are simply gone from the record.
- **What to learn:** Long cycles outlive lookback windows; early-funnel work vanishes (M8).

#### Scenario 11 — Partner / marketplace · B2B · Won
- **Person:** Ruth · Ops lead at a HubSpot-using company. **Total journey: ~2 weeks.**
- **Path:** Finds via an integration listing / partner intro → demo → won
- **Journey:**
 1. *(Day 0)* **Browsing the marketplace** [Mid] — A HubSpot user, Ruth searches the app marketplace and finds Lumen's listing.
 2. *(+3 days)* **Installs and tries** [Mid] — She installs the integration and tests it on her data.
 3. *(+1 week)* **Books via the listing → won** [Bottom] — Impressed, she books a demo through the listing and signs.
- 💡 **The wrinkle:** This is partner-sourced (the HubSpot marketplace). Credit must be split between the partner channel and marketing — and it is frequently double-counted or mis-assigned.
- **What to learn:** Partner/ecosystem channels create credit-sharing headaches (M2 source).

#### Scenario 12 — Competitor switch · B2B · Won
- **Person:** Vik · Ops lead frustrated with a rival tool. **Total journey: ~1 week.**
- **Path:** Searches "Rival alternative" → comparison page → demo → won
- **Journey:**
 1. *(Day 0)* **Searches an alternative** [Top] — Vik googles "Asana alternative for ops teams."
 2. *(+1 day)* **Lands on a comparison page** [Mid] — Lumen's SEO comparison page ranks; he reads it.
 3. *(+2 days)* **Books demo → quick win** [Bottom] — Already high-intent, he converts fast.
- 💡 **The wrinkle:** Bottom-funnel SEO; cheap and last-click-friendly. The comparison content did the real work and is easy to attribute — the rare clean, harvestable win.
- **What to learn:** "Alternative" intent is gold: high intent, low cost, easy to measure (M5).

#### Scenario 13 — The lost deal · B2B · Lost
- **Person:** Hana · Ops Manager at a scale-up. **Total journey: ~2.5 months (lost).**
- **Path:** Demo → evaluation → goes dark → closed-lost
- **Journey:**
 1. *(Day 0)* **LinkedIn ad** [Top] — Hana clicks a Lumen ad.
 2. *(+1 week)* **Demo + evaluation** [Bottom] — She demos, likes it, and starts an evaluation.
 3. *(+3 weeks)* **Goes dark** [Bottom] — Her budget is frozen in a reorg; she stops replying.
 4. *(+1 month)* **Closed-lost** [Bottom] — Marked lost after two months.
- 💡 **The wrinkle:** This still consumed ad spend and AE time (a real cost per lost opportunity). And the reason — a budget freeze — is almost never logged, so no one can learn from it or re-engage her later.
- **What to learn:** "Won" is half the story; lost deals carry cost and lost learning.

#### Scenario 14 — Recycled lead · B2B · Won
- **Person:** Leo · Ops Director at a healthcare firm. **Total journey: ~10 months.**
- **Path:** Lead lost → nurtured 8 months → re-engages → won
- **Journey:**
 1. *(Year 1)* **Evaluates, picks a rival** [Mid] — Leo downloads a guide and demos Lumen, but chooses a competitor. Closed-lost.
 2. *(+1 month)* **8 months of nurture** [Mid] — He stays on the newsletter.
 3. *(+8 months)* **Re-engages** [Mid] — The competitor disappoints; a newsletter link pulls him back.
 4. *(+2 weeks)* **Demo → won** [Bottom] — Second time around, he buys.
- 💡 **The wrinkle:** An 8-month gap. Does credit go to the original guide (first touch) or the newsletter that reactivated him? Lookback windows can't span it, so it usually goes to the newsletter — under-crediting the original work.
- **What to learn:** Recycled leads break attribution windows (M8) and the sourced/influenced line (M4).

#### Scenario 15 — Ecommerce impulse · B2C · Won
- **Person:** Maya · a consumer scrolling Instagram. **Total journey: ~3 minutes.**
- **Path:** Instagram ad → instant purchase
- **Journey:**
 1. *(Day 0)* **Scrolling Instagram** [Top] — Maya sees an ad for a $40 insulated water bottle.
 2. *(+3 min)* **Buys in 3 minutes** [Bottom] — She clicks and checks out almost immediately.
- 💡 **The wrinkle:** A single-touch, minutes-long journey. Here last-click and ROAS work perfectly well — not every case is hard. Low-consideration B2C is the clean exception.
- **What to learn:** Match the attribution effort to the journey length (M6 "which model when").

#### Scenario 16 — Ecommerce considered · B2C · Won
- **Person:** Raj · a consumer buying running shoes. **Total journey: ~10 days.**
- **Path:** Meta ad (discovers) → researches → Google brand search → buys
- **Journey:**
 1. *(Day 0)* **Discovers via Meta** [Top] — A Meta ad introduces Raj to a shoe brand he'd never heard of.
 2. *(+1 week)* **Researches for a week** [Mid] — He reads reviews and compares options.
 3. *(+2 days)* **Branded search → buys** [Bottom] — He googles the brand name, clicks, and purchases.
- 💡 **The wrinkle:** Meta created the demand; Google merely captured the final click. Last-click credits Google and under-credits the Meta ad that actually sparked it — cross-channel mis-allocation.
- **What to learn:** The capture-vs-create trap (M5) shows up in B2C too.

#### Scenario 17 — Influencer / UGC · B2C · Won
- **Person:** Lily · follows a fitness creator. **Total journey: ~1 day.**
- **Path:** Sees a creator's post → buys with promo code
- **Journey:**
 1. *(Day 0)* **Trusted creator posts** [Top] — A creator Lily follows recommends a supplement.
 2. *(minutes)* **Trusts the recommendation** [Mid] — Because she trusts the person, she's effectively sold.
 3. *(+1 hour)* **Buys with a promo code** [Bottom] — She checks out using the creator's code.
- 💡 **The wrinkle:** Earned/dark — there is no tracked click. The purchase is only attributable via the promo code (or a "how did you hear?" prompt). Without those, it looks like "Direct."
- **What to learn:** Word-of-mouth/influencer is powerful and only visible via codes or self-report (M6, M8).

#### Scenario 18 — Abandoned-cart recovery · B2C · Won
- **Person:** Tom · a consumer buying a jacket. **Total journey: ~1 day.**
- **Path:** Adds to cart → leaves → retargeting + email → completes
- **Journey:**
 1. *(Day 0)* **Adds to cart, leaves** [Mid] — Tom adds a jacket but gets distracted and abandons checkout.
 2. *(+1 day)* **Recovery nudge** [Mid] — A retargeting ad plus a "you left something" email with 10% off arrive.
 3. *(+2 hours)* **Completes the purchase** [Bottom] — He returns and buys.
- 💡 **The wrinkle:** The recovery flow claims the conversion — but Tom had already shown buying intent by adding to cart. The flow recovered pre-existing intent; it didn't create the demand.
- **What to learn:** Recovery tactics over-credit themselves for intent that already existed.

#### Scenario 19 — Retention / repeat · B2C · Renew
- **Person:** Asha · an existing meal-kit subscriber. **Total journey: recurring.**
- **Path:** Existing customer → lifecycle email → repeat purchase / renewal
- **Journey:**
 1. *(Day 0)* **Lifecycle email** [Post] — Asha, an existing subscriber, gets a "your favourites are back" email.
 2. *(+1 month)* **Reorders** [Post] — She places another order.
- 💡 **The wrinkle:** This is retention, not acquisition — cheap and high-margin. Yet it is often excluded from CAC and attribution entirely, so its real value is under-counted.
- **What to learn:** Keeping a customer beats winning one (M4 flywheel) — but rarely shows in acquisition reports.

#### Scenario 20 — Expansion / upsell · B2B · Expand
- **Account:** Priya's company · an existing Lumen customer. **Total journey: ~6 months.**
- **Path:** Customer succeeds → usage signal → upsell more seats → expansion revenue
- **Journey:**
 1. *(Day 0)* **Heavy adoption** [Post] — Priya's team uses Lumen daily and hits the seat limit.
 2. *(+3 months)* **CS spots the signal** [Post] — Customer Success sees the usage spike and proposes more seats plus a premium tier.
 3. *(+3 months)* **Contract expands** [Post] — The account grows into a much larger deal.
- 💡 **The wrinkle:** The single biggest NRR driver — and it is product/CS-led, entirely outside the acquisition funnel marketers measure. None of this growth appears in any ad report.
- **What to learn:** Expansion revenue (M3 NRR) is huge and invisible to marketing attribution.

---

### The patterns across all 20

1. **Almost every real journey is multi-touch** and crosses the dark funnel. The clean single-touch case (15) is the exception, not the rule.
2. **Last-click lies in most of them** — it keeps crediting the harvester (search, retargeting) over the creator.
3. **The best-converting paths are the least trackable** — referral, dark social, PLG. Quality and visibility are inversely related.
4. **"Won" is only half the story** — lost, recycled, renewal and expansion (13, 14, 19, 20) carry enormous value and barely get measured.

> **⚓ Loop back to the anchor —** When a customer says "I can't see my customer journeys," *this* is the mess they mean — and the wrinkle column is *why* it hurts. a point tool's "Customer Journeys" use case tries to make a slice of this visible (the LinkedIn touches). Reading these 20, you can now judge precisely **which scenarios a narrow point tool illuminates and which it leaves dark** — the exact lens you need for the teardown.

---
