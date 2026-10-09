import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const html = read('index.html');

const cards = [...html.matchAll(/<article\b[^>]*class="project [^"]+"[^>]*data-key="([^"]+)"[^>]*data-rank="(\d+)"[^>]*>([\s\S]*?)<\/article>/g)];
const keys = cards.map(card => card[1]);
const ranks = cards.map(card => Number(card[2]));
assert.ok(cards.length >= 10, 'Portfolio contains the curated project collection');
assert.equal(new Set(keys).size, keys.length, 'Project identifiers are unique');
assert.equal(new Set(ranks).size, ranks.length, 'Editorial ranks are unique');
assert.ok(!keys.includes('n-counter-dice'), 'Board-game-only prototype remains excluded');
for (const required of ['lighthouse', 'sorting-cards', 'anaglyph-friends', 'orchestral-maneuvers-dark', 'starfinder-homebrewery-toolkit']) {
  assert.ok(keys.includes(required), required + ' is still on the portfolio');
}
for (const [, key, rank, body] of cards) {
  assert.ok(body.includes('<button class="tile-toggle"'), key + ' has an accessible expansion button');
  assert.ok(body.includes('aria-expanded="false"'), key + ' declares initial closed state');
  assert.ok(body.includes('<div class="expand">'), key + ' has expansion content');
  assert.ok(body.includes('<h2>'), key + ' has a readable project name');
}
const anaglyph = cards.find(card => card[1] === 'anaglyph-friends')[3];
assert.ok(anaglyph.includes('https://anaglyph-and-friends.onrender.com/'), 'Hosted Anaglyph edition is linked');
for (const arch of ['intel', 'apple-silicon']) {
  assert.ok(anaglyph.includes('Anaglyph-and-Friends-' + arch + '.zip'), arch + ' Mac download remains available');
}
assert.ok(anaglyph.includes('not Apple-notarized'), 'Signing disclaimer remains');
assert.ok(html.includes('href="/golocal/"'), 'GoLocal has an actionable project note');
assert.ok(html.includes('href="/favicon.svg"'), 'Site links to its favicon');
for (const [key, filename] of [
  ['living-patterns', 'living-patterns-site.webp'],
  ['tv-b-goner', 'tv-b-goner.webp']
]) {
  const card = cards.find(m => m[1] === key)?.[3];
  assert.ok(card?.includes('/assets/screenshots/' + filename), key + ' includes a genuine running-site capture');
  assert.ok(fs.existsSync(new URL('assets/screenshots/' + filename, root)), key + ' screenshot exists');
}

for (const [key, image] of [
  ['moire-lab', 'moire-lab.webp'],
  ['tales-from-the-loop-toolkit', 'tales-from-the-loop-guide.webp'],
  ['starfinder-homebrewery-toolkit', 'starfinder-guide.webp']
]) {
  const card = cards.find(match => match[1] === key)?.[3];
  assert.ok(card?.includes('/assets/screenshots/' + image), key + ' uses an authentic browser screenshot');
}
for (const image of ['moire-lab.webp','moire-lab-interface.webp','moire-lab-barrier.webp','starfinder-guide.webp','tales-from-the-loop-guide.webp']) {
  assert.ok(fs.existsSync(new URL('assets/screenshots/' + image, root)), 'Captured screenshot exists: ' + image);
}

assert.ok(html.includes('abacus.jasoncameron.dev'), 'Persistent public click counter configured');
assert.ok(html.includes("projects.forEach(project => requestCount(project, 'get'))"), 'Read totals without incrementing them on page load');
assert.ok(html.includes("if (opening) requestCount(project, 'hit')"), 'Increment only when a tile opens');
assert.equal((html.match(/class="tile-count"/g) || []).length, cards.length, 'Every tile has one small counter');
assert.deepEqual(ranks, ranks.map((_, i) => i + 1), 'HTML starts in estimated audience order without layout reshuffling');
const filters = [...html.matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]);
const categorySet = new Set(filters);
assert.equal(categorySet.size, filters.length, 'Each filter is unique');
for (const category of ['all','asheville','tabletop','hardware','print','audio','visual','learning','recurring']) {
  assert.ok(categorySet.has(category), 'Category exists: ' + category);
}
const projectCategories = new Map([...html.matchAll(/<article class="project [^"]+" data-key="([^"]+)" data-rank="\d+" data-categories="([^"]+)"/g)]
  .map(m => [m[1], m[2].split(' ')]));
assert.equal(projectCategories.size, cards.length, 'Each card has declared categories');
for (const [key, assigned] of projectCategories) {
  assert.ok(assigned.length >= 1, key + ' has at least one category');
  for (const category of assigned) assert.ok(categorySet.has(category), key + ' has a valid category');
}
assert.ok(projectCategories.get('lighthouse').includes('tabletop'), 'LightHouse is tabletop-related');
assert.ok(projectCategories.get('sorting-cards').includes('tabletop'), 'Cards course is tabletop-related');
assert.ok(!projectCategories.get('touchbarpalooza').includes('tabletop'), 'TouchBar video games are not tabletop');
assert.ok(projectCategories.get('asheville-golocal-maps').includes('asheville'), 'GoLocal is Asheville-related');
assert.ok(projectCategories.get('orchestral-maneuvers-dark').includes('asheville'), 'Asheville FM is Asheville-related');
assert.ok(projectCategories.get('anaglyph-friends').includes('print') && projectCategories.get('anaglyph-friends').includes('visual'), 'Multi-category membership works');

assert.equal(cards.length, 18, 'All 18 curated projects are present');
assert.ok(!categorySet.has('devices'), 'Obsolete Devices category was removed');
assert.ok(!projectCategories.get('lighthouse').includes('hardware'), 'LightHouse is not in hardware-specific projects');
assert.ok(projectCategories.get('sorting-cards').includes('print'), 'Sorting with Cards is printable work');
assert.ok(projectCategories.get('living-patterns').includes('learning'), 'Living Patterns belongs in Learning and ideas');
for (const key of ['wisdom-watch', 'living-patterns', 'orchestral-maneuvers-dark']) {
  assert.ok(projectCategories.get(key).includes('recurring'), key + ' belongs to Recurring');
}
assert.ok(!projectCategories.get('escape-pod-cast').includes('recurring'), 'Podcast publishing utility is not itself recurring published content');
assert.ok(projectCategories.get('moire-lab').includes('visual') && projectCategories.get('moire-lab').includes('print'), 'Moiré Lab is visual and print-oriented');
assert.ok(projectCategories.get('pnp-o-matic').includes('tabletop') && projectCategories.get('pnp-o-matic').includes('print'), 'PnP-o-matic is for print-and-play');
assert.ok(projectCategories.get('escape-pod-cast').includes('audio'), 'Escape Pod Cast is in Sound');
const labels = [...html.matchAll(/<button class="filter-button"[^>]*data-filter="([^"]+)"[^>]*>([^<]+)/g)]
  .map(m => [m[1], m[2]]);
assert.equal(new Map(labels).get('hardware'), 'Hardware specific', 'Hardware label is correct');
assert.equal(new Map(labels).get('print'), 'Print', 'Print label is correct');
assert.equal(new Map(labels).get('audio'), 'Sound', 'Sound label is correct');
assert.equal(new Map(labels).get('recurring'), 'Recurring', 'Recurring label is correct');
const moire = cards.find(card => card[1] === 'moire-lab')?.[3];
const pnp = cards.find(card => card[1] === 'pnp-o-matic')?.[3];
const escape = cards.find(card => card[1] === 'escape-pod-cast')?.[3];
assert.ok(moire?.includes('https://moire-lab.onrender.com/'), 'Moiré Lab has direct live app link');
assert.ok(pnp?.includes('release is still pending'), 'PnP-o-matic makes no false release claim');
assert.ok(escape?.includes('app-v0.7.0') && !escape.includes('/audio/'), 'Escape Pod Cast links to Mac release, not an episode feed');

const curatedOrder = [
  'anaglyph-friends', 'print-pocketmod', 'lighthouse', 'wisdom-watch',
  'living-patterns', 'tales-from-the-loop-toolkit',
  'starfinder-homebrewery-toolkit', 'pnp-o-matic', 'moire-lab', 'asheville-golocal-maps',
  'orchestral-maneuvers-dark', 'escape-pod-cast', 'touchbarpalooza',
  'sorting-cards', 'biofeedback-play', 'tv-b-goner', 'ai-kindle',
  'supercollider'
];
assert.deepEqual(keys, curatedOrder, 'Preserve the intentional project order');
const populatedStarfinder = 'https://homebrewery.naturalcrit.com/share/u41Swqyrcj1W';
const starfinderCard = cards.find(card => card[1] === 'starfinder-homebrewery-toolkit')?.[3];
assert.ok(starfinderCard?.includes(populatedStarfinder), 'Starfinder tile directly links to a populated Homebrewery share');
const starfinderGuide = read('starfinder/index.html');
assert.ok(starfinderGuide.includes(populatedStarfinder), 'Starfinder guide links directly to populated Homebrewery share');
assert.ok(starfinderGuide.includes('Open blank Homebrewery'), 'Blank editor is retained as a secondary action');
const talesGuide = read('tales-from-the-loop/index.html');
for (const structuralClass of ['class="hero"', 'class="jump"', 'class="section-head"', 'class="two"', 'class="specimen"']) {
  assert.ok(starfinderGuide.includes(structuralClass), 'Starfinder uses toolkit-guide structure: ' + structuralClass);
  assert.ok(talesGuide.includes(structuralClass), 'Tales from the Loop supplies matching structure: ' + structuralClass);
}
for (const section of ['start','components','edit','example','backup','help','credits']) {
  assert.ok(starfinderGuide.includes('id="' + section + '"'), 'Starfinder toolkit has navigable section ' + section);
}
assert.ok(starfinderGuide.includes('Signal at Kestrel-9'), 'Starfinder includes actual source-derived example mission');
assert.ok(starfinderGuide.includes('Source → Clone to New'), 'Starfinder explains how to make an editable copy');
assert.ok(starfinderGuide.includes('downloads/starfinder-homebrewery-toolkit-v7.md'), 'Starfinder source download remains accessible');
assert.ok(!starfinderGuide.includes('homebrewery.naturalcrit.com/edit/'), 'Never publish an editable Homebrewery link');

assert.ok(html.includes("url.searchParams.set('category', category)"), 'Category selection is shareable');
assert.ok(html.includes('project.hidden = !show'), 'Irrelevant tiles hide when filtered');
const goLocal = read('golocal/index.html');
assert.ok(goLocal.includes('Save list') && goLocal.includes('Show on your map'), 'GoLocal shows iPhone add-to-Maps instructions');
assert.ok(goLocal.includes('public-facing profile') && goLocal.includes('dedicated Google account'), 'GoLocal recommends a privacy-safe project account');
assert.ok(goLocal.includes('does not') || goLocal.includes('not sharing a list from a personal Google account'), 'GoLocal warns against public personal-account lists');
assert.ok(goLocal.includes('the public project') || goLocal.includes('a direct installation button'), 'GoLocal does not claim public list has shipped');
for (const required of ['popstate', 'hashchange', 'Escape', 'aria-controls', 'scrollIntoView']) {
  assert.ok(html.includes(required), 'Expanded-card navigation includes ' + required);
}
for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  new vm.Script(script[1], {filename: 'index inline script'});
}

// Verify every local link and local media source resolves to a committed file.
// External sites are checked separately by the scheduled link-check workflow.
const pages = ['index.html', 'golocal/index.html', 'starfinder/index.html', 'tales-from-the-loop/index.html'];
let checked = 0;
for (const page of pages) {
  const source = read(page);
  assert.match(source, /<html lang="en">/, page + ' declares the language');
  assert.match(source, /<meta name="viewport"/, page + ' is mobile-aware');
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value || value[0] === '#' || /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) continue;
    const target = new URL(value, 'https://udeudeude.github.io/' + page);
    if (target.origin !== 'https://udeudeude.github.io') continue;
    let relative = decodeURIComponent(target.pathname).replace(/^\//, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const absolute = new URL(relative, root);
    assert.ok(fs.existsSync(absolute), page + ' has a working internal link: ' + value);
    checked++;
  }
}
console.log('Portfolio checks passed: ' + keys.length + ' unique project cards; ' + checked + ' local file targets; deep links, controls and script syntax verified.');
