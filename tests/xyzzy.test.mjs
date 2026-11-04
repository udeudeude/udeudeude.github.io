import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path,'utf8');
const html = read('xyzzy/index.html');
const script = read('xyzzy/workbench.js');
const workshop = read('workshop/index.html');
const portfolio = read('index.html');

new vm.Script(script, {filename:'xyzzy/workbench.js'});
assert.match(html, /<h1>xyzzy\.<\/h1>/);
assert.match(html, /data-view="workshop"[^>]*>Workshop<\/button>/);
assert.match(html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(html, /\.tile\.expanded\{grid-column:span 2\}/);
assert.match(script, /const expandedProjects = new Set\(\)/);
assert.match(script, /expandedProjects\.has\(project\.id\)/);
assert.match(script, /expandedProjects\.add\(project\.id\)/);
assert.match(script, /expandedProjects\.delete\(project\.id\)/);
assert.match(script, /disclosure\.setAttribute\('aria-controls',more\.id\)/);
assert.match(script, /workshopProjects\(\)\.catch/);
assert.match(script, /group:'workshop'/);
assert.match(script, /migrateProjectId\('repo-th-die-s-cast','thdies-cast'\)/);
assert.ok(!portfolio.includes('href="/xyzzy/"'));
assert.ok(!workshop.includes('href="/xyzzy/"'));
assert.match(workshop, /<h1>Workshop\.<\/h1>/);
assert.match(workshop, /<h2>Key Scratch<\/h2>/);
assert.ok(!workshop.includes('<h2>Ortholinear</h2>'));
console.log('xyzzy checks passed');
