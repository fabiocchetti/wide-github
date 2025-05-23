"use strict";

// Add the class to <html> as early as possible to minimize flicker
document.documentElement.classList.add('is-wide-github-enabled');

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
  const normalizedDomain = normalizeDomain(domain);

  // Check default domains
  if (DEFAULT_DOMAINS.some(d => d.startsWith('*.') ? normalizedDomain.endsWith(d.slice(2)) : normalizedDomain === d)) {
    return true;
  }

  // Check custom whitelist
  if (Array.isArray(whitelist) && whitelist.some(wd => {
    const nwd = normalizeDomain(wd);
    return nwd.startsWith('*.') ? normalizedDomain.endsWith(nwd.slice(2)) : normalizedDomain === nwd;
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
    if (isWhitelisted && (result.wideEnabled === undefined || result.wideEnabled)) {
      document.documentElement.classList.add('is-wide-github-enabled');
    } else {
      document.documentElement.classList.remove('is-wide-github-enabled');
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

// SPA navigation and URL change detection
let lastUrl = location.href;

function checkUrlChange() {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    updateWideLayout();
    let retries = 5;
    const interval = setInterval(() => {
      updateWideLayout();
      if (--retries <= 0) clearInterval(interval);
    }, 100);
  }
}

// Observe DOM mutations (fallback)
new MutationObserver(checkUrlChange).observe(document, { subtree: true, childList: true });

// Listen for history API navigation (popstate)
window.addEventListener('popstate', checkUrlChange);

// Patch pushState and replaceState to detect SPA navigation
(function(history) {
  const wrap = fn => function() {
    fn.apply(this, arguments);
    window.dispatchEvent(new Event('widegithub-urlchange'));
  };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
})(window.history);

window.addEventListener('widegithub-urlchange', checkUrlChange);

// Observe main content area for changes (for tab switches, etc.)
function observeMainContent() {
  const main = document.querySelector('.application-main');
  if (main) {
    new MutationObserver(() => {
      updateWideLayout();
    }).observe(main, { childList: true, subtree: true, attributes: true });
  }
}
observeMainContent();

// Re-observe if main content is replaced (rare, but possible)
new MutationObserver(observeMainContent).observe(document.documentElement, { childList: true, subtree: false });

// Listen for GitHub's own AJAX navigation events (pjax)
document.addEventListener('pjax:end', updateWideLayout);
document.addEventListener('DOMContentLoaded', updateWideLayout);
