# Ude Projects

**Portfolio:** https://udeudeude.github.io/

A visual index of software, sound, publishing tools, browser experiments, and other works. Browse the grid, open a project, and follow the direct link to try, listen, read, or download wherever something is publicly available.

This is the **portfolio repository**, not the source repository for LightHouse or any other individual app.

## Works on the homepage

- 1AM Wisdom Watch
- LightHouse
- Anaglyph & Friends
- TV-b-goner
- Biofeedback Play
- TouchBarpalooza
- Living Patterns
- Orchestral Maneuvers in the Dark
- Asheville GoLocal Card + Google Maps
- Sorting Algorithms with Playing Cards
- AI on Kindle
- Print as PocketMod
- SuperCollider studies
- Tales from the Loop Homebrewery Toolkit
- Starfinder 2e Homebrewery Toolkit

## Repository guide

- `index.html` — homepage, project tiles, and navigation
- `favicon.svg` — portfolio icon
- `golocal/` — project note for the Google Maps integration
- `tales-from-the-loop/` — toolkit, reusable assets, fonts and downloads
- `starfinder/` — Starfinder toolkit and source download
- `IMAGE-SHOPPING-LIST.md` — wanted real screenshots and photographs
- `TODO.md` — design decisions and next work
- `tests/portfolio.test.mjs` — structural, script, and local-link tests
- `tests/check-links.mjs` — weekly audit of external links

## How it works

The homepage is static HTML, CSS, and JavaScript, hosted on GitHub Pages. Each project opens within the grid. Its fragment URL (`#project-...`) can be shared, and browser Back/Forward navigation restores the open project. The default order is set by editorial `data-rank` values rather than a third-party popularity service.

The layout preserves at least two columns on phones and uses equal-height closed cards.

### Development checks

With Node.js installed:

```sh
node tests/portfolio.test.mjs
```

GitHub Actions runs this on pushes and pull requests. A separate weekly workflow checks external links, reporting confirmed 404/410 responses as failures while treating rate limits and temporary network errors as inconclusive. Manual test runs are available through **Actions → Check portfolio links → Run workflow**.

## Content and credits

The works are the point. ChatGPT is one of the media used to make them.

Original and third-party graphics, text, licensed fonts, and material associated with other games and brands have their own terms. See the relevant project pages and the font license files under `tales-from-the-loop/fonts/`. This repository's public visibility should not be interpreted as a blanket license for all included content.
