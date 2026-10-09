# Web Archive

A browser-based website archiver **and** Chrome extension.

## Open the website
The site is in the repository root:
- [Open index.html](./index.html)
- [Website setup and limitations](./WEB-ARCHIVE-README.md)

To publish it as a live GitHub Pages site, open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then Save. GitHub will show the public website URL on that same page after deployment.

## Chrome extension
Extension files: [sourcezip_extension](./sourcezip_extension/)

1. Download this repository using **Code → Download ZIP** and extract it.
2. Open `chrome://extensions` in desktop Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `sourcezip_extension` folder.

## Important limitations
The hosted website cannot inspect another browser tab. Its URL mode uses a public CORS relay and may fail on sites that block relays or require login. Local-files mode makes a ZIP from files you select. The Chrome extension can collect more resources from the active tab, but neither version can recover private/server-side code or restricted content. Only archive material you have permission to save.
