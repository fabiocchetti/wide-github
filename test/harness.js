"use strict";

// Minimal assertion helper: no dependencies, so the suite runs with a bare
// `node test/<file>.js` on a fresh clone.

let failures = 0;

const eq = (actual, expected, label) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { console.log(`  ok   ${label}`); return; }
  failures++;
  console.log(`  FAIL ${label}\n         atteso ${e}\n         ottenuto ${a}`);
};

const skip = reason => { console.log(`  SKIP ${reason}`); };

const report = name => {
  console.log(failures ? `\n${name}: ${failures} test falliti\n` : `\n${name}: tutti i test passati\n`);
  process.exit(failures ? 1 : 0);
};

module.exports = { eq, skip, report };
