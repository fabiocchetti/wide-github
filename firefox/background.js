"use strict";

// --- Initialize storage with default values ---
browser.storage.sync.get(['wideEnabled', 'githubDomains']).then(result => {
  if (result.wideEnabled === undefined)
    browser.storage.sync.set({ wideEnabled: true });
  if (!result.githubDomains)
    browser.storage.sync.set({ githubDomains: [] });
});

// --- Handle toolbar icon click ---
browser.action.onClicked.addListener(tab => {
  browser.storage.sync.get('wideEnabled').then(result => {
    const newState = !result.wideEnabled;
    browser.storage.sync.set({ wideEnabled: newState });
    browser.action.setTitle({
      title: newState ? 'Wide GitHub: Enabled' : 'Wide GitHub: Disabled'
    });
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0])
        browser.tabs.sendMessage(tabs[0].id, { wideEnabled: newState });
    });
  });
});
