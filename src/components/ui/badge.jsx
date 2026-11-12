import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/utils/utils.js"

export function statusTone(raw) {
  const s = String(raw ?? "").toLowerCase()
  if (["active", "paid", "delivered", "published", "completed", "approved", "resolved", "open", "true", "done", "verified", "healthy"].includes(s)) return "ok"
  if (["processing", "shipped", "in_progress", "assigned", "queued", "ongoing", "current"].includes(s)) return "primary"
  if (["pending", "on_hold", "draft", "review", "unassigned", "low", "paused", "due_soon", "warning"].includes(s)) return "warn"
  if (["cancelled", "canceled", "failed", "refunded", "rejected", "expired", "blocked", "false", "overdue", "critical", "urgent"].includes(s)) return "crit"
  return "neutral"
}

const toneClasses = {
  ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  primary: "bg-primary-wash text-primary-strong border-primary/25",
  warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  crit: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  neutral: "bg-line2 text-ink2 border-line",
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary-wash text-primary-strong border-primary/25",
        secondary: "bg-line2 text-ink2 border-line",
        destructive: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        outline: "border-line text-ink2 bg-transparent",
        ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
        crit: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        neutral: "bg-line2 text-ink2 border-line",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, tone, ...props }) {
  const toneClass = tone ? toneClasses[tone] || toneClasses.neutral : null
  return (
    <span
      className={cn(badgeVariants({ variant: tone ? undefined : variant }), toneClass, className)}
      {...props}
    />
  )
}

function StatusPill({ value, label, dot = true, className, ...props }) {
  const tone = statusTone(value)
  const display = label ?? String(value ?? "—").replace(/_/g, " ")
  const dotColors = {
    ok: "bg-emerald-600 dark:bg-emerald-400",
    primary: "bg-primary",
    warn: "bg-amber-600 dark:bg-amber-400",
    crit: "bg-rose-600 dark:bg-rose-400",
    neutral: "bg-zinc-500",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[tone])} aria-hidden="true" />}
      <span>{display}</span>
    </span>
  )
}

function CountBadge({ count, className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-line2 px-1.5 text-[11px] font-semibold tabular-nums text-ink2",
        className
      )}
      {...props}
    >
      {count}
    </span>
  )
}

function DeltaPill({ value, className, ...props }) {
  const num = Number(value)
  const isPos = num > 0
  const isNeg = num < 0
  const tone = isPos ? "ok" : isNeg ? "crit" : "neutral"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <span aria-hidden="true">{isPos ? "↑" : isNeg ? "↓" : "→"}</span>{" "}
      <span>{isPos ? `+${value}` : String(value)}</span>
    </span>
  )
}

export { Badge, badgeVariants, StatusPill, CountBadge, DeltaPill }
