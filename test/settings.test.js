"use strict";

// getSettings() defaults, against a fake storage.sync.

const fs = require('fs');
const path = require('path');
const { eq, report } = require('./harness');

let store, written;
global.chrome = { storage: { sync: {
  get: (keys, cb) => cb(Object.fromEntries(Object.entries(store).filter(([k]) => keys.includes(k)))),
  set: (obj, cb) => { written.push(obj); Object.assign(store, obj); if (cb) cb(); }
}}};
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared.js'), 'utf8');
(0, eval)(src.replace(/^"use strict";/, ''));

console.log('getSettings()');

const run = (label, initial, expectedSettings, expectedWrites) => {
  store = initial; written = [];
  getSettings(s => {
    eq(s, expectedSettings, `${label} — valori`);
    eq(written, expectedWrites, `${label} — scritture`);
  });
};

run('primo avvio', {},
    { wideEnabled: true, githubDomains: [] },
    [{ wideEnabled: true, githubDomains: [] }]);

// the layout is on by default, so a stored false must survive
run('wideEnabled false', { wideEnabled: false, githubDomains: [] },
    { wideEnabled: false, githubDomains: [] }, []);

run('impostazioni già presenti', { wideEnabled: true, githubDomains: ['git.corp.com'] },
    { wideEnabled: true, githubDomains: ['git.corp.com'] }, []);

run('githubDomains corrotto', { wideEnabled: true, githubDomains: null },
    { wideEnabled: true, githubDomains: [] }, [{ githubDomains: [] }]);

report('getSettings()');
