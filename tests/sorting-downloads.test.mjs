import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /data-key="sorting-cards"/);
assert.doesNotMatch(html, /Read Draft 0\.3 manuscript/);
const marker = '/* Show only verified PDF assets belonging to the latest edition (0.5 or newer). */';
const start = html.indexOf(marker);
assert.ok(start !== -1, 'missing current-edition discovery code');
const end = html.indexOf('</script>', start);
const script = html.slice(start, end);
new vm.Script(script);
const names = [
  'Sorting-Algorithms-with-Playing-Cards.pdf',
  'Sorting-Algorithms-with-Playing-Cards-Booklet-LONG-EDGE.pdf'
];
const repository = 'udeudeude/Sorting-Algorithms-with-Playing-Cards';

async function run(tag, filenames, {prerelease = false} = {}) {
  const inserted = [];
  const container = {prepend: (...links) => inserted.push(...links)};
  const assets = filenames.map(name => ({
    name,
    state: 'uploaded',
    browser_download_url: 'https://github.com/' + repository + '/releases/download/' + tag + '/' + name
  }));
  const sandbox = {
    document: {
      querySelector: () => container,
      createElement: () => ({})
    },
    fetch: (url) => {
      assert.equal(url, 'https://api.github.com/repos/' + repository + '/releases/latest');
      return Promise.resolve({ok: true, json: () => Promise.resolve({tag_name: tag, assets, draft: false, prerelease})});
    }
  };
  vm.runInNewContext(script, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return inserted;
}
assert.equal((await run('v0.3', names)).length, 0, 'obsolete version may not be advertised');
assert.equal((await run('v0.5', names.slice(0, 1))).length, 0, 'partial release must not be advertised');
assert.equal((await run('v0.5', names, {prerelease: true})).length, 0, 'prerelease must not be advertised');
const current = await run('v0.5', names);
assert.equal(current.length, 2);
assert.equal(current[0].textContent, 'Read the illustrated book (PDF)');
assert.match(current[1].href, /Booklet-LONG-EDGE\.pdf$/);
assert.equal((await run('v0.6', names)).length, 2, 'future editions should appear without site edits');
assert.equal((await run('v1.0', names)).length, 2, 'major versions should appear without site edits');
console.log('Latest release gating, both PDF links and future-edition updates verified');
