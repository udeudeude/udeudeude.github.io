import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const keys = [...html.matchAll(/data-key="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(keys, [
  'wisdom-watch', 'lighthouse', 'anaglyph-friends', 'tv-b-goner',
  'biofeedback-play', 'touchbarpalooza', 'living-patterns', 'asheville-golocal-maps',
  'sorting-cards', 'ai-kindle', 'supercollider', 'print-pocketmod',
]);
const tile = html.match(/<article[^>]*data-key="anaglyph-friends"[\s\S]*?<\/article>/)?.[0];
assert.ok(tile, 'Anaglyph tile remains present');
for (const architecture of ['intel', 'apple-silicon']) {
  assert.ok(tile.includes(`https://github.com/udeudeude/Anaglyph-and-Friends/releases/latest/download/Anaglyph-and-Friends-${architecture}.zip`));
}
assert.ok(tile.includes('https://anaglyph-and-friends.onrender.com/'), 'Keep hosted demo');
assert.ok(tile.includes('<summary>Mac download instructions</summary>'), 'Progressive instructions');
assert.ok(tile.includes('not Apple-notarized'), 'Disclose signing boundary');
assert.ok(tile.includes('older versions are not yet verified'), 'Do not invent old-macOS compatibility');
assert.ok(tile.includes('https://support.apple.com/102445'), 'Official Gatekeeper guidance');
for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
assert.ok(html.includes("toggle.setAttribute('aria-expanded', String(opening))"));
console.log('Portfolio tiles, Mac download targets, hosted link, instruction disclosure and script syntax passed');
