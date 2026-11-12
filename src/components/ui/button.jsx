'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/shared/utils/utils.js"

// Filament-style geometry (see .ui-btn in styles.css); variants only change colour.
const buttonVariants = cva("ui-btn", {
    variants: {
      variant: {
        default: "ui-btn-primary",
        primary: "ui-btn-primary",
        secondary: "ui-btn-gray",
        outline: "ui-btn-gray",
        flow: "ui-btn-gray",
        gray: "ui-btn-gray",
        solid: "ui-btn-solid",
        destructive: "ui-btn-danger",
        danger: "ui-btn-danger",
        ghost: "ui-btn-ghost",
        rowIcon: "ui-btn-ghost ui-btn-icon ui-btn-sm",
        link: "ui-btn-link",
      },
      size: {
        default: "",
        md: "",
        xs: "ui-btn-xs",
        sm: "ui-btn-sm",
        lg: "ui-btn-lg",
        xl: "ui-btn-xl",
        icon: "ui-btn-icon",
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
        aria-busy={isBusy || undefined}
        onClick={handleClick}
        {...props}
      >
        {isBusy && <Loader2 className="animate-spin" />}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
