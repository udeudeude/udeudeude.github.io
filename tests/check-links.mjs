import fs from 'node:fs';
import path from 'node:path';

const pages = ['index.html', 'golocal/index.html', 'starfinder/index.html', 'tales-from-the-loop/index.html'];
const urls = [...new Set(pages.flatMap(page => {
  const html = fs.readFileSync(page, 'utf8');
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map(m => m[1])
    .filter(url => /^https?:\/\//.test(url));
}))].sort();

const results = [];
for (const url of urls) {
  let status = 'unverified';
  try {
    const probe = async method => fetch(url, {
      method,
      redirect: 'follow',
      headers: {'User-Agent': 'UdePortfolioLinkCheck/1.0'},
      signal: AbortSignal.timeout(12000)
    });
    let response = await probe('HEAD');
    if ([403, 405, 501].includes(response.status)) response = await probe('GET');
    status = String(response.status);
  } catch (err) {
    status = 'network warning: ' + (err?.name || 'error');
  }
  results.push({url, status});
  console.log(status.padEnd(25) + ' ' + url);
}

const hardFailures = results.filter(({status}) => /^(404|410)$/.test(status));
const warnings = results.filter(({status}) => status.startsWith('network warning') || /^(403|429|500|502|503|504)$/.test(status));
const summary = [
  '## Portfolio external links',
  '',
  'Checked ' + results.length + ' distinct HTTP(S) targets.',
  '',
  '| Result | URL |',
  '| --- | --- |',
  ...results.map(({url,status}) => '| ' + status + ' | ' + url.replaceAll('|', '%7C') + ' |'),
  '',
  hardFailures.length + ' confirmed missing (404/410), ' + warnings.length + ' inconclusive or temporarily unavailable.'
].join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
if (hardFailures.length) process.exitCode = 1;
