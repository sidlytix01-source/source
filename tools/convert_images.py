#!/usr/bin/env python3
"""
Make WebP copies of the site's PNG/JPG images (much smaller, same look).

    pip install pillow
    python tools/convert_images.py
    python build.py

Originals are kept: build.py serves the .webp to browsers that support it and
falls back to the original PNG/JPG for the rest. Re-run after adding new images.
Skips favicons, share images (og/) and anything already converted and up to date.
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is needed: pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"og", "node_modules", ".git", "src", "tools", "fonts"}
SKIP_NAMES = {"favicon.png"}
QUALITY = 82
MAX_WIDTH = 2000  # larger images are scaled down; nothing on the site is shown wider


def main():
    saved = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix.lower() not in (".png", ".jpg", ".jpeg") or path.name in SKIP_NAMES:
            continue
        if SKIP_DIRS & set(p.name for p in path.relative_to(ROOT).parents):
            continue
        out = path.with_suffix(".webp")
        if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
            continue
        with Image.open(path) as im:
            im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
            if im.width > MAX_WIDTH:
                im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
            im.save(out, "WEBP", quality=QUALITY, method=6)
        before, after = path.stat().st_size, out.stat().st_size
        saved += before - after
        print(f"{path.relative_to(ROOT)}: {before // 1024} KB -> {after // 1024} KB")
    print(f"\nSaved about {saved // 1024} KB in total." if saved else "Nothing to convert.")


if __name__ == "__main__":
    main()
