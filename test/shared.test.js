"use strict";

// Domain matching and match-pattern helpers from src/shared.js.

const fs = require('fs');
const path = require('path');
const { eq, report } = require('./harness');

// shared.js expects an extension API and declares its helpers as globals
global.chrome = { storage: { sync: { get() {}, set() {} } } };
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared.js'), 'utf8');
(0, eval)(src.replace(/^"use strict";/, ''));

console.log('shared.js');

eq(normalizeDomain('https://www.GitHub.com/'), 'github.com', 'normalize rimuove schema, www, slash finale e maiuscole');

eq(isDefaultDomain('github.com'), true, 'github.com è un dominio di default');
eq(isDefaultDomain('gist.github.com'), true, 'gist.github.com è un dominio di default');
eq(isDefaultDomain('docs.github.com'), true, 'un sottodominio combacia con *.github.com');
// regression: the wildcard used to be a plain endsWith
eq(isDefaultDomain('notgithub.com'), false, 'notgithub.com NON combacia con *.github.com');
eq(isDefaultDomain('evilgithub.io'), false, 'evilgithub.io NON combacia con *.github.io');

eq(isDomainWhitelisted('git.corp.com', ['git.corp.com']), true, 'un dominio custom combacia');
eq(isDomainWhitelisted('git.corp.com', ['GIT.CORP.COM']), true, 'il confronto è case-insensitive');
eq(isDomainWhitelisted('evil.com', ['git.corp.com']), false, 'un dominio estraneo è rifiutato');
eq(isDomainWhitelisted('git.corp.com', undefined), false, 'una whitelist non definita non solleva errori');
eq(isDomainWhitelisted('git.corp.com', 'non-un-array'), false, 'una whitelist non valida non solleva errori');

eq(domainToMatchPattern('Git.Corp.com'), '*://git.corp.com/*', 'dominio convertito in match pattern');

// reconcilePendingDomain() compares a stored domain against the normalized list:
// if the two forms disagree the domain is re-added on every popup open
const stored = ['git.corp.com'].map(normalizeDomain);
eq(stored.includes(normalizeDomain('www.git.corp.com')), true, 'la variante www. è riconosciuta come già presente');
eq(stored.includes(normalizeDomain('https://GIT.CORP.COM/')), true, 'la variante con schema e maiuscole è riconosciuta');

report('shared.js');
