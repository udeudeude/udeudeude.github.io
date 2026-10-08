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
assert.ok(html.includes('abacus.jasoncameron.dev'), 'Persistent public click counter configured');
assert.ok(html.includes("projects.forEach(project => requestCount(project, 'get'))"), 'Read totals without incrementing them on page load');
assert.ok(html.includes("if (opening) requestCount(project, 'hit')"), 'Increment only when a tile opens');
assert.equal((html.match(/class="tile-count"/g) || []).length, cards.length, 'Every tile has one small counter');
assert.deepEqual(ranks, ranks.map((_, i) => i + 1), 'HTML starts in estimated audience order without layout reshuffling');
const filters = [...html.matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]);
const categorySet = new Set(filters);
assert.equal(categorySet.size, filters.length, 'Each filter is unique');
for (const category of ['all','asheville','tabletop','devices','print','audio','visual','learning']) {
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
const curatedOrder = [
  'anaglyph-friends', 'print-pocketmod', 'lighthouse', 'wisdom-watch',
  'living-patterns', 'tales-from-the-loop-toolkit', 'starfinder-homebrewery-toolkit',
  'asheville-golocal-maps', 'orchestral-maneuvers-dark', 'biofeedback-play',
  'touchbarpalooza', 'sorting-cards', 'tv-b-goner', 'ai-kindle', 'supercollider'
];
assert.deepEqual(keys, curatedOrder, 'Preserve the intentional project order');
const populatedStarfinder = 'https://homebrewery.naturalcrit.com/share/u41Swqyrcj1W';
const starfinderCard = cards.find(card => card[1] === 'starfinder-homebrewery-toolkit')?.[3];
assert.ok(starfinderCard?.includes(populatedStarfinder), 'Starfinder tile directly links to a populated Homebrewery share');
const starfinderGuide = read('starfinder/index.html');
assert.ok(starfinderGuide.includes(populatedStarfinder), 'Starfinder guide links directly to populated Homebrewery share');
assert.ok(starfinderGuide.includes('Open blank Homebrewery'), 'Blank editor is retained as a secondary action');
assert.ok(!starfinderGuide.includes('homebrewery.naturalcrit.com/edit/'), 'Never publish an editable Homebrewery link');

assert.ok(html.includes("url.searchParams.set('category', category)"), 'Category selection is shareable');
assert.ok(html.includes('project.hidden = !show'), 'Irrelevant tiles hide when filtered');
const goLocal = read('golocal/index.html');
assert.ok(goLocal.includes('Save list') && goLocal.includes('Show on your map'), 'GoLocal shows iPhone add-to-Maps instructions');
assert.ok(goLocal.includes('has not yet been published here'), 'GoLocal is transparent about missing public share URL');
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
