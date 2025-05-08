"use strict";

var toggle = true;

function onError(error) {
    console.error(`Error: ${error}`);
}

function handleTabs(tabs) {
    toggle = !toggle;
    browser.browserAction.setIcon({
        path: (toggle ? "icons/wide-github-96.png" : "icons/wide-github-disabled.png")
    });
    browser.browserAction.setTitle({
        title: (toggle ? "Enable Wide GitHub" : "Disable Wide GitHub")
    });
    for (let tab of tabs) {
        browser.tabs.sendMessage(
            tab.id, {
                activateWideGitHub: toggle
            }
        ).catch(onError);
    }
}

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(handleTabs).catch(onError);
});

// Initialize storage with default values
browser.storage.sync.get(['wideEnabled', 'githubDomains']).then(result => {
  if (result.wideEnabled === undefined) {
    browser.storage.sync.set({ wideEnabled: true });
  }
  if (!result.githubDomains) {
    browser.storage.sync.set({ githubDomains: ['github.com'] });
  }
});

// Listen for icon clicks
browser.action.onClicked.addListener(tab => {
  browser.storage.sync.get('wideEnabled').then(result => {
    const newState = !result.wideEnabled;
    browser.storage.sync.set({ wideEnabled: newState });
    
    // Update icon title
    browser.action.setTitle({
      title: newState ? 'Wide GitHub: Enabled' : 'Wide GitHub: Disabled'
    });

    // Send message to content script
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { wideEnabled: newState });
      }
    });
  });
});
