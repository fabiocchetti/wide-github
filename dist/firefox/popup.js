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

const DEFAULT_DOMAINS = [
  'github.com', 'gist.github.com', '*.github.com', '*.github.io'
];

const normalizeDomain = d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
const isDefaultDomain = d => DEFAULT_DOMAINS.some(dom => dom.startsWith('*.') ? normalizeDomain(d).endsWith(dom.slice(2)) : normalizeDomain(d) === dom);
const isValidDomain = d => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d);
const getDomainError = (d, list) =>
  !d || !isValidDomain(d) ? "Please enter a valid URL."
  : isDefaultDomain(d) ? "This URL is supported by default."
  : list.includes(d) ? "This URL was already added."
  : null;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// --- Helper to notify all tabs (including custom TLDs) ---
function notifyAllTabs(msg) {
  ext.tabs.query({}, tabs => {
    for (const tab of tabs) {
      ext.tabs.sendMessage(tab.id, msg, () => {});
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
  let currentDomains = [];

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

        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.dataset.domain = d;
        btn.textContent = '×';

        li.appendChild(span);
        li.appendChild(btn);
        domainList.appendChild(li);
      }
    });
  };

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
    renderDomains(currentDomains);
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

  // --- Domain removal ---
  domainList.addEventListener('click', e => {
    if (e.target.classList.contains('delete-btn')) {
      const domain = e.target.dataset.domain;
      ext.storage.sync.get('githubDomains', result => {
        let domains = (result.githubDomains || []).map(normalizeDomain).filter(d => d !== domain);
        ext.storage.sync.set({ githubDomains: domains }, () => {
          currentDomains = domains;
          renderDomains(domains);
          updateAddButtonState();
          notifyAllTabs({ wideUpdate: true });
        });
      });
    }
  });

  // --- Add domain logic ---
  function tryAddDomain() {
    const raw = domainInput.value.trim(), domain = normalizeDomain(raw), error = getDomainError(domain, currentDomains);
    if (error) { showError(error); updateAddButtonState(); return; }
    ext.storage.sync.get('githubDomains', result => {
      let domains = (result.githubDomains || []).map(normalizeDomain);
      const duplicateError = getDomainError(domain, domains);
      if (duplicateError) { showError(duplicateError); updateAddButtonState(); return; }
      domains.push(domain);
      ext.storage.sync.set({ githubDomains: domains }, () => {
        currentDomains = domains;
        renderDomains(domains);
        domainInput.value = '';
        hideError();
        updateAddButtonState();
        notifyAllTabs({ wideUpdate: true });
      });
    });
  }
});
