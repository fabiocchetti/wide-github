"use strict";

// Shared helpers (ext, isDomainWhitelisted, getSettings) are provided by
// shared.js, which is loaded first (see the "js" array in the manifests).
//
// This can run twice in the same document: popup.js re-injects it to reach tabs
// that are already open, and an extension reload leaves the previous run behind
// with a dead context. Any previous instance is replaced rather than detected.
(() => {
  const previous = window.__wideGitHub;
  if (previous) {
    try { previous.dispose(); } catch (e) { /* previous context already gone */ }
  }

  // Prevent flicker: hide the page until the layout state is known, with a
  // failsafe so it can never stay hidden if the settings never arrive.
  const FLICKER_GUARD_MS = 1000;
  document.documentElement.setAttribute('data-wide-github-init', '');
  const flickerFailsafe = setTimeout(revealPage, FLICKER_GUARD_MS);

  function revealPage() {
    clearTimeout(flickerFailsafe);
    document.documentElement.removeAttribute('data-wide-github-init');
  }

  // The result depends only on the hostname and these two values, so once they
  // are cached the hot path is a classList.toggle and never touches storage.
  let settings = null;
  let classObserver = null;

  function applyLayout() {
    if (!settings) return;
    const enabled = settings.wideEnabled !== false &&
      isDomainWhitelisted(window.location.hostname, settings.githubDomains);
    document.documentElement.classList.toggle('is-wide-github-enabled', enabled);
    revealPage();
  }

  function refreshFromStorage() {
    try {
      getSettings(loaded => { settings = loaded; applyLayout(); });
    } catch (e) {
      revealPage(); // context invalidated: nothing to apply, but do not stay hidden
    }
  }

  // Re-read rather than trust the delta: a change can land while the first read
  // is still in flight. Settings change rarely enough for this to be free.
  function onStorageChanged(changes, area) {
    if (area === 'sync') refreshFromStorage();
  }

  // Answering also tells the popup a handler is live here, so it can skip
  // re-injecting (see applyToOpenTabs in popup.js).
  function onMessage(msg, sender, sendResponse) {
    if (msg && (msg.wideEnabled !== undefined || msg.wideUpdate)) {
      refreshFromStorage();
      sendResponse({ ok: true });
    }
  }

  function dispose() {
    if (classObserver) classObserver.disconnect();
    document.removeEventListener('turbo:load', applyLayout);
    document.removeEventListener('pjax:end', applyLayout);
    document.removeEventListener('DOMContentLoaded', applyLayout);
    window.removeEventListener('popstate', applyLayout);
    try { ext.storage.onChanged.removeListener(onStorageChanged); } catch (e) { /* context gone */ }
    try { ext.runtime.onMessage.removeListener(onMessage); } catch (e) { /* context gone */ }
  }

  // Register nothing unless both listeners attach: a half-installed instance
  // would look alive to the next injection while applying nothing.
  try {
    ext.storage.onChanged.addListener(onStorageChanged);
    ext.runtime.onMessage.addListener(onMessage);
  } catch (e) {
    revealPage();
    return;
  }

  // The stylesheet is static and keyed off the class, so re-renders cannot
  // invalidate the layout — only losing the class can. Toggling to the value
  // already set is a no-op, so this cannot loop.
  classObserver = new MutationObserver(applyLayout);
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('turbo:load', applyLayout);
  document.addEventListener('pjax:end', applyLayout);
  document.addEventListener('DOMContentLoaded', applyLayout);
  window.addEventListener('popstate', applyLayout);

  window.__wideGitHub = { dispose: dispose };

  refreshFromStorage();
})();
