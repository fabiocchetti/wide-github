"use strict";

// Shared helpers (ext, normalizeDomain, isDefaultDomain, isDomainWhitelisted,
// domainToMatchPattern, contentScriptId, getSettings) are provided by shared.js,
// which is loaded first (see popup.html).

const isValidDomain = d => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d);
const getDomainError = (d, list) =>
  !d || !isValidDomain(d) ? "Please enter a valid URL."
  : isDefaultDomain(d) ? "This URL is supported by default."
  : list.includes(d) ? "This URL was already added."
  : null;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// --- Helper to notify all tabs (including custom domains) ---
function notifyAllTabs(msg) {
  ext.tabs.query({}, tabs => {
    for (const tab of tabs) {
      ext.tabs.sendMessage(tab.id, msg, () => { void ext.runtime.lastError; });
    }
  });
}

// --- Register the content script for a custom domain (idempotent) ---
function ensureDomainScript(domain, callback) {
  const id = contentScriptId(domain);
  ext.scripting.getRegisteredContentScripts({ ids: [id] }, existing => {
    if (ext.runtime.lastError || (existing && existing.length > 0)) {
      if (callback) callback();
      return;
    }
    ext.scripting.registerContentScripts([{
      id: id,
      matches: [domainToMatchPattern(domain)],
      css: ['style.css'],
      js: ['shared.js', 'handler.js'],
      runAt: 'document_start',
      persistAcrossSessions: true
    }], () => {
      void ext.runtime.lastError;
      if (callback) callback();
    });
  });
}

// --- Request host permission for a domain ---
// Must be called synchronously from a user gesture: Firefox rejects
// permissions.request() outside of user-input handling, so it cannot wait for a
// callback (a storage read, for instance) first.
function requestDomainPermission(domain, callback) {
  ext.permissions.request({ origins: [domainToMatchPattern(domain)] }, granted => {
    if (ext.runtime.lastError) { callback(false); return; }
    callback(!!granted);
  });
}

// --- Apply the wide layout immediately to already-open tabs of a domain ---
// Registered content scripts only run on future page loads. Each tab is pinged
// first: one that answers already has a handler (the ping refreshes it), one
// that does not gets the scripts injected.
function applyToOpenTabs(domain) {
  ext.tabs.query({ url: domainToMatchPattern(domain) }, tabs => {
    if (ext.runtime.lastError || !tabs) return;
    for (const tab of tabs) {
      ext.tabs.sendMessage(tab.id, { wideUpdate: true }, response => {
        if (!ext.runtime.lastError && response) return;
        ext.scripting.insertCSS({ target: { tabId: tab.id }, files: ['style.css'] }, () => { void ext.runtime.lastError; });
        ext.scripting.executeScript({ target: { tabId: tab.id }, files: ['shared.js', 'handler.js'] }, () => { void ext.runtime.lastError; });
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM elements ---
  const wideToggle = document.getElementById('wide-toggle');
  const wideLabel = document.getElementById('wide-label');
  const domainInput = document.getElementById('domain-input');
  const addDomainBtn = document.getElementById('add-domain-btn');
  const domainList = document.getElementById('domain-list');
  const errorDiv = document.getElementById('domain-error');
  const currentDomainSection = document.getElementById('current-domain-section');
  const currentDomainName = document.getElementById('current-domain-name');
  const currentDomainStatus = document.getElementById('current-domain-status');
  const quickAddBtn = document.getElementById('quick-add-domain-btn');
  let currentDomains = [];
  let currentTabHost = null;
  let storageLoaded = false;

  // --- Update current domain display ---
  // The section is only useful as a nudge for unsupported domains:
  // it stays hidden when the current site is already covered
  function updateCurrentDomainDisplay() {
    if (!currentTabHost || !storageLoaded) return;
    const isSupported = isDomainWhitelisted(currentTabHost, currentDomains);
    if (isSupported) { currentDomainSection.style.display = 'none'; return; }
    currentDomainName.textContent = currentTabHost;
    currentDomainStatus.textContent = '⚠ Not configured';
    currentDomainStatus.className = 'status-warn';
    quickAddBtn.style.display = 'block';
    currentDomainSection.style.display = 'block';
  }

  // --- Get current active tab hostname (after DOM is ready) ---
  ext.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      try {
        currentTabHost = new URL(tabs[0].url).hostname;
        // The display is updated here if storage already loaded,
        // otherwise by the storage callback below
        updateCurrentDomainDisplay();
      } catch (e) {
        // Ignore invalid URLs (e.g., chrome://, about:)
      }
    }
  });

  // --- UI helpers ---
  const updateWideLabel = () => wideLabel.textContent = wideToggle.checked ? "Disable wide layout" : "Enable wide layout";
  const showError = msg => { errorDiv.textContent = msg; errorDiv.style.display = 'block'; domainInput.classList.add('error'); };
  const hideError = () => { errorDiv.textContent = ''; errorDiv.style.display = 'none'; domainInput.classList.remove('error'); };

  // --- SAFE rendering of domains (NO innerHTML) ---
  const renderDomains = (domains, syncOpenTabs) => {
    domainList.innerHTML = '';
    domains.forEach(d => {
      if (!isDefaultDomain(d)) {
        const li = document.createElement('li');
        li.className = 'domain-item';

        const span = document.createElement('span');
        span.className = 'domain-name-fade';
        span.textContent = d;

        const grantBtn = document.createElement('button');
        grantBtn.className = 'grant-btn';
        grantBtn.dataset.domain = d;
        grantBtn.textContent = '⚠';
        grantBtn.title = 'Permission needed: click to enable Wide GitHub on this domain';
        grantBtn.setAttribute('aria-label', `Grant permission for ${d}`);
        grantBtn.style.display = 'none';

        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.dataset.domain = d;
        btn.textContent = '×';
        btn.setAttribute('aria-label', `Remove ${d}`);

        li.appendChild(span);
        li.appendChild(grantBtn);
        li.appendChild(btn);
        domainList.appendChild(li);
      }
    });
    refreshDomainPermissions(syncOpenTabs);
  };

  // --- Sync domain rows with granted host permissions ---
  // Shows a warning button next to domains whose host permission is missing
  // (e.g. after an update or a settings sync to a new device) and registers the
  // content script for those that have it. syncOpenTabs also pushes the layout
  // into open tabs; only set on popup open, since doing it on every re-render
  // would message every tab of every domain on each add or delete.
  function refreshDomainPermissions(syncOpenTabs) {
    domainList.querySelectorAll('.grant-btn').forEach(grantBtn => {
      const domain = grantBtn.dataset.domain;
      ext.permissions.contains({ origins: [domainToMatchPattern(domain)] }, granted => {
        grantBtn.style.display = granted ? 'none' : 'block';
        if (!granted) return;
        ensureDomainScript(domain);
        if (syncOpenTabs) applyToOpenTabs(domain);
      });
    });
  }

  // --- Finish an add that the permission prompt interrupted ---
  // The prompt can close the popup, killing this script before the domain
  // reaches storage. Only the domain tryAddDomain() recorded is adopted, never a
  // permission granted through the browser's own site-access UI.
  function reconcilePendingDomain() {
    ext.storage.local.get('pendingDomain', result => {
      const pending = result && result.pendingDomain ? normalizeDomain(result.pendingDomain) : null;
      if (!pending) return;
      if (currentDomains.includes(pending)) { ext.storage.local.remove('pendingDomain'); return; }
      ext.permissions.contains({ origins: [domainToMatchPattern(pending)] }, granted => {
        ext.storage.local.remove('pendingDomain');
        if (ext.runtime.lastError || !granted) return;
        storeDomain(pending, true);
      });
    });
  }

  // --- Add button state and validation ---
  function updateAddButtonState(showErrorMsg = false) {
    const raw = domainInput.value.trim(), domain = normalizeDomain(raw), error = getDomainError(domain, currentDomains);
    if (!raw) { hideError(); addDomainBtn.disabled = true; return; }
    if (error) { showErrorMsg ? showError(error) : hideError(); addDomainBtn.disabled = true; return; }
    hideError(); addDomainBtn.disabled = false;
  }

  const debouncedError = debounce(() => updateAddButtonState(true), 2000);

  // --- Initial load from storage ---
  getSettings(settings => {
    wideToggle.checked = settings.wideEnabled !== false;
    updateWideLabel();
    currentDomains = settings.githubDomains.map(normalizeDomain);
    storageLoaded = true;
    renderDomains(currentDomains, true);
    updateCurrentDomainDisplay();
    updateAddButtonState();
    reconcilePendingDomain();
  });

  // --- Wide toggle logic ---
  wideToggle.addEventListener('change', () => {
    updateWideLabel();
    ext.storage.sync.set({ wideEnabled: wideToggle.checked }, () => {
      notifyAllTabs({ wideEnabled: wideToggle.checked });
    });
  });

  // --- Input and button events ---
  domainInput.addEventListener('input', () => { updateAddButtonState(false); debouncedError(); });
  domainInput.addEventListener('blur', () => updateAddButtonState(true));
  addDomainBtn.addEventListener('click', tryAddDomain);
  domainInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryAddDomain(); });

  // --- Domain removal and permission re-grant ---
  domainList.addEventListener('click', e => {
    const domain = e.target.dataset.domain;
    if (!domain) return;
    if (e.target.classList.contains('delete-btn')) {
      ext.storage.sync.get('githubDomains', result => {
        const domains = (result.githubDomains || []).map(normalizeDomain).filter(d => d !== domain);
        ext.storage.sync.set({ githubDomains: domains }, () => {
          ext.scripting.unregisterContentScripts({ ids: [contentScriptId(domain)] }, () => { void ext.runtime.lastError; });
          ext.permissions.remove({ origins: [domainToMatchPattern(domain)] }, () => { void ext.runtime.lastError; });
          currentDomains = domains;
          renderDomains(domains);
          updateAddButtonState();
          updateCurrentDomainDisplay();
          notifyAllTabs({ wideUpdate: true });
        });
      });
    } else if (e.target.classList.contains('grant-btn')) {
      requestDomainPermission(domain, granted => {
        if (granted) {
          ensureDomainScript(domain);
          applyToOpenTabs(domain);
          e.target.style.display = 'none';
          notifyAllTabs({ wideUpdate: true });
        }
      });
    }
  });

  // --- Quick-add current domain button ---
  quickAddBtn.addEventListener('click', () => {
    if (currentTabHost) {
      domainInput.value = currentTabHost;
      tryAddDomain();
    }
  });

  // --- Add domain logic ---
  // The permission is requested first, straight from the gesture (see
  // requestDomainPermission). If the prompt closes the popup before the domain
  // is stored, reconcilePendingDomain() finishes the add on the next open.
  function tryAddDomain() {
    const raw = domainInput.value.trim(), domain = normalizeDomain(raw), error = getDomainError(domain, currentDomains);
    if (error) { showError(error); updateAddButtonState(); return; }
    // Recorded without awaiting the write, so the request stays in the gesture
    ext.storage.local.set({ pendingDomain: domain });
    requestDomainPermission(domain, granted => storeDomain(domain, granted));
  }

  function storeDomain(domain, granted) {
    ext.storage.local.remove('pendingDomain');
    ext.storage.sync.get('githubDomains', result => {
      const domains = (result.githubDomains || []).map(normalizeDomain);
      if (!domains.includes(domain)) domains.push(domain);
      ext.storage.sync.set({ githubDomains: domains }, () => {
        currentDomains = domains;
        renderDomains(domains);
        domainInput.value = '';
        hideError();
        updateAddButtonState();
        updateCurrentDomainDisplay();
        if (granted) {
          ensureDomainScript(domain);
          applyToOpenTabs(domain);
          notifyAllTabs({ wideUpdate: true });
        } else {
          showError("Permission not granted: click ⚠ next to the domain to retry.");
        }
      });
    });
  }
});
