# Changelog

**3.6.0**
- Added support for Microsoft Edge.
- Fixed adding custom domains on Firefox, which previously only worked through the ⚠ button.
- Domains granted while the browser closed the popup are now saved on the next popup open.
- Fixed a case where a page could stay blank if the settings failed to load.
- Fixed re-adding a domain with its tab still open; adding a domain now updates open tabs too.
- Repository "Projects" and "Issues" tabs are now full width.
- Settings are cached and kept in sync via storage events, replacing per-mutation storage reads and both document-wide MutationObservers.
- Custom domains now require Firefox 128+.

**3.5.0**
- Reworked the permissions model: the extension no longer requests access to all websites at install time. Access to custom domains is now optional and requested only when you add a domain, and is revoked when the domain is removed.
- Custom domains now activate immediately on already-open tabs, without requiring a page reload.
- Popup: added a ⚠ button to re-grant a missing domain permission (e.g. after an update or syncing settings to a new device).
- Popup: the current-domain section is now shown only when the site is not yet supported. Also improved accessibility (keyboard focus and ARIA labels) and dark mode contrast.
- Fixed domain-matching false positives (e.g. `notgithub.com` no longer matches `*.github.com`).
- Fixed the flicker-prevention CSS, which was not being applied, and a MutationObserver stacking issue.
- Performance: throttled layout updates and removed dead code. Custom domains now require Firefox 127+.

**3.4.0**
- Fixed PR discussion content wrapper ([Issue 40](https://github.com/fabiocchetti/wide-github/pull/40), thanks to [@e1four15f](https://github.com/e1four15f)).
- Popup now displays current domain status with quick-add button for unsupported domains.
- Fixed storage to ensure wide layout settings are fully loaded before applying styles.

**3.3.3**
- Fixed repository code page width ([Issue 37](https://github.com/fabiocchetti/wide-github/pull/37), thanks to [@mxgic1337](https://github.com/mxgic1337)).

**3.3.2**
- Improved compatibility with discussions and repository settings pages ([Issue 36](https://github.com/fabiocchetti/wide-github/pull/36), thanks to [@mxgic1337](https://github.com/mxgic1337)).

**3.3.1**
- Support July 2025 layout ([Issue #35](https://github.com/fabiocchetti/wide-github/pull/34), thanks to [@AetherUnbound](https://github.com/AetherUnbound)).

**3.3.0**
- Unified codebase for Firefox and Chrome.
- Removed outdated background script.
- Added universal API wrapper for cross-browser compatibility.
- Implemented a CSS fix to prevent accidental application on non-GitHub sites.
- Improved flickering issue on first load.
- Introduced some automation in building and packaging.
- Added Chrome Web Store links and mentions.

**3.2.0**
- Fixed real-time update of wide layout on custom domains.
- Improved messaging and domain handling logic.
- Optimized CSS and code structure for maintainability.
- Settings popup UI revamp, with dark mode support.

**3.1.0**
- Improved CSS compatibility with the new GitHub layout.
- Fixed flickering issue when switching between tabs.
- Improved URL and page navigation.
- General CSS refactoring and JS performance optimization.

**3.0.0**
- Extension re-built from the ground up with native Manifest V3 support.
- Added support to custom TLDs ([Issue #12](https://github.com/fabiocchetti/wide-github/issues/12)).
- Introduced settings panel to easily enable and disable the wide layout, and handle custom TLDs.

**2.5.0**
- Support GitHub Gist ([PR #27](https://github.com/fabiocchetti/wide-github/pull/27)—closes [issue #23](https://github.com/fabiocchetti/wide-github/issues/23), thanks to [@mxgic1337](https://github.com/mxgic1337)).

**2.4.0**
- Support [evolved GitHub issues](https://github.blog/changelog/2024-10-01-evolving-github-issues-public-beta/) ([Issue #25](https://github.com/fabiocchetti/wide-github/issues/25), thanks to [@AetherUnbound](https://github.com/AetherUnbound)).

**2.3.0**
- Improved support for the "Blame" view ([Issue #21](https://github.com/fabiocchetti/wide-github/issues/21)).
- Minor fixes and general CSS tweaks.

**2.2.0**
- Support new UI and the updated code panel ([Issue #19](https://github.com/fabiocchetti/wide-github/issues/19)).

**2.1.0**
- Added toggle button on the Firefox toolbar, so that Wide GitHub can now be enabled or disabled on specific pages ([Issue #7](https://github.com/fabiocchetti/wide-github/issues/7) and [Issue #15](https://github.com/fabiocchetti/wide-github/issues/15)).
- Fixed an issue that caused the comment dialog box on pull requests to be wider than the screen in some circumstances ([Issue #16](https://github.com/fabiocchetti/wide-github/issues/16)).
- Improved support for dark mode.

**2.0.0**
- Add-on CSS code complete refactoring.
- Support the new GitHub design released in 2020 ([Issue #8](https://github.com/fabiocchetti/wide-github/issues/8), [Issue #10](https://github.com/fabiocchetti/wide-github/issues/10) and [Issue #11](https://github.com/fabiocchetti/wide-github/issues/11)).
- Initial support for GitHub Enterprise ([Issue #5](https://github.com/fabiocchetti/wide-github/issues/5), thanks [@henrik242](https://github.com/henrik242)).
- Instead of using breakpoints, Wide GitHub now makes the page content always fit your screen width. No matter the display size ([Issue #9](https://github.com/fabiocchetti/wide-github/issues/9)).

**1.2.0**
- Native support for extra large displays ([Issue #4](https://github.com/fabiocchetti/wide-github/issues/4)).
- Several improvements to the CSS code.

**1.1.0**
- Support for private GitHub domains ([Issue #1](https://github.com/fabiocchetti/wide-github/issues/1)).
- [Project views](https://help.github.com/en/articles/about-project-boards) have been excluded. Wide GitHub should not be enabled there ([Issue #2](https://github.com/fabiocchetti/wide-github/issues/2)).
- Fixed bigger-than-expected images in user detail view. ([Issue #3](https://github.com/fabiocchetti/wide-github/issues/3)).

**1.0.1**
- Minor changes.

**1.0.0**
- Initial release.
