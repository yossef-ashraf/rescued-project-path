"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils/utils.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  Clock,
  AlertCircle,
  X,
  Calendar,
  User,
  MapPin,
  MessageSquare,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const timelineVariants = cva("relative flex flex-col", {
  variants: {
    variant: {
      default: "gap-4",
      compact: "gap-2",
      spacious: "gap-8",
    },
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row",
    },
  },
  defaultVariants: {
    variant: "default",
    orientation: "vertical",
  },
});

const timelineItemVariants = cva("relative flex gap-3 pb-2", {
  variants: {
    orientation: {
      vertical: "flex-row",
      horizontal: "flex-col min-w-64 shrink-0",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const timelineConnectorVariants = cva("bg-slate-200 dark:bg-zinc-800", {
  variants: {
    orientation: {
      vertical: "absolute left-3 top-9 h-full w-px",
      horizontal: "absolute top-3 left-8 w-full h-px",
    },
    status: {
      default: "bg-slate-200 dark:bg-zinc-800",
      completed: "bg-emerald-500",
      active: "bg-[#BC5C29]",
      pending: "bg-slate-300 dark:bg-zinc-700",
      error: "bg-rose-500",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    status: "default",
  },
});

const timelineIconVariants = cva(
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-900 text-xs font-medium",
  {
    variants: {
      status: {
        default: "border-slate-300 dark:border-zinc-700 text-slate-400",
        completed: "border-emerald-500 bg-emerald-500 text-white",
        active: "border-[#BC5C29] bg-[#BC5C29] text-white animate-pulse",
        pending: "border-slate-300 dark:border-zinc-700 text-slate-400",
        error: "border-rose-500 bg-rose-500 text-white",
      },
    },
    defaultVariants: {
      status: "default",
    },
  },
);

function getStatusIcon(status) {
  switch (status) {
    case "completed":
      return <Check className="h-3 w-3" />;
    case "active":
      return <Clock className="h-3 w-3" />;
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "error":
      return <X className="h-3 w-3" />;
    default:
      return <div className="h-2 w-2 rounded-full bg-current" />;
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime()) && (timestamp.includes("-") || timestamp.includes("/"))) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return timestamp;
  }
  return String(timestamp);
}

export function Timeline({
  items = [],
  className = "",
  variant,
  orientation = "vertical",
  showConnectors = true,
  showTimestamps = true,
  timestampPosition = "top",
  ...props
}) {
  const scrollContainerRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);

  const handleMouseDown = (e) => {
    if (orientation !== "horizontal" || !scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleWheel = (e) => {
    if (orientation !== "horizontal" || !scrollContainerRef.current) return;
    if (Math.abs(e.deltaY) > 0) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollByAmount = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const timelineContent = (
    <div
      ref={scrollContainerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      className={cn(
        timelineVariants({ variant, orientation }),
        orientation === "horizontal"
          ? "pb-4 flex-row overflow-x-auto p-2 cursor-grab active:cursor-grabbing select-none"
          : "",
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(timelineItemVariants({ orientation }))}
        >
          {showConnectors && index < items.length - 1 && (
            <div
              className={cn(
                timelineConnectorVariants({
                  orientation,
                  status: item.status,
                }),
              )}
            />
          )}

          <div className="relative z-10 flex shrink-0">
            <div className={cn(timelineIconVariants({ status: item.status }))}>
              {item.icon || getStatusIcon(item.status)}
            </div>
          </div>

          <div className="flex min-w-64 max-w-72 flex-1 flex-col gap-1 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            {showTimestamps && timestampPosition === "top" && item.timestamp && (
              <time className="text-[11px] text-zinc-400 font-normal">
                {formatTimestamp(item.timestamp)}
              </time>
            )}

            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            )}

            {item.content && <div className="mt-1">{item.content}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  if (orientation === "horizontal") {
    return (
      <div className={cn("relative group w-full", className)} {...props}>
        <div className="absolute -top-10 end-0 hidden sm:flex items-center gap-1 z-20">
          <button
            type="button"
            onClick={() => scrollByAmount(-350)}
            className="p-1 rounded-lg border border-line bg-surface hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(350)}
            className="p-1 rounded-lg border border-line bg-surface hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <ScrollArea
          orientation="horizontal"
          className="w-full"
        >
          {timelineContent}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {timelineContent}
    </div>
  );
}

export {
  timelineVariants,
  timelineItemVariants,
  timelineConnectorVariants,
  timelineIconVariants,
};
