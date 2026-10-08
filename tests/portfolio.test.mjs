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
assert.ok(!html.includes('abacus.jasoncamer.dev'), 'No external sorting/tracking dependency');
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
