import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quant Prep",
  description: "Local-first adaptive quant interview prep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        <header className="border-b">
          <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
            <Link
              href="/"
              className="mr-4 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-primary align-middle" />
              Quant Prep
            </Link>
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t py-3 text-center text-xs text-muted-foreground">
          Local-first · data lives in ./data/quant-prep.sqlite · back up from the Backup page
        </footer>
      </body>
    </html>
  );
}
