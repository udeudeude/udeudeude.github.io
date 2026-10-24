import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const dashboard=fs.readFileSync('xyzzy/index.html','utf8');
const workbench=fs.readFileSync('xyzzy/workbench.js','utf8');
const snapshot=JSON.parse(fs.readFileSync('xyzzy/repositories.json','utf8'));
const metadata=JSON.parse(fs.readFileSync('xyzzy/project-metadata.json','utf8'));
assert.equal(metadata.version,1,'Curated project metadata schema is versioned');
assert.equal(metadata.projects['repo-th-die-s-cast'].name,'Th’die’s Cast','Correct podcast title with both apostrophes');
for(const [key,label] of [
 ['repo-maze-seedling-rejuvenation','Open web companion'],
 ['temporarily-leave-the-universe','Open web experience'],
 ['repo-mpk249-universal-map','Download source ZIP'],
 ['repo-sphero-laboratory','Mac startup and safety instructions'],
 ['repo-key-scratch','Build / install guide'],
 ['repo-escape-team-activate','No Such Room prototype']
]) {
 assert.ok(metadata.projects[key].links.some(link=>link.label===label),'Reviewed project resource: '+key);
 assert.ok(metadata.projects[key].tasks.length>0,'New project has actionable work: '+key);
}
assert.equal(snapshot.repositories.length,29,'Offline snapshot includes all 29 public repositories');
assert.ok(!JSON.stringify(snapshot).includes('gear-harness'),'Private repository absent from workbench snapshot');
assert.ok(workbench.includes('payload.version===1'),'Legacy backup handling remains available');

for(const [key,url] of [
  ['living-patterns','https://udeudeude.github.io/Living-Patterns-Podcast/feed.xml'],
  ['orchestral-maneuvers-dark','https://om-weekly-podcast.workspace-310067.chatgpt.site/feed.xml'],
  ['repo-th-die-s-cast','https://udeudeude.github.io/thdies-cast/feed.xml'],
  ['repo-play-by-ear-gamecast','https://play-by-ear-gamecast-lab.onrender.com/feed.xml']
]) {
 assert.ok(metadata.projects[key].links.some(x=>x.url===url),'Podcast subscription is recorded for '+key);
}

assert.equal((html.match(/data-phone-ready="/g)||[]).length,19,'All public projects have a phone-readiness flag');
assert.equal((html.match(/data-browser-ready="/g)||[]).length,19,'All public projects have browser-readiness flags');
assert.equal((html.match(/data-needs="/g)||[]).length,19,'All public projects declare required equipment');
assert.ok(!html.includes('data-access-filter='),'Removed all three access-mode buttons');
assert.ok(html.includes('What can I use right now?') && html.includes('Hide projects that require'),'Equipment prompt headings kept together');
assert.ok(html.indexOf('id="filter-summary"') > html.indexOf('data-exclude="hardware"'),'Count follows last equipment checkbox');
assert.ok(!html.includes('filter-tip'),'Redundant equipment help removed');
assert.deepEqual([...html.matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]),
  ['all','recurring','visual','tabletop','print','audio','hardware','asheville','learning'],'Category order matches request');
assert.ok(!html.includes('data-key="moire-lab"'),'Moiré Lab removed from public portfolio');
assert.ok(!html.includes('href="/xyzzy/"'),'No entry point to the private workbench on the public homepage');
assert.ok(dashboard.includes('noindex,nofollow'),'Unlisted workspace discourages search indexing');
assert.ok(dashboard.includes('href="/"') && dashboard.includes('← Ude Projects'),'Homepage link in the workbench header');
assert.ok(!dashboard.includes('Curated projects, the rest of the public GitHub repositories'),'Long subtitle removed');
assert.ok(!dashboard.includes('Unlisted is not password-protected.'),'Long security notice removed from header');
assert.ok(workbench.includes('STORE_TODOS') && workbench.includes('renderBacklog'),'Workbench supports persistent to-do management');

assert.ok(!dashboard.includes('chatgpt.com/c/') || dashboard.includes('placeholder'),'No personal chat link baked into dashboard');
assert.ok(!JSON.stringify(snapshot).includes('gear-harness'),'Private repository excluded from public snapshot');
assert.ok(snapshot.repositories.length>=20,'Repository snapshot has the known public repos');
new (await import('node:vm')).Script(workbench,{filename:'workbench.js'});

const server=spawn('python3',['-m','http.server','4179','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
 let ready=false;
 for(let i=0;i<70;i++){
   try{if((await fetch('http://127.0.0.1:4179/',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}
   catch{}
   await new Promise(r=>setTimeout(r,180));
 }
 assert.ok(ready,'Local test server starts');
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4179/',{waitUntil:'domcontentloaded'});
 await page.locator('#filter-summary').waitFor({state:'visible'});
 const visible=()=>page.locator('#project-grid .project:visible').count();
 assert.equal(await visible(),19,'All curated projects visible by default');


 // Equipment selection is independent of interest categories; counts follow it.
 const mac=page.locator('[data-exclude="mac"]');
 await mac.check();
 assert.ok(page.url().includes('hide=mac'),'Equipment exclusions persist in shareable URL');
 let keys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.ok(!keys.includes('print-pocketmod')&&!keys.includes('touchbarpalooza')&&!keys.includes('biofeedback-play'),'Mac-required cards excluded');
 assert.ok(keys.includes('anaglyph-friends'),'Web Anaglyph stays visible despite optional Mac download');
 assert.match(await page.locator('#filter-summary').textContent(),new RegExp('^'+keys.length+' matching projects$'),'Count reflects Mac-only exclusion');

 await page.locator('[data-filter="audio"]').click();
 keys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.ok(keys.includes('living-patterns') && !keys.includes('biofeedback-play'),'Category and equipment selections combine');
 assert.equal((await page.locator('[data-exclude="mac"]').isChecked()),true,'Equipment checkbox preserved after category selection');
 assert.match(await page.locator('#filter-summary').textContent(),new RegExp('^'+keys.length+' matching projects$'),'Filtered count is below checkboxes');

 await page.locator('[data-filter="all"]').click();
 await mac.uncheck();
 await page.locator('[data-exclude="hardware"]').check();
 keys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.ok(!keys.includes('lighthouse') && !keys.includes('tv-b-goner'),'Hardware-dependent projects can be hidden');
 assert.ok(keys.includes('living-patterns'),'Ready-to-listen projects remain when equipment hidden');
 await page.locator('[data-exclude="hardware"]').uncheck();
 assert.equal(await visible(),19,'Unchecking exclusions restores all 19 public projects');
 assert.equal(await page.locator('#clear-filters').isVisible(),false,'Reset link hidden without active filters');
 await page.locator('[data-filter="visual"]').click();
 await page.locator('[data-exclude="mac"]').check();
 assert.equal(await page.locator('#clear-filters').isVisible(),true,'Reset link appears with filters');
 await page.locator('#clear-filters').click();
 assert.equal(await visible(),19,'Clear filters restores the full portfolio');
 assert.equal(await page.locator('[data-exclude="mac"]').isChecked(),false,'Clear filters resets equipment');
 assert.ok(!page.url().includes('hide=')&&!page.url().includes('category='),'Clear filters removes query state');

 const headings=await page.locator('.access-heading').evaluate(el=>[...el.children].map(x=>x.getBoundingClientRect().top));
 assert.ok(Math.abs(headings[0]-headings[1])<28,'At phone width the two labels stay on one heading row');

 // The two newly illustrated portrait previews must load and be contained on a phone.
 await page.locator('.project[data-key="temporarily-leave-the-universe"] .tile-toggle').click();
 const images=page.locator('.project[data-key="temporarily-leave-the-universe"] .gallery img');
 assert.equal(await images.count(),2,'Two provided-screen-inspired CRT previews exist');
 const geometry=await images.evaluateAll(els=>els.map(el=>({
   loaded:el.complete && el.naturalWidth>0,
   width:el.getBoundingClientRect().width,
   height:el.getBoundingClientRect().height,
   maxHeight:parseFloat(getComputedStyle(el).maxHeight)
 })));
 assert.ok(geometry.every(x=>x.loaded && x.width>160 && x.height>150 && x.height<=x.maxHeight+2),
  'Portrait media loads and fits mobile gallery without clipping');

 const x=await context.newPage();
 // Simulate a prior owner's browser with local records saved under the original
 // repository-only workbench ID. Promotion must migrate without discarding them.
 await x.addInitScript(() => {
   if(localStorage.getItem('migration-test-seeded')) return;
   localStorage.setItem('migration-test-seeded','1');
   localStorage.setItem('ude-workbench-links-v1',JSON.stringify({
     'repo-temporarily-leave-the-universe':[{
       id:'legacy-chat',kind:'ChatGPT',title:'Previous adventure conversation',
       url:'https://chatgpt.com/c/legacy-adventure-chat'
     }]
   }));
   localStorage.setItem('ude-workbench-todos-v1',JSON.stringify({
     'repo-temporarily-leave-the-universe':[{id:'legacy-task',text:'Resume old adventure work'}]
   }));
   localStorage.setItem('ude-workbench-done-v1',JSON.stringify({
     'repo-temporarily-leave-the-universe':['source-0']
   }));
 });
 // Keep tests deterministic and do not depend on GitHub API limits.
 await x.route('https://api.github.com/**',route=>route.abort());
 await x.goto('http://127.0.0.1:4179/xyzzy/',{waitUntil:'domcontentloaded'});
 await x.locator('#result-count').getByText('projects shown').waitFor({timeout:16000}).catch(async()=>{
   await x.waitForFunction(()=>document.getElementById('result-count')?.textContent?.includes('projects shown'),null,{timeout:16000});
 });
 const text=await x.locator('#result-count').textContent();
 assert.match(text,/19 curated/,'The workbench reflects the current 19 public cards');
 assert.match(text,/extra public repositories/,'Non-curated GitHub repos included');
 assert.ok(await x.getByText('Incredible Expanding Gospel',{exact:false}).count()>0,'Non-curated repo visible');
assert.ok(await x.getByRole('heading',{name:'Moiré Lab'}).count()>0,'Moiré Lab remains available in the unlisted workbench');
const promoted=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Temporarily Leave the Universe',exact:true})});
assert.equal(await promoted.count(),1,'Promoted adventure appears exactly once in workbench');
assert.equal(await promoted.getByRole('link',{name:'Public tile'}).count(),1,'Promoted adventure now links to exhibition');
assert.equal(await promoted.getByRole('link',{name:'Open web experience'}).count(),1,'Adventure retains its metadata launch action');
 assert.equal(await promoted.getByRole('link',{name:'ChatGPT: Previous adventure conversation'}).count(),1,'Old personal chat survives promotion');
 assert.ok(await promoted.getByText('Resume old adventure work').count(),'Old personal to-do survives promotion');
 const migrated=await x.evaluate(()=>({
    links:JSON.parse(localStorage.getItem('ude-workbench-links-v1')||'{}'),
    tasks:JSON.parse(localStorage.getItem('ude-workbench-todos-v1')||'{}'),
    done:JSON.parse(localStorage.getItem('ude-workbench-done-v1')||'{}')
 }));
 assert.equal(migrated.links['repo-temporarily-leave-the-universe'],undefined,'Old link key is migrated');
 assert.equal(migrated.tasks['repo-temporarily-leave-the-universe'],undefined,'Old task key is migrated');
 assert.ok(migrated.done['temporarily-leave-the-universe']?.includes('source-0'),'Previously checked source task remains checked');

const moireCard=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Moiré Lab'})});
assert.ok(await moireCard.getByRole('link',{name:'Online workshop'}).count()>0,'Moiré still links to its working web app');
assert.equal(await moireCard.getByRole('link',{name:'Public tile'}).count(),0,'Unpublished Moiré has no public-portfolio shortcut');
 assert.ok(!(await x.locator('body').innerText()).includes('gear-harness'),'Private repository is not included publicly');
 const newlyIndexed=[
  ['MAZE · Seedling Rejuvenation','Open web companion'],
  ['MPK249 Universal Map','Download source ZIP'],
  ['Sphero Laboratory','Mac startup and safety instructions'],
  ['Ortholinear (Key Scratch)','Build / install guide'],
  ['Escape Team Activate','No Such Room prototype']
 ];
 for(const [title,label] of newlyIndexed){
   const card=x.locator('.tile').filter({has:x.getByRole('heading',{name:title,exact:true})});
   assert.equal(await card.count(),1,title+' gets an independent workbench tile');
   assert.equal(await card.getByRole('link',{name:label}).count(),1,title+' gets a verified action');
   assert.ok((await card.locator('.backlog h3').textContent()).includes('open of'),title+' shows source-based to-dos');
   assert.equal(await card.getByRole('link',{name:'Public tile'}).count(),0,title+' has not been promoted to the public portfolio');
 }

 const first=x.locator('.tile').first();
 await first.locator('details summary').click();
 await first.locator('input[name="title"]').fill('A saved working conversation');
 await first.locator('input[name="url"]').fill('https://chatgpt.com/c/example-user-only');
 await first.locator('select[name="kind"]').selectOption('ChatGPT');
 await first.locator('form.edit-links button[type=submit]').click();
 assert.ok(await x.getByText('A saved working conversation').count(),'ChatGPT link appears in project');
 await x.reload();
 await x.waitForFunction(()=>document.getElementById('result-count')?.textContent?.includes('projects shown'),null,{timeout:16000});
 assert.ok(await x.getByText('A saved working conversation').count(),'Private ChatGPT link survives reload on same browser');
 assert.ok(!fs.readFileSync('xyzzy/index.html','utf8').includes('example-user-only'),'Local conversation not added to published file');
 const shownCount=await x.locator('.tile').count();
 assert.equal(await x.locator('.tile .backlog h3').count(),shownCount,'Every tile visibly includes backlog heading');
 assert.equal(await x.locator('.tile .backlog input[name="todo"]').count(),shownCount,'Every tile has an add-to-do control');
 const thdie=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Th’die’s Cast'})});
 assert.equal(await thdie.count(),1,'Correct podcast display spelling');
 assert.ok(await thdie.getByRole('link',{name:'Subscribe (RSS)'}).count(),'Th’die’s Cast has a direct subscription link');
 assert.ok(await thdie.getByRole('link',{name:'Listen to the pilot episodes'}).count(),'Podcast has episode listener link');
 const gameCast=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Play by Ear · GameCast'})});
 assert.ok(await gameCast.getByRole('link',{name:'Subscribe to test feed (RSS)'}).count(),'GameCast has subscription URL');
 const living=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Living Patterns'})});
 assert.ok(await living.getByRole('link',{name:'Subscribe (RSS)'}).count(),'Living Patterns has direct RSS link');
 const orchestral=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Orchestral Maneuvers in the Dark'})});
 assert.ok(await orchestral.getByRole('link',{name:'Subscribe (RSS)'}).count(),'Orchestral show has RSS link');
 const po35=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Pocket Operations Manual'})});
 assert.ok(await po35.getByRole('link',{name:'Interactive PO-35 Speak simulator'}).count(),'Non-curated web simulator linked');
 const depot=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Pocket Operations Mobile Depot'})});
 assert.ok(await depot.getByRole('link',{name:'PO-35 Bridge'}).count(),'PO-35 utility is linked');
 assert.ok(await moireCard.getByRole('link',{name:'Online workshop'}).count(),'Moiré workshop online action appears');
 const escape=x.locator('.tile').filter({has:x.getByRole('heading',{name:'Escape Pod Cast'})});
 assert.ok(await escape.getByRole('link',{name:'Latest Mac releases'}).count(),'Mac downloads offered in workbench');
 const backlog=first.locator('.backlog');
 await backlog.locator('input[name="todo"]').fill('A task saved privately on this device');
 await backlog.locator('button[type="submit"]').click();
 assert.ok(await x.getByText('A task saved privately on this device').count(),'Personal to-do visible after save');
 await x.reload();
 await x.waitForFunction(()=>document.getElementById('result-count')?.textContent?.includes('projects shown'),null,{timeout:16000});
 assert.ok(await x.getByText('A task saved privately on this device').count(),'Personal to-do persists across reload');
 const task=x.locator('.tile').first().locator('.backlog-items li').filter({hasText:'A task saved privately on this device'});
 await task.locator('input[type="checkbox"]').check();
 assert.ok(await x.locator('.tile').first().getByText('A task saved privately on this device').first().evaluate(el=>el.classList.contains('done')),'Completed personal task renders as done');
 assert.ok(await x.locator('.tile').first().locator('input[type="checkbox"]:focus').count()>0,'Task completion restores keyboard focus');
 await x.locator('#search').fill('A task saved privately on this device');
 assert.equal(await x.locator('.tile').count(),1,'Search finds locally saved backlog items');
 await x.locator('#search').fill('');
 // Importing an older (v1) backup cannot erase a newer local to-do collection.
 x.once('dialog',dialog=>dialog.accept());
 await x.locator('#import-file').setInputFiles({
   name:'old-private-backup.json',
   mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({version:1,links:{},projects:[]}))
 });
 await x.getByText('Older backup imported. Existing local to-dos were preserved.').waitFor();
 assert.ok(await x.getByText('A task saved privately on this device').count(),'Old backup import preserves existing to-dos');
 const desktop=await browser.newContext({viewport:{width:1280,height:820}});
 const desk=await desktop.newPage();
 await desk.route('https://api.github.com/**',route=>route.abort());
 await desk.goto('http://127.0.0.1:4179/xyzzy/',{waitUntil:'domcontentloaded'});
 await desk.waitForFunction(()=>document.getElementById('result-count')?.textContent?.includes('projects shown'));
 const desktopLayout=await desk.evaluate(()=>({
  viewport:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
  columns:getComputedStyle(document.getElementById('projects')).gridTemplateColumns.split(' ').length
 }));
 assert.ok(desktopLayout.scrollWidth<=desktopLayout.viewport+2,'Workbench desktop layout does not overflow');
 assert.equal(desktopLayout.columns,3,'Workbench desktop grid uses three columns');
 await desk.locator('#search').fill('two-robot');
 assert.equal(await desk.locator('.tile').count(),1,'Desktop search reaches newly indexed robotics backlog');
 await desk.close();await desktop.close();



 console.log('Access filters and unlisted workbench passed: 19 curated, public extras, podcast subscriptions and locally persisted links/to-dos.');
 await context.close();
} finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
