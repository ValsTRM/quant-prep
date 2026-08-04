import { cn } from "@/lib/utils"

/** Pulsing placeholder block. Compose into the real layout's shape. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
