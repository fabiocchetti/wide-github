<img src="assets/Wide-GitHub_Logo.png?raw=true" alt="Wide GitHub Logo" width="583" height="300" />

<a href="https://addons.mozilla.org/en-US/firefox/addon/widegithub">
  <img src="assets/firefox-get-the-addon.png" alt="Download add-on on Mozilla.org" width="129" height="45" />
</a>

# Wide GitHub

A browser extension that makes GitHub’s layout wide, enhancing readability, reducing vertical scrolling, and improving accessibility.

It works on GitHub, private Gists, GitHub Enterprise, and custom TLDs (Firefox 109+ required for custom TLD support).

## Features

- Makes GitHub's layout wide
- Supports custom domains
- Toggle on/off with a single click
- Syncs settings across devices (Firefox Sync / Chrome Sync)
- Supports SPA navigation and tab switches

## Installation

### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/widegithub/)
2. Click "Add to Firefox"
3. Confirm the installation

### Chrome
_Currently WIP_ 

## Usage

1. Click the extension icon in your browser's toolbar
2. Toggle the switch to enable/disable the wide layout
3. Add custom domains in the popup if needed

## Custom Domains

You can add custom domains where you want the wide layout to be applied:

1. Click the extension icon
2. Enter the domain in the input field (e.g., `github.com`)
3. Click "Add" or press Enter

The extension will automatically handle:
- Subdomains (e.g., `docs.github.com`)
- WWW redirects (e.g., `www.github.com`)
- Protocol changes (http/https)

## Development

The extension is available in ~~two~~ one version:

- `firefox/`: Firefox version
- ~~`chrome/`: Chrome version~~ _Work in Progress_

Both versions share the same core functionality but are adapted to their respective browser's APIs.

### Building

1. Clone the repository
2. Navigate to either `firefox/` or `chrome/` directory
3. Make your changes
4. Test the extension in your browser

### Testing

#### Firefox
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file from the `firefox/` directory

#### Chrome
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome/` directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Changelog

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
