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
