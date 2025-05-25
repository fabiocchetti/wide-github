"use strict";

const DEFAULT_DOMAINS = [
  'github.com', 'gist.github.com', '*.github.com', '*.github.io'
];

const normalizeDomain = d => d.replace(/^www\./, '').replace(/\/$/, '');
const isDefaultDomain = d => DEFAULT_DOMAINS.some(dom => dom.startsWith('*.') ? normalizeDomain(d).endsWith(dom.slice(2)) : normalizeDomain(d) === dom);

// --- Apply or remove wide layout class ---
function setWideLayout(enabled) {
  document.documentElement.classList.toggle('is-wide-github-enabled', !!enabled);
}

// --- Check if current domain is whitelisted (default or custom) ---
function isDomainWhitelisted(domain, whitelist) {
  const normalized = normalizeDomain(domain);
  if (isDefaultDomain(normalized)) return true;
  if (Array.isArray(whitelist))
    return whitelist.some(wd => {
      const nwd = normalizeDomain(wd);
      return nwd.startsWith('*.') ? normalized.endsWith(nwd.slice(2)) : normalized === nwd;
    });
  return false;
}

// --- Main logic: update layout based on settings and domain ---
function updateWideLayout() {
  const currentDomain = window.location.hostname;
  browser.storage.sync.get(['wideEnabled', 'githubDomains']).then(result => {
    const enabled = isDomainWhitelisted(currentDomain, result.githubDomains) &&
      (result.wideEnabled === undefined || result.wideEnabled);
    setWideLayout(enabled);
  });
}

// --- Listen for messages from popup/background ---
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.wideEnabled !== undefined || msg.wideUpdate) {
    // Delay to ensure storage is updated before reading
    setTimeout(updateWideLayout, 50);
  }
});

// --- SPA navigation and URL change detection ---
let lastUrl = location.href;
function checkUrlChange() {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    updateWideLayout();
    // Retry a few times for dynamic content
    let retries = 5;
    const interval = setInterval(() => {
      updateWideLayout();
      if (--retries <= 0) clearInterval(interval);
    }, 100);
  }
}

// --- Observe DOM mutations (fallback for SPA) ---
new MutationObserver(checkUrlChange).observe(document, { subtree: true, childList: true });

// --- Listen for history API navigation (popstate) ---
window.addEventListener('popstate', checkUrlChange);

// --- Patch pushState/replaceState to detect SPA navigation ---
(function(history) {
  const wrap = fn => function() {
    fn.apply(this, arguments);
    window.dispatchEvent(new Event('widegithub-urlchange'));
  };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
})(window.history);

window.addEventListener('widegithub-urlchange', checkUrlChange);

// --- Observe main content area for changes (tab switches, etc.) ---
function observeMainContent() {
  const main = document.querySelector('.application-main');
  if (main) {
    new MutationObserver(updateWideLayout).observe(main, { childList: true, subtree: true, attributes: true });
  }
}
observeMainContent();

// --- Re-observe if main content is replaced (rare, but possible) ---
new MutationObserver(observeMainContent).observe(document.documentElement, { childList: true, subtree: false });

// --- Listen for GitHub's own AJAX navigation events (pjax) ---
document.addEventListener('pjax:end', updateWideLayout);
document.addEventListener('DOMContentLoaded', updateWideLayout);

// --- Initial layout check ---
updateWideLayout();
