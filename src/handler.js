"use strict";

// Cross-browser API wrapper
const ext = typeof browser !== "undefined" ? browser : chrome;

// Initialize storage with default values if needed
ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
  if (result.wideEnabled === undefined)
    ext.storage.sync.set({ wideEnabled: true });
  if (!result.githubDomains)
    ext.storage.sync.set({ githubDomains: [] });
});

// Prevent flicker: hide body until layout is evaluated
document.documentElement.setAttribute('data-wide-github-init', '');

const DEFAULT_DOMAINS = [
  'github.com', 'gist.github.com', '*.github.com', '*.github.io'
];

const normalizeDomain = d => d.replace(/^www\./, '').replace(/\/$/, '');
const isDefaultDomain = d => DEFAULT_DOMAINS.some(dom => dom.startsWith('*.') ? normalizeDomain(d).endsWith(dom.slice(2)) : normalizeDomain(d) === dom);

// --- Apply or remove wide layout class ---
function setWideLayout(enabled) {
  document.documentElement.classList.toggle('is-wide-github-enabled', !!enabled);
  document.documentElement.removeAttribute('data-wide-github-init');
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
  ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
    const enabled = isDomainWhitelisted(currentDomain, result.githubDomains) &&
      (result.wideEnabled === undefined || result.wideEnabled);
    setWideLayout(enabled);
  });
}

// --- Listen for messages from popup ---
ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.wideEnabled !== undefined || msg.wideUpdate) {
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
    let retries = 5;
    const interval = setInterval(() => {
      updateWideLayout();
      if (--retries <= 0) clearInterval(interval);
    }, 100);
  }
}

new MutationObserver(checkUrlChange).observe(document, { subtree: true, childList: true });
window.addEventListener('popstate', checkUrlChange);

(function(history) {
  const wrap = fn => function() {
    fn.apply(this, arguments);
    window.dispatchEvent(new Event('widegithub-urlchange'));
  };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
})(window.history);

window.addEventListener('widegithub-urlchange', checkUrlChange);

function observeMainContent() {
  const main = document.querySelector('.application-main');
  if (main) {
    new MutationObserver(updateWideLayout).observe(main, { childList: true, subtree: true, attributes: true });
  }
}
observeMainContent();
new MutationObserver(observeMainContent).observe(document.documentElement, { childList: true, subtree: false });

document.addEventListener('pjax:end', updateWideLayout);
document.addEventListener('DOMContentLoaded', updateWideLayout);

updateWideLayout();
