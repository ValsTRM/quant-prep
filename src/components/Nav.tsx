"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Grouped by programme. Dashboard and Progress span both tracks; the middle two
 * groups are the two things you actually practise, so it's always obvious which
 * one you're in.
 */
const GROUPS: { label: string | null; items: { href: string; label: string }[] }[] = [
  { label: null, items: [{ href: "/", label: "Dashboard" }] },
  {
    label: "Mental math",
    items: [
      { href: "/diagnostic", label: "Diagnostic" },
      { href: "/practice", label: "Practice" },
      { href: "/review", label: "Review" },
    ],
  },
  { label: "Green Book", items: [{ href: "/greenbook", label: "Sections" }] },
  {
    label: null,
    items: [
      { href: "/progress", label: "Progress" },
      { href: "/resources", label: "Resources" },
      { href: "/backup", label: "Backup" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-sm">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && <span aria-hidden className="mx-1 text-muted-foreground/40">·</span>}
          {group.label && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              {group.label}
            </span>
          )}
          {group.items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 transition-colors duration-150 outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
