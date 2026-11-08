import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync('assets/analytics.js','utf8');
new vm.Script(script);
assert.match(script,/location\.pathname\.startsWith\('\/xyzzy'\)/);
assert.match(script,/project-open/);
assert.match(script,/project-link/);
assert.match(script,/source/);
assert.match(script,/launch/);
assert.match(script,/aria-expanded/);
assert.doesNotMatch(script,/localStorage|document\.cookie|input\.value/);
const exhibition=fs.readFileSync('index.html','utf8');
const workshop=fs.readFileSync('workshop/index.html','utf8');
for(const page of [exhibition,workshop]){
  assert.match(page,/cloud\.umami\.is\/script\.js/);
  assert.match(page,/assets\/analytics\.js/);
}
console.log('Analytics source and privacy checks passed');
