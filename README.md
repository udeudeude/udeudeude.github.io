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
- Asheville GoLocal Card + Google Maps
- Orchestral Maneuvers in the Dark
- Escape Pod Cast
- TouchBarpalooza
- Sorting Algorithms with Playing Cards
- Biofeedback Play
- TV-b-goner
- AI on Kindle
- SuperCollider studies
- Kokoro Voice Lab

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

The current categories are **Asheville**, **Tabletop & RPGs**, **Hardware specific**, **Print**, **Sound**, **3D & images**, **Learning & ideas**, and **Recurring**. Recurring describes subscriptions and periodically published content (1AM Wisdom Watch, Living Patterns, and Orchestral Maneuvers in the Dark), not utilities that happen to create podcasts. LightHouse is tabletop but intentionally not Hardware specific. PnP-o-matic belongs to Print and tabletop, while Moiré Lab is temporarily held out of the public collection.

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

## Access and equipment filtering

The public homepage offers four independent **Hide projects that require** checkboxes: Mac, phone, printer, and special hardware. These work together with the interest categories. The qualifying project count is shown directly beneath the equipment controls.

Every tile declares a short equipment-requirements note. Optional output devices and secondary platform editions are not treated as prerequisites for using the online version. Equipment exclusions can be bookmarked with `?hide=mac,printer`. The former quick-action access-mode buttons have been removed to keep the page simple.

## Unlisted workbench

A separate, unlinked, `noindex` workspace is included for the creator. It mirrors curated projects from the public HTML and obtains additional **public** repositories from the GitHub API, falling back to a checked-in list when GitHub is unavailable. Repo issue/PR/action links appear alongside public demo links.

Moiré Lab is temporarily excluded from the public homepage but remains in the workbench as an additional repository with its web-app and source links. Previously saved per-project personal links remain attached using the same project identifier.

The workbench can add private repository projects and multiple **ChatGPT chat**, **Work**, **Codex**, and other direct URLs per tile. **Those links are entered by the creator and stored solely in that browser's localStorage, not in GitHub source.** The page offers export/import JSON backups to transfer them to another browser. There is no ChatGPT API or authenticated connector in this static webpage to enumerate the user's private conversations automatically.

Important limitations: an unlisted static GitHub Pages URL is not an authentication mechanism. Search-engine `noindex` is advisory, not security. Only the locally entered links and private project records avoid public hosting; any bundled HTML, JavaScript, and public repo names remain visible to anyone who discovers the route. Imported backups contain private links and must be protected.

### Workbench links and backlog

`xyzzy/project-metadata.json` supplements the 18 curated public tiles and additional public repositories with known **subscription feeds**, **live demos**, **app releases**, reference downloads and **sourced outstanding tasks**. The title of the tabletop-utility podcast is spelled **Th’die’s Cast**. The workbench provides direct RSS subscriptions for Living Patterns, Orchestral Maneuvers in the Dark, Th’die’s Cast and the experimental Play by Ear · GameCast.

The public portfolio is the starting point for any links already offered there. Workbench metadata adds useful repository-specific actions and pending future public-tile links without incorrectly labeling incomplete software as released. GitHub Issues and Releases pages remain available for repository-based work, even when an issue list has not been populated.

Every workbench tile displays a **Backlog / to-dos** section. Pre-filled items were summarized from the portfolio TODO and project README/BACKLOG notes on 2026-10-12; they are *not* a live issue synchronization. Where no public tasks are documented, the card explicitly says so. You can add tasks and tick off both the imported summaries and private tasks locally. Local task and completion records are stored separately in browser localStorage and are included in **version 2** of the workbench's private JSON backup. Older version 1 backups continue to import.

The workbench header contains a link back to the public homepage. The lengthy introductory and privacy-warning paragraphs have been removed; the site remains unlisted but not password-protected.

## October 15, 2026 site improvements

The public filter interface now provides **Clear filters** when a selection is active, plus a useful reset action when category and equipment settings produce zero matching projects. These controls preserve existing shareable URL behavior and keep all 18 curated projects in their editorial order.

The unlisted workbench search also matches project-action labels and sourced or locally entered backlog text. Checking or adding a task now preserves keyboard focus and scroll position after updating the local checklist. The weekly link checker decodes HTML ampersand entities before checking the actual browser target, avoiding misleading false 404s.

## October 22, 2026 unlisted-workbench audit

The unlisted workbench snapshot now covers **29 public GitHub repositories** (plus the 18 curated portfolio tiles, with overlaps deduplicated). Six newly added public repositories have workbench-only entries with reviewed project status, credible resource links, and source-based tasks: MPK249 Universal Map, MAZE · Seedling Rejuvenation, Sphero Laboratory, Escape Team Activate, Temporarily Leave the Universe, and Ortholinear (Key Scratch).

The workbench recognizes genuine repository media where it exists; the MAZE app icon and Ortholinear iPhone simulator screenshot are not fabricated preview images. Incomplete prototypes and hardware-dependent utilities are clearly labeled. No new repository was added to the public portfolio.

Importing a **version 1** personal workbench backup now retains any newer local to-do and completion data, while version 2 imports still replace that data after the user's confirmation. Personal links and task state remain browser-local. The automated external-link checker confirms reported 404 and 410 HEAD responses with GET before treating them as broken, without changing public-site links.

Public-site changes require editorial approval. Candidate promotions and link repairs were intentionally held back during this audit.

## Content and credits

The works are the point. ChatGPT is one of the media used to make them.

Original and third-party graphics, text, licensed fonts, and material associated with other games and brands have their own terms. See the relevant project pages and the font license files under `tales-from-the-loop/fonts/`. This repository's public visibility should not be interpreted as a blanket license for all included content.
