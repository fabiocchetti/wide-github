"use strict";

// Default domains that should always be supported
const DEFAULT_DOMAINS = [
  'github.com',
  'gist.github.com',
  '*.github.com',
  '*.github.io'
];

// Function to normalize domain (remove www. and trailing slashes)
function normalizeDomain(domain) {
  return domain.replace(/^www\./, '').replace(/\/$/, '');
}

// Function to check if current domain is whitelisted
function isDomainWhitelisted(domain, whitelist) {
  // Normalize current domain
  const normalizedDomain = normalizeDomain(domain);

  // Check if domain is in default domains
  if (DEFAULT_DOMAINS.some(defaultDomain => {
    if (defaultDomain.startsWith('*.')) {
      const baseDomain = defaultDomain.substring(2);
      return normalizedDomain.endsWith(baseDomain);
    }
    return normalizedDomain === defaultDomain;
  })) {
    return true;
  }

  // Check if domain is in custom whitelist
  if (whitelist && whitelist.some(whitelistedDomain => {
    const normalizedWhitelisted = normalizeDomain(whitelistedDomain);
    if (normalizedWhitelisted.startsWith('*.')) {
      const baseDomain = normalizedWhitelisted.substring(2);
      return normalizedDomain.endsWith(baseDomain);
    }
    return normalizedDomain === normalizedWhitelisted;
  })) {
    return true;
  }

  return false;
}

// Function to apply or remove wide layout based on settings
function updateWideLayout() {
  const currentDomain = window.location.hostname;
  
  chrome.storage.sync.get(['wideEnabled', 'githubDomains'], function(result) {
    const isWhitelisted = isDomainWhitelisted(currentDomain, result.githubDomains);
    
    if (isWhitelisted) {
      if (result.wideEnabled === undefined || result.wideEnabled) {
        document.body.classList.add('is-wide-github-enabled');
      } else {
        document.body.classList.remove('is-wide-github-enabled');
      }
    } else {
      document.body.classList.remove('is-wide-github-enabled');
    }
  });
}

// Initialize on page load
updateWideLayout();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.wideEnabled !== undefined) {
    updateWideLayout();
  }
});

// Listen for URL changes (including redirects)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    updateWideLayout();
  }
}).observe(document, { subtree: true, childList: true });
