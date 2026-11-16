# sidlytix.com

Static website hosted on GitHub Pages.

## Folder layout

| Path | What it is | Edit it? |
|---|---|---|
| `src/pages/*.html` | Page sources (with `<!--@HEADER-->` style markers) | ✅ yes |
| `src/content.py` | Social links + all industry text (homepage tiles and industries page) | ✅ yes |
| `style.css`, `script.js`, `form.js` | Styles, site behaviour, contact form | ✅ yes, directly |
| `*.html` at the root, `sitemap.xml` | **Generated** by `build.py`. Don't edit; changes get overwritten | ❌ |
| `apps-script/Code.gs` | Google Apps Script behind the contact form (paste into Apps Script) | ✅ |
| `tools/convert_images.py` | Makes WebP copies of images | run it |
| `fonts/`, `og/` | Self-hosted fonts (OFL licence), social share images | — |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (faster, no Jekyll) | keep |

## Making a change

```bash
# 1. edit src/pages/... or src/content.py
python build.py          # rebuilds every page + sitemap.xml
# 2. open index.html in a browser to check, then:
git add -A && git commit -m "Update site" && git push
```

GitHub Pages publishes within a minute or two. `build.py` needs only Python 3.
With Pillow installed (`pip install pillow`) it also adds image `width`/`height`,
which stops the page jumping while images load.

## Images (do this once)

```bash
pip install pillow
python tools/convert_images.py   # creates .webp next to each .png/.jpg
python build.py                  # pages now serve WebP with PNG fallback
```

Tip: avoid spaces in image file names (e.g. rename
`Financial Services Website Showcase.png` to `ca-firm-website.png`, then update
the `src` in `src/pages/index.html`).

## Social links

Edit `SOCIALS` at the top of `src/content.py`. An empty `url` hides that icon.
The same list feeds the footer on every page and Google's `sameAs` data.

## Contact form

`form.js` posts to the Apps Script web app. After changing `apps-script/Code.gs`:
Apps Script → Deploy → Manage deployments → ✏️ → Version: **New version** → Deploy.
If the web app URL changes, update `SCRIPT_URL` in `form.js`.

## GitHub Pages settings

Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
Keep the `CNAME` file (custom domain) if your repo already has one.
