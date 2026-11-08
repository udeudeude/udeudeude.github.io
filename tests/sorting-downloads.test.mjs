import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /data-key="sorting-cards"/);
assert.match(html, /releases\/tags\/learner-draft-0\.3/);
for (const file of [
  'sorting-algorithms-with-playing-cards.pdf',
  'sorting-algorithms-booklet-print.pdf',
  'sorting-algorithms-booklet-pages.pdf'
]) assert.ok(html.includes(file), file);
assert.match(html, /item\.state === 'uploaded'/);
assert.match(html, /release\.assets\.find/);
assert.match(html, /project\.prepend\(\.\.\.links\)/);
assert.match(html, /Read Draft 0\.3 manuscript/);
console.log('Conditional direct PDF download links verified');
