// Capture real UI screens from the checked-out websites in headless Chrome.
// The script never invents visuals, edits pixels to depict new functionality, or
// reads personal data. Run manually or via the dedicated GitHub Actions workflow.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'assets', 'screenshots');
await mkdir(out, {recursive: true});
const servers = [];

async function startServer(directory, port) {
  const child = spawn('python3', [
    '-m', 'http.server', String(port),
    '--bind', '127.0.0.1',
    '--directory', directory
  ], {stdio: 'ignore'});
  servers.push(child);
  const url = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let tries = 0; tries < 60; tries++) {
    if (child.exitCode !== null) throw new Error('Local server exited prematurely: ' + directory);
    try {
      const res = await fetch(url, {signal: AbortSignal.timeout(1000)});
      if (res.ok) { ready = true; break; }
    } catch { /* wait for Python server */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Timed out waiting for local server at ' + url);
  return url;
}

async function capture(page, selector, filename, width = 1000, height = 750) {
  await page.locator(selector).waitFor({state: 'visible', timeout: 20000});
  const png = await page.locator(selector).screenshot({type: 'png', animations: 'disabled', timeout: 30000});
  const filepath = path.join(out, filename);
  await sharp(png)
    .resize(width, height, {
      fit: (selector === 'header.hero .specimen' || selector === 'header.hero .grid') ? 'contain' : 'cover',
      position: 'centre',
      background: selector === 'header.hero .grid' ? '#f4eddd' : '#08131c',
      withoutEnlargement: false
    })
    .webp({quality: 85, effort: 5})
    .toFile(filepath);
  const file = await stat(filepath);
  if (file.size < 5000) throw new Error(filename + ' is suspiciously small: ' + file.size);
  console.log(filename + ': ' + file.size + ' bytes from ' + selector);
}

let browser;
try {
  const portfolioUrl = await startServer(root, 4173);
  const moireUrl = await startServer(path.join(root, '_capture_source', 'moire'), 4174);
  const tvUrl = await startServer(path.join(root, '_capture_source', 'tv'), 4175);
  const livingUrl = await startServer(path.join(root, '_capture_source', 'living'), 4176);
  browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--no-sandbox']});
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });

  const moire = await context.newPage();
  const errors = [];
  moire.on('pageerror', error => errors.push(error.message));
  await moire.goto(moireUrl, {waitUntil: 'domcontentloaded', timeout: 45000});
  await moire.waitForFunction(() => {
    const svg = document.getElementById('experiment');
    return svg && svg.childElementCount > 0;
  }, {timeout: 20000});
  // Both modes are captured from the *actual running application*.
  await moire.locator('#experimentChoices .experiment-choice').first().waitFor({timeout: 20000});
  await capture(moire, '.stage-surround', 'moire-lab.webp');
  await capture(moire, '.workbench', 'moire-lab-interface.webp', 1200, 900);
  await moire.locator('#modeBarrier').click();
  await moire.locator('#experimentTitle').waitFor({state: 'visible'});
  await capture(moire, '.stage-surround', 'moire-lab-barrier.webp');
  if (errors.length) console.warn('Moiré Lab browser messages:', errors.join(' | '));
  await moire.close();

  // TV-b-goner: capture the real, unsimulated ready screen. Never transmit.
  const tv = await context.newPage();
  await tv.setViewportSize({width: 1000, height: 750});
  await tv.goto(tvUrl, {waitUntil: 'domcontentloaded', timeout: 30000});
  await tv.locator('#offButton').waitFor({state:'visible', timeout:20000});
  try {
    await tv.waitForFunction(() => document.getElementById('dbStatus')?.textContent !== 'loading…',
      null, {timeout: 10000});
  } catch { console.warn('TV-b-goner database still loading; capturing displayed UI anyway.'); }
  const tvShot = await tv.screenshot({type:'png', fullPage:false, animations:'disabled'});
  await sharp(tvShot).webp({quality:85, effort:5}).toFile(path.join(out, 'tv-b-goner.webp'));
  await tv.close();

  // Living Patterns: the published static homepage, not a made-up podcast mockup.
  const living = await context.newPage();
  await living.goto(livingUrl, {waitUntil: 'domcontentloaded', timeout:30000});
  await living.locator('.hero .grid').waitFor({state:'visible', timeout:15000});
  await capture(living, 'header.hero .grid', 'living-patterns-site.webp');
  await living.close();

  for (const item of [
    {slug:'tales-from-the-loop', filename:'tales-from-the-loop-guide.webp'},
    {slug:'starfinder', filename:'starfinder-guide.webp'}
  ]) {
    const page = await context.newPage();
    await page.goto(portfolioUrl + '/' + item.slug + '/', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await capture(page, 'header.hero .specimen', item.filename);
    await page.close();
  }

  await context.close();
} finally {
  if (browser) await browser.close();
  for (const server of servers) server.kill('SIGTERM');
}
