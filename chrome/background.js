"use strict";

// Initialize storage with default values
chrome.storage.sync.get(['wideEnabled', 'githubDomains'], function(result) {
  if (result.wideEnabled === undefined) {
    chrome.storage.sync.set({ wideEnabled: true });
  }
  if (!result.githubDomains) {
    chrome.storage.sync.set({ githubDomains: ['github.com'] });
  }
});

// Listen for icon clicks
chrome.action.onClicked.addListener(function(tab) {
  chrome.storage.sync.get('wideEnabled', function(result) {
    const newState = !result.wideEnabled;
    chrome.storage.sync.set({ wideEnabled: newState });
    
    // Update icon title
    chrome.action.setTitle({
      title: newState ? 'Wide GitHub: Enabled' : 'Wide GitHub: Disabled'
    });

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { wideEnabled: newState });
      }
    });
  });
});
