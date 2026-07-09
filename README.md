# Petavue — Claude-native demand generation

**How our go-to-market team uses [Claude Code](https://claude.com/claude-code) to research a company's real advertising strategy and compose a personalized landing page for it — at scale.**

[Petavue](https://petavue.com) is an AI-native company. We don't just build AI analytics for revenue teams — we run our own go-to-market engine on AI. This repository is one working piece of that engine, shared in the open to show *how* we actually do it.

Given a company (or a VC's portfolio, or a LinkedIn profile), the workflow:

1. **Researches** their live paid-ad strategy across LinkedIn, Meta, and Google
2. **Qualifies** them on ICP fit + real ad activity
3. **Composes** a uniquely-structured landing page — grounded in their *actual* ad themes

…all orchestrated end-to-end inside Claude Code.

## The idea: Claude is the orchestrator

The interesting part isn't the scripts — it's the division of labor:

- **Scripts do the structured extraction** — pull ad creatives, brand assets, and firmographics; score the ad-strategy tier.
- **Claude does the judgment** — sourcing, brand verification, ICP qualification, and, above all, *designing the narrative and writing the copy* of each page.

There is **no separate model API and no deployment step**. Claude authors each page *in-agent* as a JSON "page spec," and a composer renders it to a standalone HTML file. Claude is the CMS.

## How it works

Run it with a single command:

```
/demand-gen <company | investor | LinkedIn profile URL>
```

Under the hood (`src/`):

| Step | What it does |
|---|---|
| `fetch:brand` | Brandfetch → logo, colors, fonts, firmographics |
| `fetch:linkedin` · `fetch:meta` · `fetch:google` | Ad-library data via SearchApi (Playwright scrapers as fallback) |
| `merge:vision` | Fills Google's image-archived ad copy via a Chrome-vision step |
| `score` | Tiers the company's ad strategy (Heavy / Moderate / Light) |
| `render` | Composes the page spec into a standalone HTML page (with pre-render validation) |

The renderer is a **section composer, not a fixed template**: Claude picks and orders typed sections — `hero · homework · statement · capabilities · agentLoop · recommendations · comparison · calculator · pilot · cta` … — per company, so every page has a different information architecture. Same design system, different story; the target brand's color and font, Petavue's layout.

## What's in here (and what isn't)

This repo shares the **engine and the method**, not our outputs:

- ✅ **Included** — the code, the `/demand-gen` playbook, and a vendor-neutral GTM analytics primer (`context.md`)
- ❌ **Not included** (kept private) — the companies we've researched, the pages we've generated, our internal positioning, and any API keys

To run it yourself you'd bring your own `.env` (Brandfetch + SearchApi keys), `npm install`, and your own positioning context.

## Why we're sharing it

The most interesting thing about AI right now isn't the models — it's what a small team can *orchestrate* with them. This is a real slice of how we run demand generation at Petavue. If it's useful, or sparks an idea for your own GTM engine, that's the point.

---

Built with [Claude Code](https://claude.com/claude-code).
