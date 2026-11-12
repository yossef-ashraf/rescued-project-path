import * as React from "react"
import { cn } from "@/shared/utils/utils.js"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-line bg-surface text-ink shadow-card",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, title, description, actions, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-3 border-b border-line px-5 py-3.5",
      className
    )}
    {...props}
  >
    {title || description ? (
      <div className="min-w-0">
        {title && <h3 className="text-[14px] font-semibold text-ink leading-tight">{title}</h3>}
        {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
        {children}
      </div>
    ) : (
      children
    )}
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-[14px] font-semibold leading-tight text-ink", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[12px] text-muted", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-5 py-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end gap-2 border-t border-line px-5 py-3", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

function Detail({ rows = [], className }) {
  return (
    <dl className={cn("divide-y divide-line text-[13px]", className)}>
      {rows.map((row, idx) => (
        <div key={row.label || idx} className="grid grid-cols-3 gap-4 py-2.5">
          <dt className="text-muted">{row.label}</dt>
          <dd className="col-span-2 font-medium text-ink">{row.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Detail }
