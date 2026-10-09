# Ude Projects

**Portfolio:** https://udeudeude.github.io/

A visual index of software, sound, publishing tools, browser experiments, and other works. Browse the grid, open a project, and follow the direct link to try, listen, read, or download wherever something is publicly available.

This is the **portfolio repository**, not the source repository for LightHouse or any other individual app.

## Works on the homepage

- Anaglyph & Friends
- Print as PocketMod
- LightHouse
- 1AM Wisdom Watch
- Living Patterns
- Tales from the Loop Homebrewery Toolkit
- Starfinder 2e Homebrewery Toolkit
- PnP-o-matic
- Moiré Lab
- Asheville GoLocal Card + Google Maps
- Orchestral Maneuvers in the Dark
- Escape Pod Cast
- TouchBarpalooza
- Sorting Algorithms with Playing Cards
- Biofeedback Play
- TV-b-goner
- AI on Kindle
- SuperCollider studies

## Repository guide

- `index.html` — homepage, project tiles, and navigation
- `favicon.svg` — portfolio icon
- `golocal/` — project note for the Google Maps integration
- `tales-from-the-loop/` — toolkit, reusable assets, fonts and downloads
- `starfinder/` — toolkit guide with a Tales from the Loop-style navigation layout, populated Homebrewery example, components, help and source download
- `assets/screenshots/` — real, compressed browser captures of Moiré Lab and two toolkit examples
- `scripts/capture-portfolio-screenshots.mjs` — headless browser capture, reproducible with GitHub Actions
- `.github/workflows/capture-screenshots.yml` — manual/automated screenshot capture and committing
- `IMAGE-SHOPPING-LIST.md` — wanted real screenshots and photographs
- `TODO.md` — design decisions and next work
- `tests/portfolio.test.mjs` — structural, script, and local-link tests
- `tests/check-links.mjs` — weekly audit of external links

## How it works

The homepage is static HTML, CSS, and JavaScript, hosted on GitHub Pages. Each project opens within the grid. Its fragment URL (`#project-...`) can be shared, and browser Back/Forward navigation restores the open project.

### Categorization and order

Projects use a space-separated `data-categories` attribute; a work can belong to several categories without appearing as separate tiles. Categories are chosen with the buttons above the grid, which update a shareable `?category=...` URL and hide irrelevant cards. If an open card does not match a new filter, it closes.

The current categories are **Asheville**, **Tabletop & RPGs**, **Hardware specific**, **Print**, **Sound**, **3D & images**, **Learning & ideas**, and **Recurring**. Recurring describes subscriptions and periodically published content (1AM Wisdom Watch, Living Patterns, and Orchestral Maneuvers in the Dark), not utilities that happen to create podcasts. LightHouse is tabletop but intentionally not Hardware specific. PnP-o-matic belongs to Print and tabletop, and Moiré Lab belongs to Print and 3D & images.

`data-rank` sets an editorial estimate of likely visitor interest: accessible web demos and useful tools are listed ahead of niche hardware experiments and works without published examples. This is a subjective opening hypothesis, not an audience measurement, and filtering retains that same relative order.

### Lifetime opens

A small ↗ count records tile openings, not pageviews and not unique visitors. The site reads counts using `GET /get` and increments only when a visitor opens a card using `GET /hit` from the public Abacus counter service, at `abacus.jasoncameron.dev`. The existing `udeudeude-portfolio-2026-v1` namespace is reused to retain any prior recorded counts. Counts are approximate, publicly writable, and dependent on an external service; failed requests simply hide numbers. Because the counter is hosted by a third party, browser connections to it expose ordinary network data such as IP address to that host. No visitor identities or profiles are stored by this site.

The layout preserves at least two columns on phones and uses equal-height closed cards. The three newer projects are clearly labeled: Moiré Lab is a live web workshop, PnP-o-matic is a development build without a public installer release, and Escape Pod Cast has a downloadable Mac release. Its personal podcast feed is deliberately not exposed.

### Development checks

With Node.js installed:

```sh
node tests/portfolio.test.mjs
```

GitHub Actions runs this on pushes and pull requests. A separate weekly workflow checks external links, reporting confirmed 404/410 responses as failures while treating rate limits and temporary network errors as inconclusive. Manual test runs are available through **Actions → Check portfolio links → Run workflow**.

## GoLocal installation

The Go Local Maps experiment previously generated a Google Maps Saved list of 413 mappable businesses in the `Go Local Card` list. The `golocal/` page tells iPhone visitors how to save a shared list and find a list already imported on their account. Google shares the Google Account profile name and picture along with a shared list, so the page warns against publishing the creator's personal list. One-tap public installation should instead use a separately maintained project Google account and verified view-only list. No public link is stored here yet.

## Optional funding

The website and software remain free to explore, with no advertising, feature gates, or donation popups. Funding services can be evaluated separately. Do not publish a payment link until a real account is configured and the creator approves the wording.

## Content and credits

The works are the point. ChatGPT is one of the media used to make them.

Original and third-party graphics, text, licensed fonts, and material associated with other games and brands have their own terms. See the relevant project pages and the font license files under `tales-from-the-loop/fonts/`. This repository's public visibility should not be interpreted as a blanket license for all included content.
