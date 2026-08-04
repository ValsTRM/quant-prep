// Batch OCR using the macOS Vision framework — the same text recogniser behind
// Live Text in Preview, which is why the Green Book PDF appears selectable in a
// viewer despite having no text layer of its own.
//
// Usage:  swiftc -O OCRPages.swift -o ocrpages && ./ocrpages <out-dir> <page.png> ...
// Writes  <out-dir>/<basename>.txt  for each input image.
//
// Compiled once rather than run through `swift` per page: the interpreter spends
// a second or two compiling each invocation, which over 213 pages is minutes of
// pure overhead.

import Foundation
import Vision
import AppKit

let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: ocrpages <out-dir> <image> ...\n".data(using: .utf8)!)
    exit(2)
}
let outDir = args[0]
let images = Array(args.dropFirst())

func recognise(_ path: String) -> String? {
    guard let img = NSImage(contentsOfFile: path),
          let tiff = img.tiffRepresentation,
          let bmp = NSBitmapImageRep(data: tiff),
          let cg = bmp.cgImage else { return nil }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    // The book is dense with symbols and variable names; autocorrection "fixes"
    // them into English words and makes the result worse, not better.
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]

    do {
        try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
    } catch {
        return nil
    }

    return (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "\n")
}

var failures = 0
for path in images {
    let base = (path as NSString).lastPathComponent
    let stem = (base as NSString).deletingPathExtension
    guard let text = recognise(path) else {
        FileHandle.standardError.write("FAIL \(base)\n".data(using: .utf8)!)
        failures += 1
        continue
    }
    let dest = (outDir as NSString).appendingPathComponent("\(stem).txt")
    try? text.write(toFile: dest, atomically: true, encoding: .utf8)
    print(stem)
    fflush(stdout)
}

if failures > 0 {
    FileHandle.standardError.write("\(failures) page(s) failed\n".data(using: .utf8)!)
    exit(1)
}
