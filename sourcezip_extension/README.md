# SourceZip — Fire Download

Chrome Manifest V3 extension to export a webpage's rendered DOM and accessible loaded resources into a ZIP.

## Install
1. Download this repository as a ZIP and extract it.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked** and choose the `sourcezip_extension` folder.
5. Open an HTTP/HTTPS page, click the extension, then **FIRE DOWNLOAD**.

## Limits
This captures rendered HTML and browser-accessible resources. Some cross-origin, authenticated, or large resources may fail. It cannot retrieve server-side source, private databases, or secrets. Use only on sites you own or are authorised to archive.