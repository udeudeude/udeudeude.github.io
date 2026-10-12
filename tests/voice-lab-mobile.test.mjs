import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const server=spawn('python3',['-m','http.server','4186','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  let ready=false;
  for(let n=0;n<50;n++){
    try{
      const response=await fetch('http://127.0.0.1:4186/voice-lab/voice-catalog.json');
      if(response.ok){ready=true;break;}
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,170));
  }
  assert.ok(ready,'Local voice lab server available');
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4186/voice-lab/?release=kokoro-54-v2',{waitUntil:'domcontentloaded'});
  assert.ok((await page.title()).includes('Kokoro Voice Lab'));
  await page.locator('#languageSelect').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#voiceAvailability')?.textContent?.includes('54 / 54'),{timeout:30000});
  assert.equal(await page.locator('.header p').count(),0,'No explanatory hero paragraphs');
  assert.equal(await page.locator('footer').count(),0,'No repeating app footer');
  assert.equal(await page.locator('.extra-audio').evaluate(el=>el.open),false,'Other recordings remain collapsed');
  const statusStyles=await page.locator('#voiceAvailability').evaluate(el=>({width:el.getBoundingClientRect().width,clip:getComputedStyle(el).clip}));
  assert.ok(statusStyles.width<=2,'Voice availability is visually hidden but remains accessible');
  assert.equal(await page.locator('#genderSelect').getAttribute('aria-label'),'Voice profile','Filters retain accessible names');
    assert.equal(await page.locator('#languageSelect').inputValue(),'all','No forced language-first choice');
  assert.equal(await page.locator('#genderSelect').inputValue(),'all','No forced gender-first choice');
  const defaultId=await page.locator('#voiceSelect').inputValue();
  const defaultLabel=await page.locator('#voiceSelect option:checked').textContent();
  console.log('Initial selected voice',defaultId,defaultLabel);
  assert.notEqual(defaultId,'bm_lewis','First sample is not Lewis');
  await page.waitForFunction(voice=>document.querySelector('#fileHelp')?.textContent?.toLowerCase().includes(voice.toLowerCase()),
    defaultLabel.trim().split(' ')[0],{timeout:30000});
  assert.equal(await page.locator('#sampleSelect').inputValue(),'voice-library','Voice library is the audio source');
  // Gender can be selected first and reduces the list independently.
  await page.locator('#genderSelect').selectOption('m');
  await page.waitForFunction(()=>document.querySelector('#voiceSelect').value.startsWith('bm_') || document.querySelector('#voiceSelect').value.startsWith('am_'),{timeout:30000});
  await page.locator('#languageSelect').selectOption('b');
  const masculineValues=await page.locator('#voiceSelect option:not(:disabled)').evaluateAll(items=>items.map(x=>x.value));
  assert.deepEqual(masculineValues,['bm_daniel','bm_fable','bm_george','bm_lewis'],'English/British masculine voice list');
  await page.locator('#voiceSelect').selectOption('bm_george');
  await page.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('George'),{timeout:30000});
  assert.equal(await page.locator('#sampleSelect').inputValue(),'voice-library');
  console.log('Selected George, loaded its file, not Lewis');
  await page.locator('#genderSelect').selectOption('f');
  const femaleValues=await page.locator('#voiceSelect option:not(:disabled)').evaluateAll(items=>items.map(x=>x.value));
  assert.deepEqual(femaleValues,['bf_alice','bf_emma','bf_isabella','bf_lily'],'Changing gender keeps language and updates voices');
  await page.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('Alice'),{timeout:30000});
  // Language can also be chosen first after resetting gender.
  await page.locator('#genderSelect').selectOption('all');
  await page.locator('#languageSelect').selectOption('a');
  assert.equal(await page.locator('#languageSelect').inputValue(),'a');
  assert.equal(await page.locator('#genderSelect').inputValue(),'all');
  const count=await page.locator('#voiceSelect option').count();
  assert.equal(count,20,'All American voices visible before gender filtering');
  await page.locator('#genderSelect').selectOption('m');
  const americanMaleCount=await page.locator('#voiceSelect option:not(:disabled)').count();
  assert.equal(americanMaleCount,9);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,'Voice browser fits an iPhone-width viewport');
  assert.deepEqual(errors,[],'No browser JavaScript exceptions');

  // Real-world cache recovery path: this fresh document lives outside the
  // old /voice-lab/ service-worker scope but shares the current editor code.
  const fresh=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'
  });
  const freshErrors=[];
  fresh.on('pageerror',error=>freshErrors.push(error.message));
  await fresh.goto('http://127.0.0.1:4186/kokoro-voice-lab/',{waitUntil:'domcontentloaded'});
  await fresh.waitForFunction(()=>document.querySelector('#voiceAvailability')?.textContent?.includes('54 / 54'),{timeout:30000});
  await fresh.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('Alice'),{timeout:30000});
  assert.equal(await fresh.locator('#voiceSelect').inputValue(),'bf_alice','Fresh entry loads Alice instead of Lewis');
  await fresh.locator('#voiceSelect').selectOption('bm_george');
  await fresh.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('George'),{timeout:30000});
  assert.deepEqual(freshErrors,[],'Fresh cache-recovery entry has no JavaScript exceptions');
  await fresh.close();
  console.log('Verified clean /kokoro-voice-lab/ URL and non-Lewis native voice switching.');
  await browser.close();browser=null;
  console.log('Kokoro voice browsing smoke test passed: 54 playable voices, gender-first and language-first filters, automatic Alice and George MP3 loading.');
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
