# Web Archive

A browser-based website archiver plus a Chrome extension for the active tab.

## Website features

- **Local files:** select files or a folder and create a ZIP entirely in your browser; files are not uploaded.
- **Public URL capture:** tries multiple public CORS relays to fetch the page and linked resources.
- **Offline-friendly paths:** rewrites successfully captured HTML asset references and stylesheet URLs to files inside the ZIP.
- **Capture manifest:** every URL-mode ZIP includes `archive-manifest.json`, listing saved and skipped resources.
- **Local ZIP engine:** JSZip is hosted in this repository under `vendor/`, not loaded from a CDN.

## Publish

A GitHub Pages workflow lives at `.github/workflows/deploy-pages.yml`. If Pages is not enabled yet, open **Settings → Pages** and select **GitHub Actions** as the source. After that, pushes to `main` automatically trigger a deployment. See the [GitHub Pages source configuration guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Chrome extension

The extension is in [sourcezip_extension](./sourcezip_extension/). On desktop Chrome:

1. Download the repository ZIP and extract it.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose `sourcezip_extension`.

## Important limitations

A static GitHub Pages app cannot bypass browser security or inspect another open tab. URL capture depends on public relays, and some relays may be unavailable or block requests. Some assets will be skipped if inaccessible. Offline copies may still fail when the site relies on dynamic APIs, authentication, scripts with relative imports, service workers, or server-side behavior. No private backend code or database can be recovered. Public relays can see requested URLs, so do not use private links or URLs with access tokens. Only archive content you own or have permission to save.
