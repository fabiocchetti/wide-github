"use strict";

// Shared helpers used by both the content script (handler.js) and the popup
// (popup.js). It must be loaded before them (see manifests and popup.html).

// Cross-browser API wrapper
const ext = typeof browser !== "undefined" ? browser : chrome;

const DEFAULT_DOMAINS = [
  'github.com', 'gist.github.com', '*.github.com', '*.github.io'
];

const normalizeDomain = d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '').toLowerCase();

// --- Match a normalized domain against a pattern ('example.com' or '*.example.com') ---
// The wildcard matches the base domain and its subdomains, but NOT domains that
// merely end with the same string (e.g. 'notgithub.com' must not match '*.github.com').
const domainMatches = (domain, pattern) => {
  if (pattern.startsWith('*.')) {
    const base = pattern.slice(2);
    return domain === base || domain.endsWith('.' + base);
  }
  return domain === pattern;
};

const isDefaultDomain = d => DEFAULT_DOMAINS.some(dom => domainMatches(normalizeDomain(d), dom));

// --- Check if a domain is whitelisted (default or custom) ---
const isDomainWhitelisted = (domain, whitelist) => {
  const normalized = normalizeDomain(domain);
  if (isDefaultDomain(normalized)) return true;
  return Array.isArray(whitelist) && whitelist.some(wd => domainMatches(normalized, normalizeDomain(wd)));
};

// --- Convert a domain to a match pattern for permissions/scripting APIs ---
const domainToMatchPattern = d => `*://${normalizeDomain(d)}/*`;

// --- ID of the dynamically registered content script for a custom domain ---
const contentScriptId = d => `wide-github-${normalizeDomain(d)}`;
