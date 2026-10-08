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
- Asheville GoLocal Card + Google Maps
- Orchestral Maneuvers in the Dark
- Biofeedback Play
- TouchBarpalooza
- Sorting Algorithms with Playing Cards
- TV-b-goner
- AI on Kindle
- SuperCollider studies

## Repository guide

- `index.html` — homepage, project tiles, and navigation
- `favicon.svg` — portfolio icon
- `golocal/` — project note for the Google Maps integration
- `tales-from-the-loop/` — toolkit, reusable assets, fonts and downloads
- `starfinder/` — Starfinder toolkit, source download, and direct link to a populated read-only Homebrewery example
- `IMAGE-SHOPPING-LIST.md` — wanted real screenshots and photographs
- `TODO.md` — design decisions and next work
- `tests/portfolio.test.mjs` — structural, script, and local-link tests
- `tests/check-links.mjs` — weekly audit of external links

## How it works

The homepage is static HTML, CSS, and JavaScript, hosted on GitHub Pages. Each project opens within the grid. Its fragment URL (`#project-...`) can be shared, and browser Back/Forward navigation restores the open project.

### Categorization and order

Projects use a space-separated `data-categories` attribute; a work can belong to several categories without appearing as separate tiles. Categories are chosen with the buttons above the grid, which update a shareable `?category=...` URL and hide irrelevant cards. If an open card does not match a new filter, it closes.

`data-rank` sets an editorial estimate of likely visitor interest: accessible web demos and useful tools are listed ahead of niche hardware experiments and works without published examples. This is a subjective opening hypothesis, not an audience measurement, and filtering retains that same relative order.

### Lifetime opens

A small ↗ count records tile openings, not pageviews and not unique visitors. The site reads counts using `GET /get` and increments only when a visitor opens a card using `GET /hit` from the public Abacus counter service, at `abacus.jasoncameron.dev`. The existing `udeudeude-portfolio-2026-v1` namespace is reused to retain any prior recorded counts. Counts are approximate, publicly writable, and dependent on an external service; failed requests simply hide numbers. Because the counter is hosted by a third party, browser connections to it expose ordinary network data such as IP address to that host. No visitor identities or profiles are stored by this site.

The layout preserves at least two columns on phones and uses equal-height closed cards.

### Development checks

With Node.js installed:

```sh
node tests/portfolio.test.mjs
```

GitHub Actions runs this on pushes and pull requests. A separate weekly workflow checks external links, reporting confirmed 404/410 responses as failures while treating rate limits and temporary network errors as inconclusive. Manual test runs are available through **Actions → Check portfolio links → Run workflow**.

## GoLocal installation

The Go Local Maps experiment previously generated a Google Maps Saved list of 413 mappable businesses in the `Go Local Card` list. The `golocal/` page tells iPhone visitors how to save a shared list and how to find an already-imported list in Google Maps. One-tap public installation requires the source account's actual shared-list URL; no such URL is stored here yet.

## Optional funding

The website and software remain free to explore, with no advertising, feature gates, or donation popups. Funding services can be evaluated separately. Do not publish a payment link until a real account is configured and the creator approves the wording.

## Content and credits

The works are the point. ChatGPT is one of the media used to make them.

Original and third-party graphics, text, licensed fonts, and material associated with other games and brands have their own terms. See the relevant project pages and the font license files under `tales-from-the-loop/fonts/`. This repository's public visibility should not be interpreted as a blanket license for all included content.
