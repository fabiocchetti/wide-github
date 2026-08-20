"use strict";

// Shared helpers used by both the content script (handler.js) and the popup
// (popup.js). It must be loaded before them (see manifests and popup.html).
//
// Declared with `var` on purpose: this file can be injected into a tab that
// already runs it, where `const`/`let` would throw on re-declaration.

// Cross-browser API wrapper
var ext = typeof browser !== "undefined" ? browser : chrome;

var DEFAULT_DOMAINS = [
  'github.com', 'gist.github.com', '*.github.com', '*.github.io'
];

var DEFAULT_SETTINGS = { wideEnabled: true, githubDomains: [] };

var normalizeDomain = d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '').toLowerCase();

// --- Match a normalized domain against a pattern ('example.com' or '*.example.com') ---
// The wildcard matches the base domain and its subdomains, but NOT domains that
// merely end with the same string (e.g. 'notgithub.com' must not match '*.github.com').
var domainMatches = (domain, pattern) => {
  if (pattern.startsWith('*.')) {
    const base = pattern.slice(2);
    return domain === base || domain.endsWith('.' + base);
  }
  return domain === pattern;
};

var isDefaultDomain = d => DEFAULT_DOMAINS.some(dom => domainMatches(normalizeDomain(d), dom));

// --- Check if a domain is whitelisted (default or custom) ---
var isDomainWhitelisted = (domain, whitelist) => {
  const normalized = normalizeDomain(domain);
  if (isDefaultDomain(normalized)) return true;
  return Array.isArray(whitelist) && whitelist.some(wd => domainMatches(normalized, normalizeDomain(wd)));
};

// --- Convert a domain to a match pattern for permissions/scripting APIs ---
var domainToMatchPattern = d => `*://${normalizeDomain(d)}/*`;

// --- ID of the dynamically registered content script for a custom domain ---
var contentScriptId = d => `wide-github-${normalizeDomain(d)}`;

// --- Read the settings, writing the defaults back on first run ---
// Shared so the popup and the content script agree on what a missing value means.
function getSettings(callback) {
  ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
    const missing = {};
    if (result.wideEnabled === undefined) missing.wideEnabled = DEFAULT_SETTINGS.wideEnabled;
    if (!Array.isArray(result.githubDomains)) missing.githubDomains = DEFAULT_SETTINGS.githubDomains;
    if (Object.keys(missing).length) ext.storage.sync.set(missing);
    callback({
      wideEnabled: result.wideEnabled !== undefined ? result.wideEnabled : DEFAULT_SETTINGS.wideEnabled,
      githubDomains: Array.isArray(result.githubDomains) ? result.githubDomains : []
    });
  });
}
