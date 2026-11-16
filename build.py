#!/usr/bin/env python3
"""
SIDLYTIX SITE BUILDER
=====================
Builds the final .html pages (in this folder, the repo root) from:

  src/pages/*.html   page sources with markers like <!--@HEADER-->
  src/content.py     social links + all industry content
  src/icons.py       social icons

Run it after editing anything in src/:

    python build.py

then commit and push. GitHub Pages serves the generated files as-is.
No packages are required. If Pillow is installed (pip install pillow), images
also get width/height attributes automatically, which stops layout jumps.

Edit style.css, script.js and form.js directly - they are not generated.
"""
import datetime
import html
import importlib.util
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE_URL = "https://sidlytix.com"
E = html.escape


def load(name):
    spec = importlib.util.spec_from_file_location(name, SRC / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


content = load("content")
ICONS = load("icons").ICONS

try:
    from PIL import Image  # optional
except ImportError:
    Image = None

DEFAULT_WA = "Hi Sidlytix, I'd like a free consultation."

# Page settings. home = prefix for links to homepage sections, root = prefix for files/assets.
PAGES = {
    "index.html":          dict(home="", active=None, sitemap=(1.0, "weekly")),
    "industries.html":     dict(active="industries", sitemap=(0.9, "monthly")),
    "email-summary.html":  dict(active="products", sitemap=(0.9, "monthly"),
                                cta=("Request Setup", "index.html?interest=email-summary#contact"),
                                wa="Hi Sidlytix, I'm interested in the Email Summary System."),
    "privacy-policy.html": dict(sitemap=(0.3, "yearly")),
    "terms.html":          dict(sitemap=(0.3, "yearly")),
    "disclaimer.html":     dict(sitemap=(0.3, "yearly")),
    "404.html":            dict(home="/", root="/"),  # served at any URL depth -> absolute paths
}

NAV = [
    ("services", "Services", "#services"),
    ("industries", "Industries", "industries.html"),
    ("products", "Products", "#products"),
    ("portfolio", "Work", "#portfolio"),
    ("about", "About", "#about"),
    ("contact", "Contact", "#contact"),
]

warnings = []


# ---------------------------------------------------------------- helpers
def rgb(hex_color):
    h = hex_color.lstrip("#")
    return ",".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def cvars(color):
    return f"--c:{color};--c-rgb:{rgb(color)}"


def cfg_for(name):
    c = dict(home="index.html", root="", active=None, cta=("Free Consultation", None), wa=DEFAULT_WA)
    c.update(PAGES[name])
    if c["cta"][1] is None:
        c["cta"] = (c["cta"][0], c["home"] + "#contact")
    return c


def link(c, target):
    """Section links (#x) go to the homepage; file links get the root prefix."""
    return c["home"] + target if target.startswith("#") else c["root"] + target


def svg_icon(key):
    vb, d = ICONS[key]
    return f'<svg viewBox="{vb}" aria-hidden="true" focusable="false"><path d="{d}"/></svg>'


def wa_link(text):
    return f"https://wa.me/{content.PHONE.lstrip('+')}?text={quote(text)}"


# ---------------------------------------------------------------- shared parts
def header(c):
    def item(key, label, target, mobile=False):
        cls = "nav-link"
        cur = ""
        if c["active"] == key:
            cls += " active"
            cur = ' aria-current="page"'
        a = f'<a href="{link(c, target)}" class="{cls}"{cur}>{label}</a>'
        return a if mobile else f"<li>{a}</li>"

    logo_href = "#home" if c["home"] == "" else (c["home"] or "/")
    cta_text, cta_href = c["cta"]
    desktop = "\n            ".join(item(*n) for n in NAV)
    mobile = "\n      ".join(item(*n, mobile=True) for n in NAV)
    return f'''<header class="header" id="header">
      <div class="header-container">
        <a href="{logo_href}" class="logo">
          <img src="{c["root"]}s-logo-01.png" alt="Sidlytix Logo" />
          <span class="logo-text">SIDLYTIX</span>
        </a>
        <nav class="nav-container" aria-label="Main">
          <ul class="nav-menu">
            {desktop}
          </ul>
          <a href="{cta_href}" class="header-cta">{cta_text}</a>
          <button class="hamburger" id="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">
            <span></span><span></span><span></span>
          </button>
        </nav>
      </div>
    </header>

    <nav class="mobile-nav" id="mobileNav" aria-label="Mobile">
      {mobile}
      <a href="{cta_href}" class="btn-primary nav-link-cta">{cta_text}</a>
    </nav>'''


def footer(c):
    socials = "\n            ".join(
        f'<a href="{E(s["url"])}" target="_blank" rel="noopener noreferrer me" aria-label="Sidlytix on {E(s["label"])}" title="{E(s["label"])}">{svg_icon(s["key"])}</a>'
        for s in content.SOCIALS if s["url"]
    )
    logo_href = "#home" if c["home"] == "" else (c["home"] or "/")
    year = datetime.date.today().year
    return f'''<footer class="footer">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="{logo_href}" class="logo" aria-label="Sidlytix home">
              <img src="{c["root"]}framewhite_01.png" alt="Sidlytix Logo" class="footer-logo" />
            </a>
            <p>Websites, dashboards and smart automation for businesses in every industry, worldwide.</p>
          </div>
          <div class="footer-column">
            <h4 class="footer-title">Quick Links</h4>
            <div class="footer-links">
              <a href="{link(c, "#services")}">Services</a>
              <a href="{link(c, "industries.html")}">Industries</a>
              <a href="{link(c, "#portfolio")}">Work</a>
              <a href="{link(c, "#about")}">About</a>
            </div>
          </div>
          <div class="footer-column">
            <h4 class="footer-title">Products</h4>
            <div class="footer-links">
              <a href="{link(c, "email-summary.html")}">Email Summary System</a>
            </div>
          </div>
          <div class="footer-column">
            <h4 class="footer-title">Legal</h4>
            <div class="footer-links">
              <a href="{link(c, "privacy-policy.html")}">Privacy Policy</a>
              <a href="{link(c, "terms.html")}">Terms of Service</a>
              <a href="{link(c, "disclaimer.html")}">Disclaimer</a>
            </div>
          </div>
          <div class="footer-column">
            <h4 class="footer-title">Contact</h4>
            <div class="footer-links">
              <a href="mailto:{content.EMAIL}">{content.EMAIL}</a>
              <a href="tel:{content.PHONE}">{content.PHONE_DISPLAY}</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copyright">&copy; {year} Sidlytix. All rights reserved.</p>
          <div class="footer-socials" aria-label="Sidlytix on social media">
            {socials}
          </div>
        </div>
      </div>
    </footer>

    <a class="whatsapp-float" href="{wa_link(c["wa"])}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Sidlytix on WhatsApp">
      <i class="fab fa-whatsapp" aria-hidden="true"></i>
    </a>'''


# ---------------------------------------------------------------- industries
def home_tiles():
    out = []
    for i, d in enumerate(content.INDUSTRIES):
        out.append(f'''
          <a href="industries.html#{d["key"]}" class="ind-tile" style="{cvars(d["color"])}">
            <span class="ind-tile-num">{i + 1:02d}</span>
            <span class="ind-tile-icon"><i class="fas {d["icon"]}" aria-hidden="true"></i></span>
            <h3 class="ind-tile-title">{E(d["name"])}</h3>
            <p class="ind-tile-text">{E(d["short"])}</p>
            <i class="fas fa-arrow-right ind-tile-arrow" aria-hidden="true"></i>
          </a>''')
    return "".join(out) + "\n        "


def ind_index():
    return "".join(
        f'<li><a href="#{d["key"]}" data-ind="{d["key"]}" data-color="{d["color"]}" data-rgb="{rgb(d["color"])}" style="{cvars(d["color"])}">'
        f'<span class="ind-index-num">{i + 1:02d}</span><span class="ind-index-name">{E(d["name"])}</span></a></li>'
        for i, d in enumerate(content.INDUSTRIES))


def checks(items):
    return "".join(f'<li><i class="fas fa-check" aria-hidden="true"></i><span>{E(x)}</span></li>' for x in items)


def dash_html(d):
    title, kpis, panel, bars, labels = d
    k = []
    for label, val, dec, pre, suf, trend, cls in kpis:
        final = f"{pre}{float(val):,.{dec}f}{suf}"
        k.append(
            f'<div class="kpi"><span class="kpi-label">{E(label)}</span>'
            f'<span class="kpi-value" data-count="{val}" data-decimals="{dec}" data-prefix="{pre}" data-suffix="{suf}">{final}</span>'
            f'<span class="kpi-trend {cls}">{E(trend)}</span></div>')
    hi = max(range(len(bars)), key=lambda i: bars[i])
    peak = ' class="peak"'
    b = "".join(f'<span style="--h:{v}%"{peak if i == hi else ""}></span>' for i, v in enumerate(bars))
    lab = "".join(f"<span>{E(x)}</span>" for x in labels)
    return f'''<div class="dash dash--flat" role="img" aria-label="Sample dashboard: {E(title)}">
              <div class="dash-top">
                <div class="dash-dots" aria-hidden="true"><i></i><i></i><i></i></div>
                <span class="dash-title">{E(title)}</span>
                <span class="dash-live"><span class="live-dot"></span> Live</span>
              </div>
              <div class="dash-kpis">{"".join(k)}</div>
              <div class="dash-panel">
                <span class="panel-title">{E(panel)}</span>
                <div class="bars">{b}</div>
                <div class="bar-labels">{lab}</div>
              </div>
              <p class="dash-sample">Sample data</p>
            </div>'''


def ind_sections():
    out = []
    for i, d in enumerate(content.INDUSTRIES):
        wa = wa_link(f"Hi Sidlytix, I'm in {d['name']} and I'd like to talk about a project.")
        out.append(f'''
          <section class="ind-section" id="{d["key"]}" data-color="{d["color"]}" data-rgb="{rgb(d["color"])}" style="{cvars(d["color"])}" aria-labelledby="{d["key"]}-title">
            <header class="ind-head">
              <div class="ind-tag">
                <span class="ind-icon"><i class="fas {d["icon"]}" aria-hidden="true"></i></span>
                <span class="ind-kicker"><b>{i + 1:02d}</b> {E(d["name"])}</span>
              </div>
              <h2 class="ind-title" id="{d["key"]}-title">{E(d["headline"])}</h2>
              <p class="ind-intro">{E(d["intro"])}</p>
            </header>

            <div class="ind-grid">
              <div class="ind-problems">
                <h3 class="ind-label">What usually goes wrong</h3>
                <ol>{"".join(f"<li>{E(p)}</li>" for p in d["problems"])}</ol>
              </div>
              {dash_html(d["dash"])}
            </div>

            <div class="ind-build">
              <h3 class="ind-label">What we build for you</h3>
              <div class="build-grid">
                <div class="build-col build-col--web">
                  <div class="build-head"><i class="fas fa-laptop-code" aria-hidden="true"></i><h4>Website</h4></div>
                  <ul>{checks(d["website"])}</ul>
                </div>
                <div class="build-col">
                  <div class="build-head"><i class="fas fa-chart-line" aria-hidden="true"></i><h4>Dashboards</h4></div>
                  <ul>{checks(d["dashboard"])}</ul>
                </div>
                <div class="build-col">
                  <div class="build-head"><i class="fas fa-gears" aria-hidden="true"></i><h4>Automation</h4></div>
                  <ul>{checks(d["automation"])}</ul>
                </div>
              </div>
            </div>

            <div class="ind-foot">
              <div class="ind-foot-copy">
                <span class="ind-label">A good first project</span>
                <p>{E(d["first"])} <span class="ind-time"><i class="far fa-clock" aria-hidden="true"></i> {E(d["time"])}</span></p>
              </div>
              <div class="ind-foot-actions">
                <a href="index.html?industry={d["key"]}#contact" class="btn-primary">Talk about your project <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                <a href="{wa}" class="btn-text" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>
              </div>
            </div>
          </section>''')
    return "".join(out)


# ---------------------------------------------------------------- images
IMG_RE = re.compile(r"<img\b[^>]*>")


def process_images(page_html, page_name):
    def fix(m):
        tag = m.group(0)
        src_m = re.search(r'\ssrc="([^"]+)"', tag)
        if not src_m or src_m.group(1).startswith(("http:", "https:", "data:")):
            return tag
        src = src_m.group(1)
        path = ROOT / unquote(src.lstrip("/"))
        if not path.exists():
            warnings.append(f"{page_name}: image not found in repo: {src}")
            return tag
        if Image and " width=" not in tag and path.suffix.lower() != ".svg":
            try:
                with Image.open(path) as im:
                    w, h = im.size
                tag = tag.replace("<img ", f'<img width="{w}" height="{h}" ', 1)
            except Exception as err:  # noqa: BLE001
                warnings.append(f"{page_name}: could not read {src}: {err}")
        webp = path.with_suffix(".webp")
        if path.suffix.lower() in (".png", ".jpg", ".jpeg") and webp.exists():
            webp_src = quote(src.rsplit(".", 1)[0] + ".webp", safe="/:")
            return f'<picture><source srcset="{webp_src}" type="image/webp" />{tag}</picture>'
        return tag

    return IMG_RE.sub(fix, page_html)


# ---------------------------------------------------------------- build
def build():
    today = datetime.date.today().isoformat()
    same_as = json.dumps([s["url"] for s in content.SOCIALS if s["url"]])

    for name in PAGES:
        src = SRC / "pages" / name
        if not src.exists():
            warnings.append(f"missing source: src/pages/{name}")
            continue
        c = cfg_for(name)
        out = src.read_text(encoding="utf-8")
        out = (out.replace("<!--@HEADER-->", header(c))
                  .replace("<!--@FOOTER-->", footer(c))
                  .replace("<!--@HOME_TILES-->", home_tiles())
                  .replace("<!--@IND_INDEX-->", ind_index())
                  .replace("<!--@IND_SECTIONS-->", ind_sections())
                  .replace("{{SAMEAS}}", same_as))
        left = re.findall(r"<!--@[A-Z_]+-->|\{\{[A-Z_]+\}\}", out)
        if left:
            warnings.append(f"{name}: unknown markers {left}")
        out = process_images(out, name)
        (ROOT / name).write_text(out, encoding="utf-8")
        print(f"  built {name}")

    urls = []
    for name, p in PAGES.items():
        if "sitemap" not in p:
            continue
        prio, freq = p["sitemap"]
        loc = f"{SITE_URL}/" if name == "index.html" else f"{SITE_URL}/{name}"
        urls.append(f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod><changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")
    print("  built sitemap.xml")

    for f in ["dm-sans-400", "dm-sans-500", "dm-sans-600", "dm-sans-700", "playfair-display-600", "playfair-display-700"]:
        if not (ROOT / "fonts" / f"{f}.woff2").exists():
            warnings.append(f"font missing: fonts/{f}.woff2")
    if not Image:
        warnings.append("Pillow not installed: images built without width/height (pip install pillow)")

    if warnings:
        print("\nWarnings:")
        for w in sorted(set(warnings)):
            print("  -", w)
    print("\nDone.")


if __name__ == "__main__":
    sys.exit(build())
