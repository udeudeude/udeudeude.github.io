import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Browser-level regression for the portrait-strip screenshot bug reported on iOS.
// All app media is loaded from the local portfolio; no account access is needed.
const server = spawn('python3', ['-m', 'http.server', '4178', '--bind', '127.0.0.1'], {stdio:'ignore'});
let browser;
try {
  let ready = false;
  for (let i=0; i<60; i++) {
    try {
      const response=await fetch('http://127.0.0.1:4178/', {signal:AbortSignal.timeout(1000)});
      if(response.ok){ready=true;break;}
    } catch { /* waiting for server */ }
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  assert.ok(ready, 'Portfolio server must be ready');
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,
    reducedMotion:'reduce'
  });
  await page.goto('http://127.0.0.1:4178/', {waitUntil:'domcontentloaded'});
  // Guard against a recurrence of the missing/clipped Exhibition descriptions.
  // Check actual browser layout, not just whether summary text exists in HTML.
  async function checkCaptions(browserPage, device) {
    const entries = await browserPage.locator('.project').evaluateAll(projects => projects.map(project => {
      const caption=project.querySelector('.caption');
      const summary=project.querySelector('.tile-summary');
      const title=caption?.querySelector('h2');
      const toggle=project.querySelector('.tile-toggle');
      const visual=project.querySelector('.visual');
      if(!caption || !summary || !title || !toggle || !visual) {
        return {key:project.dataset.key, missing:true};
      }
      const s=summary.getBoundingClientRect();
      const c=caption.getBoundingClientRect();
      return {
        key:project.dataset.key, text:summary.textContent.trim(),
        display:getComputedStyle(summary).display,
        visibility:getComputedStyle(summary).visibility,
        opacity:Number(getComputedStyle(summary).opacity),
        width:s.width,height:s.height,top:s.top,bottom:s.bottom,
        captionTop:c.top,captionBottom:c.bottom,
        titleBottom:title.getBoundingClientRect().bottom,
        visualBottom:visual.getBoundingClientRect().bottom,
        buttonBottom:toggle.getBoundingClientRect().bottom
      };
    }));
    assert.equal(entries.length,22,device+': all curated Exhibition tiles are rendered');
    for(const entry of entries) {
      const label=device+': '+entry.key;
      assert.ok(!entry.missing,label+' has a title, caption, summary, and tile button');
      assert.ok(entry.text.length>=18,label+' has a substantive description');
      assert.notEqual(entry.display,'none',label+' description is displayed');
      assert.equal(entry.visibility,'visible',label+' description is visible');
      assert.ok(entry.opacity>=0.99,label+' description is opaque');
      assert.ok(entry.width>50 && entry.height>=12,label+' description occupies real space');
      assert.ok(entry.top>=entry.titleBottom-2,label+' description follows the title');
      assert.ok(entry.top>=entry.captionTop-2 && entry.bottom<=entry.captionBottom+2,
        label+' description is not clipped by its caption');
      assert.ok(entry.captionTop>=entry.visualBottom-2 && entry.captionBottom<=entry.buttonBottom+2,
        label+' caption fits below the visual and inside the tile button');
    }
  }
  await checkCaptions(page,'iPhone 390px');
  const keys=['anaglyph-friends','lighthouse','living-patterns','tv-b-goner'];
  for(const key of keys){
    const project=page.locator('.project[data-key="'+key+'"]');
    await project.locator('.tile-toggle').click();
    assert.equal(await project.getAttribute('class').then(c=>c.includes('open')),true,key+' opens');
    const gallery=project.locator('.gallery');
    await gallery.waitFor({state:'visible'});
    // The gallery may be below the initial viewport. Ensure images really load
    // before measuring geometry, otherwise a broken image reports 0px height.
    await gallery.scrollIntoViewIfNeeded();
    await gallery.locator('img').evaluateAll(async images=>{
      await Promise.all(images.map(async image=>{
        image.loading='eager';
        try { await image.decode(); } catch { /* Local-file images are asserted below. */ }
      }));
    });
    const layout=await gallery.evaluate(element=>{
      const bounds=element.getBoundingClientRect();
      const items=[...element.querySelectorAll('img')].map(img=>{
        const box=img.getBoundingClientRect(),css=getComputedStyle(img);
        return {width:box.width,height:box.height,left:box.left,right:box.right,
          fit:css.objectFit,declaredHeight:img.getAttribute('height'),
          local:img.getAttribute('src')?.startsWith('/assets/'),naturalWidth:img.naturalWidth};
      });
      return {width:bounds.width, left:bounds.left,right:bounds.right,columns:getComputedStyle(element).gridTemplateColumns,items};
    });
    assert.ok(layout.width>200 && layout.width<=390, key+': gallery must fit phone');
    for(const item of layout.items){
      assert.ok(item.width>180 && item.width<=layout.width+2, key+': image fills gallery column');
      if(item.local) {
        assert.ok(item.naturalWidth>0, key+': local screenshot loads successfully');
        assert.ok(item.height>120, key+': local screenshot is actually visible');
      }
      assert.ok(item.height<500, key+': image height is not fixed at source-pixel dimensions');
      assert.ok(item.height<=item.width*1.45, key+': image ratio fits landscape source');
      assert.ok(item.left>=layout.left-2 && item.right<=layout.right+2, key+': no clipped overflow');
      assert.equal(item.fit,'contain',key+': full image remains visible');
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
    assert.equal(overflow,false,key+': no horizontal scrolling');
    console.log(key+': '+layout.items.map(item=>Math.round(item.width)+'x'+Math.round(item.height)).join(', '));
  }
  await page.close();
  const desktopPage=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await desktopPage.goto('http://127.0.0.1:4178/',{waitUntil:'domcontentloaded'});
  await checkCaptions(desktopPage,'desktop 1280px');
  await desktopPage.close();
  console.log('All 22 Exhibition captions are visible and unclipped at phone and desktop widths.');
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
