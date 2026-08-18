"use strict";

// Shared helpers (ext, isDomainWhitelisted, ...) are provided by shared.js,
// which is loaded first (see the "js" array in the manifests).

// Prevent flicker: hide body until layout is evaluated
document.documentElement.setAttribute('data-wide-github-init', '');

// --- Apply or remove wide layout class ---
function setWideLayout(enabled) {
  document.documentElement.classList.toggle('is-wide-github-enabled', !!enabled);
  document.documentElement.removeAttribute('data-wide-github-init');
}

// --- Main logic: update layout based on settings and domain ---
function updateWideLayout() {
  const currentDomain = window.location.hostname;
  ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
    const enabled = isDomainWhitelisted(currentDomain, result.githubDomains) &&
      result.wideEnabled !== false;
    setWideLayout(enabled);
  });
}

// Throttled variant for high-frequency events (DOM mutations): coalesces
// bursts of mutations into a single storage read + class update
let updateScheduled = false;
function scheduleUpdate() {
  if (updateScheduled) return;
  updateScheduled = true;
  setTimeout(() => {
    updateScheduled = false;
    updateWideLayout();
  }, 50);
}

// Initialize storage with default values if needed and run updateWideLayout after
ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
  if (result.wideEnabled === undefined)
    ext.storage.sync.set({ wideEnabled: true });
  if (!result.githubDomains)
    ext.storage.sync.set({ githubDomains: [] });
  // Run initial layout update after storage is ready
  updateWideLayout();
});

// --- Listen for messages from popup ---
ext.runtime.onMessage.addListener(msg => {
  if (msg.wideEnabled !== undefined || msg.wideUpdate) {
    scheduleUpdate();
  }
});

// --- SPA navigation and URL change detection ---
let lastUrl = location.href;
function checkUrlChange() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    updateWideLayout();
  }
}

new MutationObserver(checkUrlChange).observe(document, { subtree: true, childList: true });
window.addEventListener('popstate', checkUrlChange);

// GitHub re-renders the .application-main container on SPA navigation. Observe
// it once found, replacing the previous observer instead of stacking new ones.
let mainObserver = null;
function observeMainContent() {
  const main = document.querySelector('.application-main');
  if (!main) return;
  mainFinder.disconnect();
  if (mainObserver) mainObserver.disconnect();
  mainObserver = new MutationObserver(scheduleUpdate);
  mainObserver.observe(main, { childList: true, subtree: true });
}

// At document_start .application-main does not exist yet: watch the document
// until it appears (it is a persistent container, so this can then stop)
const mainFinder = new MutationObserver(observeMainContent);
mainFinder.observe(document.documentElement, { childList: true, subtree: true });
observeMainContent();

document.addEventListener('pjax:end', updateWideLayout);
document.addEventListener('DOMContentLoaded', updateWideLayout);
