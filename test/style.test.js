"use strict";

// Checks which elements src/style.css actually widens, against fixtures taken
// from real GitHub markup. Needs jsdom; skipped when it is not installed, so
// the rest of the suite still runs on a bare clone.

const fs = require('fs');
const path = require('path');
const { eq, skip, report } = require('./harness');

console.log('style.css');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  skip('jsdom non installato — esegui `npm install jsdom` in test/ per abilitare questi test');
  report('style.css');
}

// Split on commas at paren depth 0, so :where(a, b) survives
const splitSelectors = str => {
  const out = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
};

const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.css'), 'utf8');
const selectors = [];
css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{[^}]*\}/g, (_, sel) => {
  splitSelectors(sel).forEach(s => { s = s.trim(); if (s) selectors.push(s); });
  return '';
});

let unsupported = 0;
const isWidened = el => selectors.some(sel => {
  try { return el.matches(sel); }
  catch (e) { unsupported++; return false; }   // selector jsdom cannot parse
});

for (const file of fs.readdirSync(path.join(__dirname, 'fixtures')).sort()) {
  const html = fs.readFileSync(path.join(__dirname, 'fixtures', file), 'utf8');
  const doc = new JSDOM(`<html class="is-wide-github-enabled"><body>${html}</body></html>`).window.document;
  for (const el of doc.querySelectorAll('[data-expect]')) {
    const want = el.getAttribute('data-expect') === 'wide';
    const label = `${file}: ${el.className.split(' ')[0]}[data-width=${el.getAttribute('data-width')}]`;
    eq(isWidened(el), want, label);
  }
}

if (unsupported) console.log(`  nota: ${unsupported} confronti saltati per selettori non supportati da jsdom`);
report('style.css');
