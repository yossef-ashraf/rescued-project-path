'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/shared/utils/utils.js"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-primary-strong",
        primary:
          "bg-primary text-on-primary hover:bg-primary-strong",
        secondary:
          "border border-line bg-surface text-ink hover:bg-line2",
        outline:
          "border border-line bg-surface text-ink hover:bg-line2",
        destructive:
          "bg-crit text-white hover:brightness-95",
        danger:
          "bg-crit text-white hover:brightness-95",
        ghost:
          "text-muted hover:bg-line2 hover:text-ink",
        rowIcon:
          "h-8 w-8 rounded-md text-muted hover:bg-line2 hover:text-ink p-0",
        link:
          "text-primary underline-offset-4 hover:underline",
        flow:
          "rounded-md px-3.5 h-9 text-[13px] font-medium border border-line bg-surface text-ink hover:bg-line2 transition-colors flex items-center gap-2",
      },
      size: {
        default: "h-9 px-3.5 text-[13px]",
        md: "h-9 px-3.5 text-[13px]",
        sm: "h-8 px-2.5 text-[12px]",
        lg: "h-10 px-5 text-[13.5px]",
        icon: "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, isLoading = false, onClick, disabled, children, ...props }, ref) => {
    const [internalBusy, setInternalBusy] = React.useState(false)
    const isBusy = Boolean(loading || isLoading || internalBusy)

    const handleClick = (event) => {
      if (isBusy || disabled) {
        event.preventDefault()
        return
      }
      if (typeof onClick === "function") {
        const result = onClick(event)
        if (result && typeof result.then === "function") {
          setInternalBusy(true)
          Promise.resolve(result).finally(() => {
            setInternalBusy(false)
          })
        }
      }
    }

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isBusy}
        data-custom-busy="true"
        onClick={handleClick}
        {...props}
      >
        {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
