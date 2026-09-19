<img src="assets/Wide-GitHub_Logo.png" alt="Wide GitHub" width="583" height="300" />

**Make GitHub's layout use the full width of your screen.**

A browser extension that stretches GitHub's layout to the full width of your browser window, enhancing readability, reducing vertical scrolling, and improving accessibility. Works on GitHub, private Gists, GitHub Pages, GitHub Enterprise and any self-hosted domain you add.

<p>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/widegithub/"><img src="assets/Wide-GitHub_Firefox-Badge.png" alt="Get the Firefox add-on" width="129" height="45" /></a>
  <br/>
  <a href="https://chromewebstore.google.com/detail/wide-github/hohnneiphpemlbhmiiipkfjnfhmnobpo"><img src="assets/Wide-GitHub_Chrome-Badge.png" alt="Available in the Chrome Web Store" width="159" height="45" /></a>
  <br/>
  <a href="https://microsoftedge.microsoft.com/addons/detail/wide-github/knlkpiffilginhfpmliommpcelfplbgl"><img src="assets/Wide-GitHub_Edge-Badge.png" alt="Get it on Edge Add-ons" width="151" height="45" /></a>
</p>

---

## Features

- **Full-Width Layout** — Code, diffs, pull requests, issues and discussions use all the room your screen has
- **Custom Domains** — Add GitHub Enterprise or any self-hosted instance from the popup
- **One-Click Toggle** — Switch the wide layout on or off from the toolbar
- **Synced Settings** — Preferences follow you across devices via Firefox Sync, Chrome Sync or Edge Sync
- **Seamless Navigation** — Keeps working across GitHub's in-page navigation and tab switches
- **Privacy-First** — No data collection; access to any site beyond GitHub is optional and requested per domain

---

## Installation

### From Extension Stores

**Firefox Add-ons:** [Wide GitHub](https://addons.mozilla.org/en-US/firefox/addon/widegithub/)  
**Chrome Web Store:** [Wide GitHub](https://chromewebstore.google.com/detail/wide-github/hohnneiphpemlbhmiiipkfjnfhmnobpo)  
**Microsoft Edge Add-ons:** [Wide GitHub](https://microsoftedge.microsoft.com/addons/detail/wide-github/knlkpiffilginhfpmliommpcelfplbgl)

### From Source (Developer Mode)

Build the extension first (see [Development](#development)), then load the folder for your browser from `dist/`.

**Chrome / Edge / Chromium-based browsers:**
1. Open your browser's extensions page (`chrome://extensions` or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select `dist/chrome` (or `dist/edge`)

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** and select `dist/firefox/manifest.json`

Note: Temporary Firefox add-ons are removed when Firefox restarts.

---

## Usage

1. Click the extension icon in your browser's toolbar
2. Toggle the switch to enable or disable the wide layout
3. Add custom domains in the popup if needed

### Custom Domains

You can add custom domains where you want the wide layout to be applied:

1. Click the extension icon
2. Enter the domain in the input field (e.g., `git.mycompany.com`)
3. Click "Add" or press Enter
4. Confirm the browser's permission request for that domain

Access to each custom domain is optional and is requested only when you add it; removing a domain from the list also revokes the permission.

The extension will automatically handle:
- Subdomains (e.g., `docs.github.com`)
- WWW redirects (e.g., `www.github.com`)
- Protocol changes (http/https)

---

## Requirements & Limitations

- **Browser:** Firefox, Chrome, Edge, or any Chromium-based browser with Manifest V3 support. Custom domains require Firefox 128+
- **Layout-Dependent:** Wide GitHub restyles GitHub's own markup, so a major GitHub redesign can break parts of the layout until an update ships
- **Permissions:** `storage`, `scripting` and `activeTab`, plus host access to GitHub, Gist and GitHub Pages. Access to any other domain is optional, requested only when you add it

---

## Privacy

- **No Data Collection:** No analytics, no tracking, no external servers
- **Minimal Storage:** Only the on/off preference and your list of custom domains, synced through your browser's built-in sync if enabled
- **Optional Permissions:** Access to a custom domain is requested when you add it and revoked when you remove it
- **Privacy Policy:** See [PRIVACY.md](PRIVACY.md)

---

## Troubleshooting

**The popup closed while adding a domain:**
- The browser may close the popup to show the permission request. Reopen it: if you granted access, the domain is already in the list

**A domain shows a ⚠ button:**
- The permission for that domain is missing (e.g. after an update, a declined request, or a settings sync to a new device). Click ⚠ to grant it again

**The layout looks broken on a page:**
- GitHub may have changed its markup. Please [open an issue](https://github.com/fabiocchetti/wide-github/issues) with the page URL and a screenshot

---

## Development

All source code is in the `src/` folder and is shared between the Chrome, Firefox and Edge builds.  
Manifest files are separate for each browser, and the tests live in `test/`.

### Setup

If you just cloned the repository, make the build scripts executable:

```sh
chmod +x build.sh package.sh test.sh
```

### Build

To build the extension for all supported browsers:

```sh
./build.sh
```

This will generate the folders `dist/firefox`, `dist/chrome` and `dist/edge` with the ready-to-use extension files.

### Test

To run the test suite:

```sh
./test.sh
```

The domain-matching and settings tests need nothing beyond Node. The `style.css`
selector tests, which check the layout rules against fixtures taken from real
GitHub markup, additionally need jsdom and skip themselves without it:

```sh
cd test && npm install
```

### Package

To create ZIP files for release (excluding system and dev files):

```sh
./package.sh
```

This will create `wide-github-firefox.zip`, `wide-github-chrome.zip` and `wide-github-edge.zip` in the project root, ready for upload to the stores.

---

## To Do

Nothing planned for now. Feature suggestions are welcome: please [open an issue](https://github.com/fabiocchetti/wide-github/issues).

---

## Contributing

Contributions welcome! Please:
- Run `./test.sh` before submitting, and add a fixture test for new layout rules
- Test changes on Firefox and at least one Chromium-based browser
- Follow existing code style and patterns

For bugs, feature requests or questions, please [open an issue](https://github.com/fabiocchetti/wide-github/issues).

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE) file for details.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
