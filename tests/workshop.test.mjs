import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// The workshop is released only through the approved GitHub Pages deployment.
const home = fs.readFileSync('index.html','utf8');
const workshop = fs.readFileSync('workshop/index.html','utf8');
const expected = [
  'MAZE · Seedling Rejuvenation',
  'Key Scratch',
  'Sphero Laboratory',
  'MPK249 Universal Map',
  'Escape Team Activate',
  'Pocket Operations Manual',
  'Play by Ear · GameCast'
];
assert.equal((home.match(/<article class="project /g)||[]).length,20,'Public exhibition contains 20 curated tiles');
assert.match(home, /href="\/workshop\/"/, 'Only one understated workshop destination added');
assert.ok(!home.includes('href="/xyzzy/"'), 'Unlisted workbench remains unlinked from public homepage');
assert.ok(!workshop.includes('href="/xyzzy/"'), 'Workshop does not reveal private workbench URL');
assert.ok(!workshop.includes('id="temporarily-leave-the-universe"'),'Promoted adventure is removed from workshop');
assert.equal((workshop.match(/<article class="project"/g)||[]).length,expected.length,'Workshop keeps seven projects after exhibition promotion');
assert.deepEqual([...workshop.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m=>m[1]),expected,'Reviewed selection and order');
assert.ok(workshop.includes('requires developer signing') || workshop.includes('Requires developer signing'), 'Source-built keyboard is honestly labeled');
assert.ok(workshop.includes('No finished, blind-playtested mission'),'Unfinished puzzle work is not mislabeled as released');
assert.ok(workshop.includes('real-device verification'), 'Device-dependent features are explicitly qualified');
assert.ok(!workshop.includes('href="https://chatgpt.com/'), 'No personal working conversations embedded in public workshop');
assert.ok(home.includes('href="/thdies-cast/feed.xml"'), 'Podcast subscription is available');
assert.ok(home.includes('href="/thdies-cast/"'), 'Podcast episodes are available');
assert.ok(workshop.includes('href="https://udeudeude.github.io/Pocket-Operations-Manual/"'), 'Playable PO-35 simulator linked');
assert.ok(fs.existsSync('thdies-cast/cover.png'),'Podcast artwork exists in portfolio repository');

const server=spawn('python3',['-m','http.server','4182','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){
    try { const r=await fetch('http://127.0.0.1:4182/',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;} } catch{}
    await new Promise(resolve=>setTimeout(resolve,160));
  }
  assert.ok(ready,'Test server started');
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
    // Avoid network-dependent third party media for repeatable layout checks.
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
    await page.goto('http://127.0.0.1:4182/workshop/',{waitUntil:'domcontentloaded'});
    const dimensions=await page.evaluate(()=>({
      viewport:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      columns:getComputedStyle(document.querySelector('.projects')).gridTemplateColumns.split(' ').length,
      cards:[...document.querySelectorAll('.project')].map(c=>{
        const box=c.getBoundingClientRect();
        return {width:box.width,right:box.right,left:box.left};
      })
    }));
    assert.equal(dimensions.cards.length,expected.length,'All approved cards are rendered at '+width);
    assert.ok(dimensions.scrollWidth<=dimensions.viewport+2,'No sideways scrolling at '+width);
    assert.equal(dimensions.columns,2,'Appropriate columns at '+width);
    assert.ok(dimensions.cards.every(b=>b.width>130 && b.right<=dimensions.viewport+2 && b.left>=-2),'Card bounds within viewport at '+width);
    for(const name of expected) assert.equal(await page.getByRole('heading',{name,exact:true}).count(),1,name+' is legible');

    if(width===390){
      await page.goto('http://127.0.0.1:4182/',{waitUntil:'domcontentloaded'});
      const workshopLink=page.getByRole('link',{name:/Explore the workshop/});
      assert.equal(await workshopLink.count(),1,'Exactly one invitation beneath public portfolio');
      await workshopLink.click();
      await page.waitForURL('**/workshop/');
      await page.getByRole('link',{name:/Ude Projects/}).first().click();
      await page.waitForURL('http://127.0.0.1:4182/');
    }
    await page.close();
  }
  console.log('Open Workshop proposal passes desktop/mobile layout, public/private separation, and navigation.');
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
