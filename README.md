# Web Archive

A static browser tool and Chrome extension for archiving resources you are allowed to access.

## Website

- The homepage is [index.html](./index.html).
- ZIP generation uses a locally hosted JSZip build, so the ZIP engine itself does not depend on a third-party CDN.
- **Local files mode** packages selected files/folders entirely in your browser. It does not upload them.
- **Website URL mode** makes a best-effort request through public CORS relays. Those relays can be unavailable, and target websites can block or limit access. URL mode is not a full crawler and cannot retrieve login-only content, server-side code, private APIs, or resources blocked by the site.

### Publish with GitHub Pages

A deployment workflow is included at `.github/workflows/deploy-pages.yml`. If Pages is not already enabled for this repository, open **Settings → Pages**, select **GitHub Actions** as the build and deployment source, then save. The workflow deploys on pushes to `main` and can also be run manually from **Actions**. GitHub documents the source setting in [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Chrome extension

The extension source is in [sourcezip_extension](./sourcezip_extension/).

1. Download the repository ZIP and extract it.
2. Open `chrome://extensions` in desktop Chrome.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select `sourcezip_extension`.

The hosted website cannot inspect your active browser tab; use the extension for that workflow. The extension is not installable directly in regular Chrome for iOS.

## Privacy and responsible use

URL mode sends the target URL to a public third-party relay, which may see the URL and request. Do not enter private URLs or URLs containing access tokens. Only archive content you own or have permission to save. Neither version can bypass authentication or retrieve server-side/private data.
