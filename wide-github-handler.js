"use strict";

function handleWideGitHub(obj) {
    if (obj.activateWideGitHub) {
        document.body.classList.remove('is-github-wide-disabled');
    } else {
        document.body.classList.add('is-github-wide-disabled');
    }
}

browser.runtime.onMessage.addListener(request => {
    handleWideGitHub(request);
});

browser.runtime.sendMessage({
    reload: true
}, handleWideGitHub);
