import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// A fake extraction, so the test never depends on the real book being present.
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "qp-book-"));
process.env.QUANT_PREP_BOOK_DIR = DIR;

const { bookExtract, bookTextAvailable, PAGE_OFFSET } = await import("../server/bookText");

beforeAll(() => {
  fs.mkdirSync(path.join(DIR, "pages"), { recursive: true });
  // Printed page 72 lives in image 88.
  const write = (pdfPage: number, body: string) =>
    fs.writeFileSync(path.join(DIR, "pages", `p${String(pdfPage).padStart(3, "0")}.txt`), body);

  write(
    88,
    [
      "A Practical Guide To Quantitative Finance Interviews",
      "",
      "Boys and girls",
      "",
      "",
      "A family has two children.",
      "What is the probability that both are girls?",
      "",
      "72",
    ].join("\n")
  );
  write(89, ["Probability Theory", "Unfair coin", "Given a biased coin...", "73"].join("\n"));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe("bookText", () => {
  it("maps printed pages onto scan images with a fixed offset", () => {
    expect(PAGE_OFFSET).toBe(16);
    const out = bookExtract(72, 72);
    expect(out.available).toBe(true);
    expect(out.pages[0].page).toBe(72);
    expect(out.pages[0].pdfPage).toBe(88);
  });

  it("strips running heads and the page-number footer, keeping the body", () => {
    const lines = bookExtract(72, 72).pages[0].lines;
    expect(lines).not.toContain("A Practical Guide To Quantitative Finance Interviews");
    expect(lines).not.toContain("72");
    expect(lines[0]).toBe("Boys and girls");
    expect(lines).toContain("A family has two children.");
  });

  it("collapses runs of blank lines to a single break", () => {
    const lines = bookExtract(72, 72).pages[0].lines;
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i] === "" && lines[i - 1] === "").toBe(false);
    }
  });

  it("returns a whole range in printed-page order", () => {
    const out = bookExtract(72, 73);
    expect(out.pages.map((p) => p.page)).toEqual([72, 73]);
  });

  it("tolerates a reversed range", () => {
    expect(bookExtract(73, 72).pages.map((p) => p.page)).toEqual([72, 73]);
  });

  it("reports missing pages instead of throwing", () => {
    const out = bookExtract(500, 500);
    expect(out.available).toBe(false);
    expect(out.pages).toEqual([]);
    expect(out.reason).toMatch(/ocr|extract/i);
  });

  it("sees the extraction directory", () => {
    expect(bookTextAvailable()).toBe(true);
  });
});

describe("book text lives outside the app source", () => {
  it("is never imported into src/ — only read at runtime from local/", () => {
    // The guarantee that makes this personal-use rather than redistribution: the
    // repo carries no book content, so sharing the code shares nothing of the book.
    const src = path.join(process.cwd(), "src");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          const text = fs.readFileSync(full, "utf8");
          // No source file may embed the book's own running head.
          if (text.includes("A Practical Guide To Quantitative Finance")) {
            // The reader strips it, so mentioning it in a regex is expected there.
            if (!full.endsWith("bookText.ts") && !full.endsWith("bookText.test.ts")) {
              offenders.push(path.relative(process.cwd(), full));
            }
          }
        }
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });

  it("keeps the extraction directory gitignored", () => {
    const ignore = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    expect(ignore).toMatch(/^\/local\/$/m);
    expect(ignore).toMatch(/^\/reference-materials\/$/m);
  });
});
