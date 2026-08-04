"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  glyph,
}: {
  label: string;
  value: string;
  hint?: string;
  glyph?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {glyph}
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

/**
 * Thin single-hue magnitude bar with a muted track. Animates its width in on
 * mount (500ms ease-out; disabled under prefers-reduced-motion).
 */
export function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div className="h-1.5 w-full min-w-16 rounded-full bg-muted" role="presentation">
      <div
        className="h-1.5 rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function pctText(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/* Inline-SVG glyphs — stroke follows the surrounding text color. */
const GLYPH_PATHS: Record<string, React.ReactNode> = {
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5V5.5M20 18v3H6.5" />
    </>
  ),
  spark: <path d="M13 2 5 13.5h6L11 22l8-11.5h-6Z" />,
  flame: (
    <path d="M12 21c-3.9 0-6.5-2.4-6.5-6 0-2.6 1.7-4.6 3-6.1C9.8 7.4 11 6 11 3.5c3 1.6 6.5 5.6 6.5 9.5 0 1-.2 1.9-.6 2.7C16.1 14.5 15 13.8 15 12c-1.6 1.2-2.5 3-2.5 4.7 0 1.6.7 3 1.9 4A7.6 7.6 0 0 1 12 21Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.9 4-1.5 7-5.5 7-9.9V6Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </>
  ),
};

export function Glyph({ name, className = "size-4" }: { name: keyof typeof GLYPH_PATHS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {GLYPH_PATHS[name]}
    </svg>
  );
}

/** Empty state: glyph, one-line explanation, and the next action. */
export function EmptyState({
  glyph,
  title,
  hint,
  action,
}: {
  glyph: keyof typeof GLYPH_PATHS;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="text-muted-foreground/60">
        <Glyph name={glyph} className="size-8" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Loading placeholder for a stat-tile row + a table-ish card. */
export function PageSkeleton({ tiles = 4, rows = 6 }: { tiles?: number; rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      {tiles > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${90 - (i % 3) * 12}%` }} />
        ))}
      </div>
    </div>
  );
}
