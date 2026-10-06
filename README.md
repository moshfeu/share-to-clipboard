# Share to Clipboard

A tiny PWA that appears in your device's **Share with…** menu. Share text, a link or an image to it and it copies the content to the clipboard.

## Use
1. Host the folder over **HTTPS** (GitHub Pages, Netlify, …) — no build step.
2. Open it in Chrome on Android and **install** it (menu → *Install app*).
3. In any app, Share → **Share to Clipboard**.

## How it works
- `manifest.webmanifest` declares a `share_target` (POST, multipart).
- `sw.js` intercepts the POST, stashes the data in the Cache API and redirects to `./?shared=1`.
- `app.js` copies it (images are converted to PNG, the only image type the clipboard accepts).

## Limitations
- **Android Chrome/Edge/Samsung Internet and desktop Chrome/Edge only.** iOS Safari has no Web Share Target support.
- Browsers may block a clipboard write that has no user tap; then a **Copy** button appears.
- `window.close()` is only honoured for script-opened windows, so the app usually can't close itself; it shows "Copied ✓" and you swipe/back out.
- Only text, URLs and images can be copied (not arbitrary files).

## Develop
`python3 -m http.server 8099` and open http://localhost:8099 (service workers work on localhost).
