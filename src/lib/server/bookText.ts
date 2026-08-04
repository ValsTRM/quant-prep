import fs from "node:fs";
import path from "node:path";

/* ---------------------------------------------------------------------------
 * Reading your own copy of the book inside the app.
 *
 * The text is read at RUNTIME from `local/green-book/`, which is gitignored and
 * produced by `scripts/ocr/ocr_green_book.py` from the PDF on this machine. It is
 * deliberately never imported into `src/` and never committed: the application
 * code stays free of book content, so the repo remains shareable while your copy
 * of the book stays yours. If the directory isn't there, the reader degrades to a
 * prompt to run the extraction.
 * ------------------------------------------------------------------------- */

const ROOT = process.env.QUANT_PREP_BOOK_DIR
  ? path.resolve(process.env.QUANT_PREP_BOOK_DIR)
  : path.join(process.cwd(), "local", "green-book");
const PAGES = path.join(ROOT, "pages");

/**
 * The scan's front matter runs 16 pages ahead of the printed numbering, so
 * printed page 72 is image 88. Confirmed against section headings throughout.
 */
export const PAGE_OFFSET = 16;

export interface BookPage {
  /** Page number as printed in the book. */
  page: number;
  /** Page number of the scanned image, i.e. printed + PAGE_OFFSET. */
  pdfPage: number;
  lines: string[];
}

export interface BookExtract {
  available: boolean;
  /** Present when unavailable — how to fix it. */
  reason?: string;
  pages: BookPage[];
}

/** Running heads that appear on nearly every page and add nothing to a reader. */
const RUNNING_HEADS = [
  /^a practical guide to quantitative finance interviews\.?$/i,
  /^contents$/i,
  /^chapter \d+\s*$/i,
];

/**
 * Trim the artefacts of a page scan: running heads, the bare page number in the
 * footer, and the empty lines OCR leaves between columns. The body text itself is
 * passed through untouched — this is your book, not a summary of it.
 */
function clean(raw: string, page: number, pdfPage: number): string[] {
  const lines = raw.split("\n").map((l) => l.trimEnd());
  const out: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      // Collapse runs of blank lines to a single paragraph break.
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (RUNNING_HEADS.some((re) => re.test(t))) continue;
    // A line that is nothing but this page's own number is the footer.
    if (t === String(page) || t === String(pdfPage)) continue;
    out.push(line);
  }

  while (out.length && out[out.length - 1] === "") out.pop();
  while (out.length && out[0] === "") out.shift();
  return out;
}

function readPage(pdfPage: number): string | null {
  const file = path.join(PAGES, `p${String(pdfPage).padStart(3, "0")}.txt`);
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export function bookTextAvailable(): boolean {
  return fs.existsSync(PAGES);
}

/**
 * The book's own text for a printed page range, straight from your local
 * extraction. `from` and `to` are printed page numbers, inclusive.
 */
export function bookExtract(from: number, to: number): BookExtract {
  if (!bookTextAvailable()) {
    return {
      available: false,
      reason:
        "No local extraction found. Run `python3 scripts/ocr/ocr_green_book.py` to OCR your copy of the PDF into local/green-book/.",
      pages: [],
    };
  }

  const lo = Math.max(1, Math.min(from, to));
  const hi = Math.max(from, to);
  const pages: BookPage[] = [];

  for (let page = lo; page <= hi; page++) {
    const pdfPage = page + PAGE_OFFSET;
    const raw = readPage(pdfPage);
    if (raw === null) continue;
    pages.push({ page, pdfPage, lines: clean(raw, page, pdfPage) });
  }

  if (pages.length === 0) {
    return {
      available: false,
      reason: `No extracted text for printed pages ${lo}–${hi}. Re-run the OCR script for that range: --pages ${lo + PAGE_OFFSET}-${hi + PAGE_OFFSET}`,
      pages: [],
    };
  }

  return { available: true, pages };
}
