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
assert.ok(html.includes('id="clear-filters"') && html.includes('id="empty-results"'),'Portfolio offers recovery from restrictive filters');
assert.ok(html.includes('resetEmpty.addEventListener'),'Empty-state filter reset is interactive');

assert.ok(/\.gallery img\{[^}]*height:auto/.test(html), 'Gallery images override intrinsic pixel height from HTML attributes');
assert.ok(/\.gallery img\{[^}]*object-fit:contain/.test(html), 'Gallery images show the whole screenshot without destructive cropping');
assert.ok(/@media\(max-width:650px\)[\s\S]*?\.gallery\{grid-template-columns:minmax\(0,1fr\)\}/.test(html), 'Gallery uses one readable column on phones');

assert.ok(html.includes('/assets/screenshots/anaglyph-web.webp'), 'Anaglyph has a real hosted interface screenshot');
assert.ok(fs.existsSync(new URL('assets/screenshots/anaglyph-web.webp', root)), 'Anaglyph screenshot exists');

assert.ok(html.includes('/assets/screenshots/lighthouse-web.webp'), 'LightHouse includes genuine app screenshot');
assert.ok(fs.existsSync(new URL('assets/screenshots/lighthouse-web.webp', root)), 'LightHouse screenshot file exists');

for (const [key, filename] of [
  ['living-patterns', 'living-patterns-site.webp'],
  ['tv-b-goner', 'tv-b-goner.webp']
]) {
  const card = cards.find(m => m[1] === key)?.[3];
  assert.ok(card?.includes('/assets/screenshots/' + filename), key + ' includes a genuine running-site capture');
  assert.ok(fs.existsSync(new URL('assets/screenshots/' + filename, root)), key + ' screenshot exists');
}

for (const [key, image] of [
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

assert.equal(cards.length, 20, 'All 20 currently curated projects are present');
assert.ok(!categorySet.has('devices'), 'Obsolete Devices category was removed');
assert.ok(!projectCategories.get('lighthouse').includes('hardware'), 'LightHouse is not in hardware-specific projects');
assert.ok(projectCategories.get('sorting-cards').includes('print'), 'Sorting with Cards is printable work');
assert.ok(projectCategories.get('living-patterns').includes('learning'), 'Living Patterns belongs in Learning and ideas');
for (const key of ['wisdom-watch', 'living-patterns', 'orchestral-maneuvers-dark']) {
  assert.ok(projectCategories.get(key).includes('recurring'), key + ' belongs to Recurring');
}
assert.ok(!projectCategories.get('escape-pod-cast').includes('recurring'), 'Podcast publishing utility is not itself recurring published content');
assert.ok(!keys.includes('moire-lab'), 'Moiré Lab remains outside the public exhibition');
const adventure = cards.find(card => card[1] === 'temporarily-leave-the-universe')?.[3];
assert.ok(adventure?.includes('https://udeudeude.github.io/Temporarily-Leave-the-Universe/'), 'Adventure has direct browser-play link');
assert.ok(adventure?.includes('assets/screenshots/temporarily-leave-universe-green.svg') && adventure?.includes('assets/screenshots/temporarily-leave-universe-purple.svg'), 'User-inspired visual previews are present');
for (const p of ['assets/screenshots/temporarily-leave-universe-green.svg','assets/screenshots/temporarily-leave-universe-purple.svg']){
  assert.ok(fs.existsSync(new URL(p, root)),p + ' image exists');
}
assert.ok(!html.includes('data-access-filter='), 'Redundant access-mode buttons are removed');
assert.ok(!html.includes('filter-tip'), 'Equipment explanation paragraph removed');
assert.ok(html.indexOf('id="filter-summary"') > html.indexOf('data-exclude="hardware"'), 'Qualifying-project count appears beneath equipment checkboxes');
const desiredCategoryOrder = ['all','recurring','visual','tabletop','print','audio','hardware','asheville','learning'];
assert.deepEqual([...html.matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]),desiredCategoryOrder,'Category button order matches the curated sequence');
assert.match(html, /<a class="mark" href="\/">Ude<\/a>/,'Brand is concise');
assert.match(html, /<h1>Works &amp; experiments\.<\/h1>/,'Header contains one meaningful headline');
assert.ok(!html.slice(html.indexOf('<header class="wrap">'),html.indexOf('</header>')).includes('Software, media, objects, experiments.'),'Redundant visible intro removed');

assert.ok(projectCategories.get('pnp-o-matic').includes('tabletop') && projectCategories.get('pnp-o-matic').includes('print'), 'PnP-o-matic is for print-and-play');
assert.ok(projectCategories.get('escape-pod-cast').includes('audio'), 'Escape Pod Cast is in Sound');
const labels = [...html.matchAll(/<button class="filter-button"[^>]*data-filter="([^"]+)"[^>]*>([^<]+)/g)]
  .map(m => [m[1], m[2]]);
assert.equal(new Map(labels).get('hardware'), 'Hardware specific', 'Hardware label is correct');
assert.equal(new Map(labels).get('print'), 'Print', 'Print label is correct');
assert.equal(new Map(labels).get('audio'), 'Sound', 'Sound label is correct');
assert.equal(new Map(labels).get('recurring'), 'Recurring', 'Recurring label is correct');
const pnp = cards.find(card => card[1] === 'pnp-o-matic')?.[3];
const escape = cards.find(card => card[1] === 'escape-pod-cast')?.[3];
assert.ok(pnp?.includes('release is still pending'), 'PnP-o-matic makes no false release claim');
assert.ok(escape?.includes('app-v0.7.0') && !escape.includes('/audio/'), 'Escape Pod Cast links to Mac release, not an episode feed');

const voiceLabCard = cards.find(card => card[1] === 'lewis-voice-lab')?.[3];
assert.ok(voiceLabCard?.includes('https://udeudeude.github.io/kokoro-voice-lab/'), 'Cache-free Kokoro Voice Lab is discoverable from the home page');
assert.ok(projectCategories.get('lewis-voice-lab').includes('audio'), 'Voice Lab is classified under Sound');
assert.ok(projectCategories.get('lewis-voice-lab').includes('tabletop'), 'Voice Lab is relevant to tabletop production');
const lab = read('voice-lab/index.html');
const freshLab=read('kokoro-voice-lab/index.html');
assert.ok(freshLab.includes('src="/voice-lab/app.js?rev=voice-lab-precise-v1"'), 'Cache-free entry loads current shared app JS');
assert.ok(freshLab.includes('id="languageSelect"') && freshLab.includes('id="genderSelect"'), 'Fresh entry exposes both independent Kokoro filters');

const recipes = JSON.parse(read('voice-lab/presets/saved-user-recipes.json'));

const voiceCatalog = JSON.parse(read('voice-lab/voice-catalog.json'));
const browserJS = read('voice-lab/app.js');
const allVoices = voiceCatalog.groups.flatMap(group => group.voices.map(voice => ({...voice,groupCode:group.code})));
assert.equal(voiceCatalog.groups.length,9,'All nine Kokoro language/accent families are listed');
assert.equal(allVoices.length,54,'All 54 native Kokoro speakers are catalogued');
assert.equal(new Set(allVoices.map(v=>v.id)).size,54,'Voice IDs are unique');
assert.ok(allVoices.every(v=>v.id.startsWith(v.groupCode+v.gender+'_')),'Native voice identifiers match language and profile');
assert.ok(lab.includes('id="languageSelect"') && lab.includes('id="genderSelect"') && lab.includes('id="voiceSelect"'),'Language, gender and speaker have independent selectors');
assert.ok(lab.includes('All languages') && lab.includes('All genders'),'Unrestricted filter choices exist');
assert.ok(browserJS.includes("const language = $('languageSelect').value;") && browserJS.includes("const profile = $('genderSelect').value;"),'Voice selection respects both facets independently');
assert.ok(browserJS.includes("language==='all'||language===group.code") && browserJS.includes("profile==='all'||voice.gender===profile"),'No forced language-first or gender-first dependency');
assert.ok(browserJS.includes('loadLibraryVoice') && browserJS.includes('voice-samples/manifest.json'),'Browser loads pre-rendered genuine Kokoro voice recordings');
assert.ok(allVoices.some(v=>v.id==='bm_lewis'),'Lewis remains selectable');
assert.ok(browserJS.includes('const language = $(\'languageSelect\').value;') && browserJS.includes('const profile = $(\'genderSelect\').value;'),'Both filters are used to derive the voice selection');
assert.ok(browserJS.includes("initializeVoiceBrowser().then(ready=>") && browserJS.includes('browseVoices'),'The voice browser initializes and supports previous/next');
assert.ok(browserJS.includes("await decodeOriginal(bytes,info.voice.name"),'Selecting a voice feeds the existing audio editor');
assert.ok(read('voice-lab/sw.js').includes('kokoro-voice-lab-shell-v8'),'Updated mobile app shell cache is used');
assert.ok(read('voice-lab/sw.js').includes('fetch(req).then(response=>'),'Live interface is fetched network-first to prevent stuck older versions');
assert.ok(lab.includes('app.js?rev=voice-lab-precise-v1'),'Current JavaScript bypasses stale Safari service-worker asset caches');
assert.ok(lab.includes('style.css?rev=voice-lab-precise-v1'),'Current stylesheet bypasses stale Safari service-worker asset caches');
assert.ok(!lab.includes('release-marker') && !freshLab.includes('release-marker'),'Unnecessary edition labels are absent');
assert.ok(lab.includes('id="voiceAvailability" class="sr-only"'),'The specific recording availability counter is visually hidden');
assert.ok(lab.includes('<div class="source-grid">') && freshLab.includes('<div class="source-grid">'),'Original audio selection and upload controls remain visible');
assert.ok(!lab.includes('<footer>') && !freshLab.includes('<footer>'),'Repetitive app footer is removed');
assert.ok(lab.includes('01 <span>Listen & compare') && freshLab.includes('01 <span>Listen & compare'),'Original descriptive section headings restored');
assert.ok(lab.includes('What am I hearing?') && freshLab.includes('What am I hearing?'),'Original voice reference explanations restored');
assert.ok(lab.includes('id="renderStatus"') && lab.includes('id="auditionVoice"'),'Feedback and replay controls preserved');
assert.ok(lab.includes('Your two named “Saved” presets') && freshLab.includes('Your two named “Saved” presets'),'Original preset guidance restored');
assert.ok(!lab.includes('Choose language or gender in either order. Selecting a voice') && !freshLab.includes('Choose language or gender in either order. Selecting a voice'),'Quoted onboarding line removed');
assert.ok(!lab.includes('Optional: other Lewis recordings or your own files'),'Quoted optional source label removed');
assert.ok(lab.includes('id="fileHelp" class="sr-only"') && freshLab.includes('id="fileHelp" class="sr-only"'),'Quoted sample metadata is visually hidden');
assert.equal(voiceCatalog.defaultVoice,'bf_alice','First recorded sample demonstrates another voice instead of Lewis');
assert.ok(lab.includes('<option value="voice-library" selected>'),'The voice library is the primary audio source');
assert.ok(browserJS.includes("initializeVoiceBrowser().then(ready=>") && browserJS.includes('return loadLibraryVoice();'),'Initial voice loads automatically');
assert.ok(browserJS.includes("loadLibraryVoice();});"),'Changing voice/filter loads its audio automatically');
assert.ok(read('voice-lab/sw.js').includes('SHELL_URLS.has(req.url)'),'Dynamic voice MP3s and manifest are not cached in the offline shell');


assert.ok(lab.includes('data-preset="savedDeepDry"') && lab.includes('data-preset="savedNaturalRoom"'), 'Both user recipes are selectable in Voice Lab');
assert.ok(lab.includes('id="formant" min="-5" max="5" step="0.05"'), 'Formant control can represent user-supplied precision');
assert.equal(recipes.presets.length, 2, 'Both user-defined settings profiles are permanently archived');
assert.deepEqual(recipes.presets.map(p => p.recipe.settings.formant), [-1.15, -1.25], 'Exact formant values are preserved');
assert.deepEqual(recipes.presets.map(p => p.recipe.settings.reverb), [0, 8], 'Both room choices remain distinct');

const curatedOrder = [
  'anaglyph-friends', 'print-pocketmod', 'lighthouse', 'wisdom-watch',
  'living-patterns', 'tales-from-the-loop-toolkit',
  'starfinder-homebrewery-toolkit', 'pnp-o-matic', 'asheville-golocal-maps',
  'orchestral-maneuvers-dark', 'escape-pod-cast', 'touchbarpalooza',
  'sorting-cards', 'biofeedback-play', 'tv-b-goner', 'ai-kindle',
  'supercollider', 'lewis-voice-lab', 'temporarily-leave-the-universe'
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
