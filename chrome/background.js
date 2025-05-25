"use strict";

// --- Initialize storage with default values ---
chrome.storage.sync.get(['wideEnabled', 'githubDomains'], result => {
  if (result.wideEnabled === undefined)
    chrome.storage.sync.set({ wideEnabled: true });
  if (!result.githubDomains)
    chrome.storage.sync.set({ githubDomains: [] });
});

// --- Handle toolbar icon click ---
chrome.action.onClicked.addListener(tab => {
  chrome.storage.sync.get('wideEnabled', result => {
    const newState = !result.wideEnabled;
    chrome.storage.sync.set({ wideEnabled: newState });
    chrome.action.setTitle({
      title: newState ? 'Wide GitHub: Enabled' : 'Wide GitHub: Disabled'
    });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0])
        chrome.tabs.sendMessage(tabs[0].id, { wideEnabled: newState });
    });
  });
});
