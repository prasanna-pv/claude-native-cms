# Petavue Marketing Design System

The single source of truth for building pages that look and feel like the Petavue
marketing site — in this repo or in a separate project on the same domain.

Every value below is **extracted from the live CSS** (`style/colorography.css` and
`style/global.css`), not invented. When in doubt, those files win.

---

## 0. How to consume this

A new project gets visual consistency by reproducing three things: the **color
tokens**, the **font stack**, and the **layout + type + component rules**.

Fastest path (recommended): copy these files and link them in order —

```html
<link rel="stylesheet" href="/style/colorography.css">  <!-- color tokens (CSS variables) -->
<link rel="stylesheet" href="/style/global.css">        <!-- layout, type, buttons, navbar, footer -->
```

…and load the fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap">
```

If you'd rather hand-build in another stack, the tables below are the full spec.

### ⚠️ Do not use `typography.css`
The repo contains `style/typography.css` (Font: **Poppins**). It is **stale** —
linked by zero marketing pages and left over from the product app. The marketing
site uses **Geist / Instrument Sans / Inter / Geist Mono** (see §2). Ignore the
Poppins type scale; use the hierarchy documented here.

---

## 1. Color

All colors are CSS custom properties defined in `colorography.css` (`:root`).
Reference them as `var(--color-…)` — never hardcode hexes in new code.

### Primary (Blue) — brand + actions
| Token | Hex | Use |
|---|---|---|
| `--color-primary-50` | `#F5F8FF` | tint backgrounds, hover fills |
| `--color-primary-100` | `#E0EBFE` | subtle fills, borders |
| `--color-primary-300` | `#90A6EE` | dashed borders, muted accents |
| `--color-primary-500` | `#3661ED` | **primary brand** — buttons, links, eyebrows |
| `--color-primary-800` | `#052DAB` | primary button hover / pressed |
| `--color-primary` | → 500 | alias for primary-500 |

### Neutral (Grey) — text + surfaces
| Token | Hex | Typical use |
|---|---|---|
| `--color-neutral-50` | `#F8F9FC` | page/section background |
| `--color-neutral-100` | `#EEF0F7` | borders, table header fill, dividers |
| `--color-neutral-200` | `#D4D9EA` | borders, separators |
| `--color-neutral-300` | `#ADB2CE` | disabled text, light icons |
| `--color-neutral-400` | `#8E93AF` | muted text |
| `--color-neutral-500` | `#757A97` | secondary text |
| `--color-neutral-600` | `#52577A` | body text (muted), secondary button text |
| `--color-neutral-700` | `#3A3E57` | strong body text |
| `--color-neutral-800` | `#2D3044` | headings |
| `--color-neutral-900` | `#232532` | primary text / darkest surfaces |

### Accent (Purple)
`--color-accent-50 #E0E3FA` · `-100 #C0BAF3` · `-300 #A88BB9` · `-500 #B25CDE` · `-700 #6438C1`

### Semantic
| | Light | Base |
|---|---|---|
| Success | `--color-success-light #B6EAC7` | `--color-success #08BD50` |
| Warning | `--color-warning-light #FEE8B0` | `--color-warning #FBBF24` |
| Error | `--color-error-light #FDB9B9` | `--color-error #F93D3D` |

### Text aliases
`--color-text-primary #232532` · `--color-text-secondary #757A97` ·
`--color-text-disabled #ADB2CE` · `--color-text-link #3661ED`

### Shades & background
`--color-white #FFFFFF` · `--color-black #000000` · `--color-background #F5F8FF`

> Also defined in `colorography.css`: tag colors (`--color-tag-*`), misc colors
> (`--color-misc-*`), icon colors (`--color-icon-*`), and skeleton/loading
> placeholders (`--color-skeleton-base/-shimmer`). Use as needed.

---

## 2. Typography

### Font families
| Role | Stack | Weights |
|---|---|---|
| **Body / UI** | `'Inter', sans-serif` | 400, 500, 600, 700 |
| **Headings** | `'Geist', 'Instrument Sans'` | 500 |
| **Eyebrows / labels** | `'Geist Mono', monospace` | 500 (uppercase) |
| Secondary UI | `'Instrument Sans', sans-serif` | 400–700 |

Inter is the workhorse (~120 uses). Geist is the display/heading face. Geist Mono
is reserved for small uppercase eyebrow labels.

### Type hierarchy
Sizes are desktop; the responsive column shows the value at `≤768px`.

| Style | Class | Font | Size (→mobile) | Weight | Line / tracking | Color |
|---|---|---|---|---|---|---|
| Hero | `.hero h1` | Geist | 70px → ~40px | 500 | 130% / -2.4px | `#2D3044` (em → `#3661ED`) |
| Section heading | `.section-heading` | Geist | 48px → 28px | 500 | 125% / -0.96px | `#2D3044`, max-w 900px |
| Section subtitle | `.section-sub` | Inter | 16px | 400 | 1.7 | `--text-muted`, max-w 600px |
| Eyebrow label | `.section-label` | Geist Mono | 14px | 500 | uppercase, +0.05em | `--color-primary-500` |
| Hero subtitle | `.hero p.subtitle` | Inter | 16px | 400 | 1.7 | `--text-muted`, max-w 640px |
| Body | (default) | Inter | 16px | 400 | 1.6–1.7 | `#232532` / `#52577A` |

On `≤768px`: headings drop to 28px and switch to left-aligned automatically.

---

## 3. Spacing & layout

The page system has **three nested wrappers**, each owning one axis of spacing:

```html
<section class="my-section">      <!-- vertical rhythm (top/bottom padding) -->
  <div class="padding-global">    <!-- horizontal page gutter (5%) -->
    <div class="container-large">  <!-- centers + caps width at 80rem -->
      …content…
    </div>
  </div>
</section>
```

### Values
| Layer | Property | Value |
|---|---|---|
| `section` | padding top/bottom | **120px** (base) |
| `section` @ ≤768px | padding top/bottom | **64px** |
| `section` @ ≤480px | padding top/bottom | **48px** |
| `.padding-global` | padding left/right | **5%** |
| `.container-large` | max-width | **80rem (1280px)** |
| `.container-large` | margin | `0 auto` (centered) |
| `.container-large` | padding left/right | **20px** |
| `.container-large` | gap | **5rem** (only if it's a flex/grid parent) |

So horizontal spacing at any width = `5%` outer gutter **+** content centered at
≤1280px **+** `20px` inner pad. Vertical rhythm is the `section` padding, which
steps down 120 → 64 → 48 as the viewport narrows.

Section-specific backgrounds/padding (e.g. CTA = 80px, dark intro = 100px) override
`section` per-component, but the 120/64/48 default is the baseline.

---

## 4. Components

### Buttons
| | `.btn-primary` | `.btn-secondary` |
|---|---|---|
| Background | `#3661ED` | `#FFFFFF` |
| Text | white | `--color-neutral-600` |
| Border | `1px rgba(255,255,255,.1)` | `1px --color-neutral-200` |
| Padding | `.625rem 1.5rem` (10/24px) | same |
| Radius | `3.75rem` (60px — pill) | same |
| Font | Inter 16px / 400 / line 28px | same |
| Hover | bg → `#052DAB`, gap widens | bg → `--color-neutral-50`, gap widens |

```html
<a href="/book-a-demo" class="btn-primary">Book a demo</a>
<a href="/pricing" class="btn-secondary">See pricing</a>
```

A third variant, `.btn-demo`, is the navbar CTA button (defined in `global.css`).

### Section header trio
```html
<div class="section-label">The problem</div>     <!-- eyebrow -->
<h2 class="section-heading">Your headline</h2>     <!-- title -->
<p class="section-sub">Supporting copy.</p>        <!-- subtitle -->
```
Add `center-text` to any of them to center. Wrap a centered eyebrow in
`.label-center-wrap` for correct alignment.

### Hero
`.hero` is a full-height (`100vh`), centered, `#F8F9FC` block with two blurred
radial-gradient glows (purple top-left, blue top-right). Children: `.hero-badge`
(spinning gradient pill), `h1`, `p.subtitle`, `.hero-ctas` (button row).

### Navbar & footer (runtime-injected)
Not written into each page. `js/components.js` fetches `/components/navbar.html`
and `/components/footer.html` and injects them into placeholder divs, then wires
the menu, dropdowns, and dark/light theme sync. `js/main.js` adds scroll behavior
(the `nav-scrolled` class).

```html
<body>
  <div id="navbar-placeholder"></div>
  …sections…
  <div id="footer-placeholder"></div>
  <script src="/js/components.js"></script>
  <script src="/js/main.js"></script>
</body>
```
Flags: `<html data-base="…">` prefixes the component fetch path; `<body data-nav-dark>`
(or `data-nav-dark` on a section) forces/toggles the dark navbar variant.

### Border radius (no tokens — conventions)
- Pills / buttons / badges: `60px`–`100px`
- Cards / media / boxes: `12px`–`16px`
- Tables: `12px`

---

## 5. Responsive breakpoints

| Breakpoint | What changes |
|---|---|
| `≤991px` | grids 3→2 col; navbar collapses to hamburger menu |
| `≤768px` | `section` padding → 64px; headings → 28px, left-aligned |
| `≤480px` | `section` padding → 48px; tightest layout |

---

## 6. New-page boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page title — Petavue</title>
  <meta name="description" content="…">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">

  <link rel="stylesheet" href="/style/colorography.css">
  <link rel="stylesheet" href="/style/global.css">
  <link rel="stylesheet" href="/style/your-page.css">  <!-- page-specific overrides -->

  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap">
</head>
<body>
  <div id="navbar-placeholder"></div>

  <section class="page-hero">
    <div class="padding-global"><div class="container-large">
      <div class="section-label">Eyebrow</div>
      <h2 class="section-heading">Headline goes here</h2>
      <p class="section-sub">Supporting copy.</p>
      <div class="hero-ctas">
        <a href="/book-a-demo" class="btn-primary">Book a demo</a>
        <a href="/pricing" class="btn-secondary">See pricing</a>
      </div>
    </div></div>
  </section>

  <!-- more sections, same padding-global / container-large pattern -->

  <div id="footer-placeholder"></div>

  <script src="/js/components.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>
```

---

## 7. Rules of thumb
1. **Tokens, not hexes.** Use `var(--color-…)` everywhere.
2. **Every section uses the three-wrapper pattern** (`section > .padding-global > .container-large`).
3. **Vertical spacing comes from `section`; horizontal from `.padding-global` + `.container-large`.** Don't add page-edge margins by hand.
4. **Headings = Geist, body = Inter, eyebrows = Geist Mono.** Never Poppins.
5. **Buttons are pills** (`.btn-primary` / `.btn-secondary`).
6. **Navbar/footer are injected** by `components.js` — copy `components/*.html` + the two JS files; don't re-hardcode them per page.
