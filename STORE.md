# Store Listings

## Name

```
Wide GitHub
```

## Summary

**Firefox**
```
Makes GitHub wide on Mozilla Firefox. Supports GitHub, private Gists, GitHub Enterprise, and custom domains (TLDs).
```

**Chrome**
```
Makes GitHub wide on Google Chrome. Supports GitHub, private Gists, GitHub Enterprise, and custom domains (TLDs).
```

**Edge**
```
Makes GitHub wide on Microsoft Edge. Supports GitHub, private Gists, GitHub Enterprise, and custom domains (TLDs).
```

## Description

```
Wide GitHub stretches GitHub's layout to the full width of your browser window, enhancing readability, reducing vertical scrolling, and improving accessibility.

Code diffs and pull request reviews stop being squeezed into a narrow column, file trees and issue threads get room to breathe, and large displays are finally put to use.

How it works:
1. Open GitHub: the wide layout is already on.
2. Click the Wide GitHub icon to switch it off or on again.
3. Using GitHub Enterprise or a self-hosted instance? Add its domain from the same popup.

What you get:
• Full-width code, diffs, pull requests, issues and discussions
• Works on GitHub, private Gists, GitHub Pages and GitHub Enterprise
• Custom domains for self-hosted instances
• One-click on/off toggle
• Preferences that follow you across devices through your browser's built-in sync

Your privacy:
Wide GitHub collects no data: no analytics, no tracking, no external servers. By default it runs only on GitHub, Gist and GitHub Pages. Access to any other site is optional, and requested only when you add a custom domain yourself.

Good to know:
• Each custom domain asks for permission when you add it, and removing it revokes that permission.
• If GitHub redesigns a page, parts of the layout may need an update to catch up.

Free and open source under the GNU GPL v3 license.
Source code and issues: https://github.com/fabiocchetti/wide-github
Privacy policy: https://visiomultimedia.com/en/extensions-privacy-policy/#wide-github

Wide GitHub is an independent project, not affiliated with or endorsed by GitHub. GitHub is a trademark of GitHub, Inc.
```

## Edge Search Terms

```
github
github wide
github enterprise
full width
```

## Permission Justifications

**storage**
```
Stores two settings: whether the wide layout is on or off, and the list of custom domains the user has added. Kept in storage.sync so the preferences follow the user's own browser profile. No browsing history and no page content is stored.
```

**scripting**
```
Registers the wide-layout stylesheet on the custom domains the user adds from the popup. Those domains are a GitHub Enterprise or self-hosted address that cannot be known at install time, so the content script is registered at runtime and unregistered when the domain is removed.
```

**activeTab**
```
Reads the domain of the tab the user is currently viewing when the popup is opened, so the popup can say whether that site is already supported and offer to add it. No other tab is accessed and no page content is read.
```

**Host permissions (GitHub, Gist, GitHub Pages)**
```
The stylesheet that widens the layout must be injected into the GitHub page itself. Access is limited to github.com, gist.github.com, other github.com subdomains and github.io; no other site is matched at install time.
```

**Optional host permissions**
```
Requested at runtime, and only for the single domain the user types into the popup to support a GitHub Enterprise or self-hosted instance. It is never requested at install time and never broadly: a user who only visits github.com is never asked. Removing the domain from the list revokes the permission.
```

**Single purpose**
```
Make GitHub's layout use the full width of the browser window, on GitHub and on the GitHub Enterprise or self-hosted domains the user adds.
```

## Notes for Reviewers

```
No account or configuration is needed to review the extension: open any repository or pull request on github.com and the page content fills the window width. The toolbar popup switches the wide layout off and on again, and accepts a domain for a GitHub Enterprise or self-hosted instance.

The extension is unminified and has no build step beyond copying the shared sources in src/ next to the browser's manifest: what is in the package is exactly what runs. There are no remote scripts, no eval and no network requests of any kind — the extension only injects a stylesheet and reads its own settings.

Access to a custom domain is an optional permission, requested with permissions.request() at the click that adds the domain and revoked when the domain is removed, so a reviewer who adds no domain is never asked for anything beyond GitHub.

Source: https://github.com/fabiocchetti/wide-github
```

## Screenshots

In `assets/`, in upload order. `Wide-GitHub_Screenshot-Alt-Repo-1280x800.png` is an alternative to the first one.

1. `GitHub using the full width of the window, instead of a narrow column`
2. `The popup: one switch, plus the domains you add yourself`
3. `The same popup in dark theme`
