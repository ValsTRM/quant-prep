#!/usr/bin/env python3
"""
OCR the Green Book PDF into searchable local text.

The PDF is a pure scan — 213 full-page images, no text layer, no embedded fonts.
This renders each page and runs it through the macOS Vision text recogniser (the
engine behind Live Text), which is why the file looks selectable in a viewer.

Output goes to `local/green-book/`, which is gitignored. This is a reading and
search aid for a book you own; the app itself never serves this text. Prose comes
out clean; mathematical notation does not survive — Vision recognises text, not
formulas — so treat the output as an index and a search target, not as content.

Usage:
    python3 scripts/ocr/ocr_green_book.py                # all pages
    python3 scripts/ocr/ocr_green_book.py --pages 40-60   # a range
    python3 scripts/ocr/ocr_green_book.py --force         # redo existing pages
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "reference-materials" / "green-book.pdf"
OUT = ROOT / "local" / "green-book"
PAGES = OUT / "pages"
IMAGES = OUT / ".images"
BINARY = OUT / ".ocrpages"
SWIFT_SRC = Path(__file__).resolve().parent / "OCRPages.swift"
DPI = 300
BATCH = 12


def fail(msg: str) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def build_recogniser() -> Path:
    """Compile the Swift OCR helper once; reuse it for every page."""
    if BINARY.exists() and BINARY.stat().st_mtime > SWIFT_SRC.stat().st_mtime:
        return BINARY
    if not shutil.which("swiftc"):
        fail("swiftc not found — Xcode command line tools are required for OCR")
    print("compiling OCR helper...")
    subprocess.run(
        ["swiftc", "-O", str(SWIFT_SRC), "-o", str(BINARY)],
        check=True,
        cwd=OUT,
    )
    return BINARY


def parse_pages(spec: str | None, total: int) -> list[int]:
    if not spec:
        return list(range(1, total + 1))
    out: list[int] = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-", 1)
            out.extend(range(int(lo), int(hi) + 1))
        else:
            out.append(int(part))
    return [p for p in out if 1 <= p <= total]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", help="e.g. 40-60 or 3,7,9")
    ap.add_argument("--force", action="store_true", help="re-OCR pages that already exist")
    ap.add_argument("--dpi", type=int, default=DPI)
    args = ap.parse_args()

    if not PDF.exists():
        fail(f"{PDF} not found")

    try:
        import fitz  # PyMuPDF
    except ImportError:
        fail("PyMuPDF is required: pip install pymupdf")

    PAGES.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF)
    wanted = parse_pages(args.pages, doc.page_count)
    todo = [p for p in wanted if args.force or not (PAGES / f"p{p:03d}.txt").exists()]
    print(f"{doc.page_count} pages in PDF · {len(wanted)} requested · {len(todo)} to do")
    if not todo:
        print("nothing to do")
        return

    recogniser = build_recogniser()

    done = 0
    for start in range(0, len(todo), BATCH):
        batch = todo[start : start + BATCH]
        rendered: list[str] = []
        for page in batch:
            img = IMAGES / f"p{page:03d}.png"
            doc[page - 1].get_pixmap(dpi=args.dpi).save(img)
            rendered.append(str(img))

        subprocess.run([str(recogniser), str(PAGES), *rendered], check=True, stdout=subprocess.DEVNULL)
        for img in rendered:
            Path(img).unlink(missing_ok=True)

        done += len(batch)
        print(f"  {done}/{len(todo)} pages", flush=True)

    # One concatenated file, with page markers, for grep-style searching.
    combined = OUT / "full.txt"
    with combined.open("w") as fh:
        for page in range(1, doc.page_count + 1):
            path = PAGES / f"p{page:03d}.txt"
            if not path.exists():
                continue
            fh.write(f"\n\n===== PDF PAGE {page} =====\n")
            fh.write(path.read_text())
    print(f"wrote {combined.relative_to(ROOT)} ({combined.stat().st_size:,} bytes)")

    shutil.rmtree(IMAGES, ignore_errors=True)


if __name__ == "__main__":
    main()
