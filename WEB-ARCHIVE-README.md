# Web Archive

A small browser-based website archiver, plus a Chrome extension for collecting resources from the active tab.

## Website
Open the GitHub Pages website after enabling Pages in **Settings → Pages → Deploy from a branch → main → /(root)**. The site is designed for static hosting and does not require a backend.

- **Website URL mode:** attempts to fetch a public page and linked assets through the public AllOrigins CORS relay. This is best-effort; many sites block relays, require authentication, or refuse cross-origin access. Do not enter private URLs or anything containing tokens.
- **Local files mode:** ZIPs files/folders you select directly in your browser. These files are not uploaded.
- ZIP creation uses JSZip from jsDelivr, so an internet connection is required.

## Chrome extension
The extension is in [sourcezip_extension](./sourcezip_extension/). In Chrome desktop:
1. Download the repository ZIP and extract it.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose `sourcezip_extension`.

## Limits and responsible use
This does not clone an entire website. It cannot obtain server-side source code, private APIs/databases, login-only content, or resources that are blocked or inaccessible. URL mode is not a replacement for the extension: ordinary websites cannot inspect another browser tab, and browser security/CORS limits what a hosted page can fetch. Only archive material you own or have permission to save.