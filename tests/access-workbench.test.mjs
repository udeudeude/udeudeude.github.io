import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const dashboard=fs.readFileSync('xyzzy/index.html','utf8');
const workbench=fs.readFileSync('xyzzy/workbench.js','utf8');
const snapshot=JSON.parse(fs.readFileSync('xyzzy/repositories.json','utf8'));
assert.equal((html.match(/data-phone-ready="/g)||[]).length,19,'All public projects have a phone-readiness flag');
assert.equal((html.match(/data-browser-ready="/g)||[]).length,19,'All public projects have browser-readiness flags');
assert.equal((html.match(/data-needs="/g)||[]).length,19,'All public projects declare required equipment');
assert.ok(html.includes('Try now on my phone'));
assert.ok(html.includes('Browser, no extra equipment'));
assert.ok(!html.includes('href="/xyzzy/"'),'No entry point to the private workbench on the public homepage');
assert.ok(dashboard.includes('noindex,nofollow'),'Unlisted workspace discourages search indexing');
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

 await page.locator('[data-access-filter="phone"]').click();
 let keys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.deepEqual(keys.slice().sort(),[
  'anaglyph-friends','wisdom-watch','living-patterns','tales-from-the-loop-toolkit',
  'starfinder-homebrewery-toolkit','moire-lab','orchestral-maneuvers-dark','lewis-voice-lab'
 ].sort(),'Instant phone view excludes equipment-dependent projects');
 assert.ok(!keys.includes('tv-b-goner'),'Phone IR device excluded from instant-use mode');
 assert.ok(page.url().includes('access=phone'),'Phone filter persists in shareable URL');

 await page.locator('[data-filter="audio"]').click();
 keys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.deepEqual(keys.slice().sort(),['living-patterns','orchestral-maneuvers-dark','lewis-voice-lab'].sort(),'Category and phone filter intersect');

 await page.locator('[data-access-filter="all"]').click();
 await page.locator('[data-filter="all"]').click();
 const mac=page.locator('[data-exclude="mac"]');
 await mac.check();
 assert.ok(page.url().includes('hide=mac'),'Equipment exclusions persist in URL');
 const otherKeys=await page.locator('#project-grid .project:visible').evaluateAll(cards=>cards.map(x=>x.dataset.key));
 assert.ok(!otherKeys.includes('print-pocketmod')&&!otherKeys.includes('touchbarpalooza')&&!otherKeys.includes('biofeedback-play'),'Mac-required projects excluded');
 assert.ok(otherKeys.includes('anaglyph-friends'),'Anaglyph web version stays visible despite optional Mac app');
 await mac.uncheck();
 await page.locator('[data-access-filter="browser"]').click();
 assert.ok(!(await page.locator('.project[data-key="lighthouse"]').isVisible()),'Physical hardware excluded from browser-only view');
 assert.ok(await page.locator('.project[data-key="moire-lab"]').isVisible(),'Moiré Lab browser workshop remains');

 const x=await context.newPage();
 // Keep tests deterministic and do not depend on GitHub API limits.
 await x.route('https://api.github.com/**',route=>route.abort());
 await x.goto('http://127.0.0.1:4179/xyzzy/',{waitUntil:'domcontentloaded'});
 await x.locator('#result-count').getByText('projects shown').waitFor({timeout:16000}).catch(async()=>{
   await x.waitForFunction(()=>document.getElementById('result-count')?.textContent?.includes('projects shown'),null,{timeout:16000});
 });
 const text=await x.locator('#result-count').textContent();
 assert.match(text,/19 curated/,'All curated tiles mirrored in workbench');
 assert.match(text,/extra public repositories/,'Non-curated GitHub repos included');
 assert.ok(await x.getByText('Incredible Expanding Gospel',{exact:false}).count()>0,'Non-curated repo visible');
 assert.ok(!(await x.locator('body').innerText()).includes('gear-harness'),'Private repository is not included publicly');
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
 console.log('Access filters and unlisted workbench passed: 19 curated, 23 public repos, locally persisted working links.');
 await context.close();
} finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
