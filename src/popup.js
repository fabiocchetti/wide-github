"use strict";

// Shared helpers (ext, normalizeDomain, isDefaultDomain, isDomainWhitelisted,
// domainToMatchPattern, contentScriptId) are provided by shared.js,
// which is loaded first (see popup.html).

// Initialize storage with default values if needed
ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
  if (result.wideEnabled === undefined)
    ext.storage.sync.set({ wideEnabled: true });
  if (!result.githubDomains)
    ext.storage.sync.set({ githubDomains: [] });
});

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
// Must be called synchronously from a user gesture (click / keydown)
function requestDomainPermission(domain, callback) {
  ext.permissions.request({ origins: [domainToMatchPattern(domain)] }, granted => {
    if (ext.runtime.lastError) { callback(false); return; }
    callback(!!granted);
  });
}

// --- Apply the wide layout immediately to already-open tabs of a domain ---
// Registered content scripts only run on future page loads, so tabs that are
// already open when the permission is granted need a manual injection
function applyToOpenTabs(domain) {
  ext.tabs.query({ url: domainToMatchPattern(domain) }, tabs => {
    for (const tab of tabs) {
      ext.scripting.insertCSS({ target: { tabId: tab.id }, files: ['style.css'] }, () => { void ext.runtime.lastError; });
      ext.scripting.executeScript({ target: { tabId: tab.id }, files: ['shared.js', 'handler.js'] }, () => { void ext.runtime.lastError; });
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
  const renderDomains = domains => {
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
    refreshDomainPermissions();
  };

  // --- Sync domain rows with granted host permissions ---
  // Shows a warning button next to domains whose host permission is missing
  // (e.g. after an update or a settings sync to a new device) and makes sure
  // the content script is registered for domains that already have it
  function refreshDomainPermissions() {
    domainList.querySelectorAll('.grant-btn').forEach(grantBtn => {
      const domain = grantBtn.dataset.domain;
      ext.permissions.contains({ origins: [domainToMatchPattern(domain)] }, granted => {
        grantBtn.style.display = granted ? 'none' : 'block';
        if (granted) ensureDomainScript(domain);
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
  ext.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
    wideToggle.checked = result.wideEnabled !== false;
    updateWideLabel();
    currentDomains = (result.githubDomains || []).map(normalizeDomain);
    storageLoaded = true;
    renderDomains(currentDomains);
    updateCurrentDomainDisplay();
    updateAddButtonState();
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
  // The domain is saved to storage BEFORE requesting the host permission:
  // the browser may close the popup to show the permission prompt, killing
  // this script mid-flow. With storage-first, reopening the popup always
  // shows a consistent state (the domain is listed, with ⚠ if the
  // permission is still missing, ready to be granted with a click).
  function tryAddDomain() {
    const raw = domainInput.value.trim(), domain = normalizeDomain(raw), error = getDomainError(domain, currentDomains);
    if (error) { showError(error); updateAddButtonState(); return; }
    ext.storage.sync.get('githubDomains', result => {
      const domains = (result.githubDomains || []).map(normalizeDomain);
      const duplicateError = getDomainError(domain, domains);
      if (duplicateError) { showError(duplicateError); updateAddButtonState(); return; }
      domains.push(domain);
      ext.storage.sync.set({ githubDomains: domains }, () => {
        currentDomains = domains;
        renderDomains(domains);
        domainInput.value = '';
        hideError();
        updateAddButtonState();
        updateCurrentDomainDisplay();
        requestDomainPermission(domain, granted => {
          if (granted) {
            ensureDomainScript(domain);
            applyToOpenTabs(domain);
          } else {
            showError("Permission not granted: click ⚠ next to the domain to retry.");
          }
        });
      });
    });
  }
});
