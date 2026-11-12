"use client";

import * as React from "react";
import { cn } from "@/shared/utils/utils.js";

const Avatar = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800", className)}
    {...props}
  >
    {children}
  </div>
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(({ className, src, alt, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);
  if (hasError || !src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt || "Avatar"}
      onError={() => setHasError(true)}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback, AvatarImage };
