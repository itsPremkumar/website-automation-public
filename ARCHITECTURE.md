# 🏗️ Architecture & Complete Guide — Website Automation Suite

> A self-improving, autonomous static-website engine (Hermes-style) for building,
> deploying, and continuously improving a portfolio of GitHub-Pages sites.
> This document is the **authoritative reference** for the project.

- **Public repo:** https://github.com/itsPremkumar/website-automation-public
- **Canonical reference (money-earning system):** https://github.com/itsPremkumar/Hermes-Full-Autonomous-Company
  (see `revenue/sample-website-template-website-automation.md`)

---

## 1. What this is

A two-part system:

| Part | Scripts | Purpose |
|------|---------|---------|
| **Deploy Engine** | `bot-deploy.js`, `deploy-single-site.js`, `deploy-empire-repos.js`, `menu.js` | Clone the master template → brand it → push to GitHub Pages |
| **Self-Improving Loop** | `self-improve.js`, `lib/measure.js`, `lib/improve.js`, `lib/content.js`, `lib/inject.js` | Measure a site → pick its weakest signal → make one reversible fix → deploy → log |

Together they turn **one template into many unique, SEO-ready, content-filled
sites that get better on their own every day.**

---

## 2. System diagram

```
                ┌─────────────────────────────────────────────┐
                │              niches.js (config)             │
                └───────────────┬─────────────────────────────┘
                                │  list of sites to build
                                ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  DEPLOY ENGINE                                                │
   │  bot-deploy.js → deploy-single-site.js → GitHub Pages         │
   │  lib/inject.js: fills SEO <title>/<meta>/OG + Monetag zone   │
   └───────────────────────────┬───────────────────────────────────┘
                                │  produces: sites/<slug>/
                                ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  SELF-IMPROVING LOOP  (cron: 0 3 * * *)                      │
   │                                                                │
   │   lib/measure.js  ──► {live, posts, meta, jsonld, sitemap}   │
   │          │                                                     │
   │          ▼                                                     │
   │   lib/improve.js (rules engine) ──► ONE weakest fix          │
   │          │                                                     │
   │          ├── lib/content.js  (if thin: add original posts)    │
   │          ├── patch <title>/<meta> from site-config.json       │
   │          ├── add JSON-LD structured data                      │
   │          └── write valid sitemap.xml                          │
   │          │                                                     │
   │          ▼                                                     │
   │   deploy-single-site.js (push) → IMPROVEMENT_LOG.md appended  │
   └────────────────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Deploy Engine
- **`niches.js`** — declare sites. Each entry: `name`, `slug`, `topic`, `color`,
  `repo`, optional `monetagZone`, `url`.
- **`bot-deploy.js`** — CLI entry (`npm run deploy -- <slug> [Name] [Desc] [Color] [Repo]`).
  Clones the template, writes `site-config.json`, runs `lib/inject.js`, deploys.
- **`deploy-single-site.js`** — creates the GitHub repo (if missing), enables Pages,
  pushes, verifies reachability.
- **`deploy-empire-repos.js`** — loops `niches.js` to build the whole "empire".
- **`lib/inject.js`** (`injectSite`) — replaces placeholders in the template with
  per-site SEO + the configurable Monetag zone. **No hardcoded ad IDs** — the
  published template uses `YOUR_MONETAG_ZONE_ID`; `injectSite` fills it.

### 3.2 Self-Improving Loop
- **`lib/measure.js`** — `measureSite()`: live reachability, GitHub stars, post
  count, empty title/description, JSON-LD presence, sitemap validity, CSS size.
  Public signals only; graceful without a token.
- **`lib/improve.js`** — `improveOnce()`: applies the **single weakest rule**
  (reversible, one change per run — the Hermes daily-loop invariant).
- **`lib/content.js`** — `generate()`: writes **original 800+ word posts** per
  niche into `input-data.json` (avoids the thin-content / AdSense-reject trap).
- **`self-improve.js`** — orchestrates measure → decide → improve → deploy → log
  for every site in `niches.js`. Deploy only fires if `.env` has a token.
- **`cron.example`** — `7 3 * * *  npm run loop >> logs/loop.log 2>&1`.

### 3.3 Template (`sites/common-website-template/`)
Static blog: `index.html`, `post.html`, `payment.html`, `404.html`,
`assets/css/style.css`, `assets/js/script.js`, `input-data.json`,
`site-config.json`, `sitemap.xml`, `robots.txt`. Content is rendered client-side
from `input-data.json` (fetch + render), with JSON-LD per post.

---

## 4. Honest money-earning model

This engine is a **legitimate publisher tool**. It does **not** manufacture money.
Realistic value chain (matches the canonical company repo's revenue playbook):

| Stage | Mechanism | Gate (human/algorithmic) |
|-------|-----------|---------------------------|
| 1. Build & host | GitHub Pages (free) | none |
| 2. Content | `lib/content.js` → original posts | quality bar (avoid thin content) |
| 3. Traffic | SEO + shareable URLs | **algorithmic** — not guaranteed |
| 4. Monetize | Monetag ad zone (AdSense fallback) | **ad-network approval** |
| 5. Payout | ad network → your account | **payment details + threshold** |

**No "guaranteed income."** The loop improves *system quality* (content, SEO,
sitemaps, structured data) — the inputs search engines reward. Revenue depends on
traffic and ad approval, which remain external gates. This is stated plainly in
the canonical repo's `revenue/` docs.

---

## 5. Security model

- **Secrets never committed.** `.env` is git-ignored; `.env.example` holds only
  placeholders. `SECURITY.md` documents the disclosure policy.
- **No third-party ad IDs in source.** The published template uses
  `YOUR_MONETAG_ZONE_ID`; your zone is supplied per-site at inject time.
- **Least-privilege token.** Use a fine-grained PAT with `repo` + Pages scope,
  stored only in local `.env`.
- The history was force-pushed clean (no leaked token in `git log`).

---

## 6. Quick start

```bash
git clone https://github.com/itsPremkumar/website-automation-public
cd website-automation-public
npm install
cp .env.example .env          # add your GitHub token (git-ignored)
```

### One-shot deploy
```bash
npm run deploy -- my-blog "My Blog" "Description" "#6366f1"
```

### Autonomous loop (after sites exist)
```bash
npm run content -- my-blog 5     # add 5 original posts
npm run loop                      # measure → improve → deploy → log
```
Add to crontab (see `cron.example`) for hands-off daily operation.

---

## 7. Status & verification

| Check | Result |
|-------|--------|
| `npm test` (all 8 scripts parse) | ✅ passing |
| Self-improve loop (local cycles) | ✅ ran: fixed title → desc → JSON-LD, all logged |
| Content generator | ✅ added 5+ original posts |
| No leaked token / third-party ad ID in source | ✅ verified |
| Live deploy via loop | ⏳ requires a valid token in `.env` |

The system is a **complete, secure, autonomous website template** — the
deploy + self-improve foundation is done; live deploy is one valid token away.

---

*Part of the Hermes-Full-Autonomous-Company reference stack: a second,
complete website template for the autonomous money-earning system (alongside
`sproutern`). See the canonical repo's `revenue/` for the full playbook.*
