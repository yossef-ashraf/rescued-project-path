// @ts-nocheck
// Carried over unchanged from the original app.
'use client';

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import Link from '@/shared/next-compat/link';
import { useRouter, usePathname } from '@/shared/next-compat/navigation';
import { createTopDockController, type TopDockOptions } from "./topDockController";

export const ANIMATED_TOP_DOCK_VARIANTS = ["sable", "modern", "retro", "glass"] as const;
export type AnimatedTopDockVariant = (typeof ANIMATED_TOP_DOCK_VARIANTS)[number];

export type AnimatedTopDockProps = {
  variant?: AnimatedTopDockVariant;
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  pixelSize?: number;
  speed?: number;
  noise?: number;
  levels?: number;
  scanlines?: number;
  particles?: number;
  thickness?: number;
  dispersion?: number;
  specular?: number;
  rim?: number;
  drift?: number;
  className?: string;
};

export const ANIMATED_TOP_DOCK_DEFAULTS = {
  variant: "modern" as AnimatedTopDockVariant,
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
  pixelSize: 4,
  speed: 1,
  noise: 1,
  levels: 7,
  scanlines: 0.32,
  particles: 22,
  thickness: 0.115,
  dispersion: 0.05,
  specular: 0.85,
  rim: 0.5,
  drift: 1,
} as const;

export type DockItem = { id: string; label: string; icon: ReactNode; href?: string };

const CODEX_MODERN_ITEMS: readonly DockItem[] = [
  {
    id: "finance",
    label: "Finance",
    href: "/",
    icon: (
      <>
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M8 4.2v7.6M6 6.2c.4-.6 1.1-.9 2-.9 1.4 0 2.1.7 2.1 1.5s-.8 1.4-2.1 1.6c-1.3.2-2.1.8-2.1 1.6s.7 1.5 2.1 1.5c.9 0 1.6-.3 2-.9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/tasks/todo",
    icon: (
      <>
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="m5.2 8 2 2 3.8-3.8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "leads",
    label: "Leads",
    href: "/leads",
    icon: (
      <>
        <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="m2.5 4.5 5.5 4.2 5.5-4.2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "courses",
    label: "Courses",
    href: "/courses",
    icon: (
      <>
        <path d="M8 3 2.5 6 8 9l5.5-3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        <path d="M4.5 7.5v3.5c0 1.4 1.5 2.5 3.5 2.5s3.5-1.1 3.5-2.5V7.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "retro-ai",
    label: "Retro AI",
    href: "/retro-ai-conf",
    icon: (
      <>
        <rect x="2.5" y="3" width="11" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="m4.8 6.5 1.6 1.3-1.6 1.3M8 9.2h3.2M5.5 13.5h5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: (
      <>
        <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M3.8 12.2l1.1-1.1M11.1 4.9l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
];

const CODEX_BRAND_MARK = (
  <svg viewBox="0 0 342 180" fill="none" aria-hidden="true" style={{ width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id="codexAtdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C4D31" />
        <stop offset="100%" stopColor="#BC5C29" />
      </linearGradient>
    </defs>
    <g fill="url(#codexAtdGrad)">
      <path d="M 0 0 H 43 L 104 83 V 141 L 66 180 V 93 Z" />
      <path d="M 135 0 H 178 L 118 93 L 94 61 Z" />
      <path d="M 249 1 L 173 180 H 213 L 249 72 Z" />
      <path d="M 249 1 L 342 180 H 220 L 228 149 H 283 L 249 72 Z" />
    </g>
  </svg>
);

function useDockController(getOptions: () => TopDockOptions) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return createTopDockController(root, getOptions);
  }, [getOptions]);
  return rootRef;
}

export function AnimatedTopDock({ className = "", ...props }: AnimatedTopDockProps) {
  const router = useRouter();
  const pathname = usePathname();

  const options: TopDockOptions = {
    proximity: props.proximity ?? ANIMATED_TOP_DOCK_DEFAULTS.proximity,
    spring: props.spring ?? ANIMATED_TOP_DOCK_DEFAULTS.spring,
    damping: props.damping ?? ANIMATED_TOP_DOCK_DEFAULTS.damping,
    widthGrowth: props.widthGrowth ?? ANIMATED_TOP_DOCK_DEFAULTS.widthGrowth,
    heightGrowth: props.heightGrowth ?? ANIMATED_TOP_DOCK_DEFAULTS.heightGrowth,
    drop: props.drop ?? ANIMATED_TOP_DOCK_DEFAULTS.drop,
    axis: "x",
    lockTrack: true,
  };

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const items = CODEX_MODERN_ITEMS;

  const currentActiveId = items.find(
    (i) => i.href && (i.href === "/" ? pathname === "/" : pathname?.startsWith(i.href))
  )?.id || items[0].id;

  const [userActive, setUserActive] = useState<string | null>(null);
  const active = userActive ?? currentActiveId;

  const rootRef = useDockController(() => ({
    ...optionsRef.current,
    axis: "x",
    lockTrack: true,
  }));

  const handleItemClick = (item: DockItem) => {
    setUserActive(item.id);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className={`animated-top-dock-component atd-modern ${className}`.trim()}>
      <div className="atd-modern__aurora" aria-hidden="true" />
      <header className="atd-modern__bar">
        <Link
          className="atd-modern__brand"
          href="/"
          aria-label="Codex Home"
        >
          <span className="atd-modern__mark" aria-hidden="true">
            {CODEX_BRAND_MARK}
          </span>
          <span className="atd-modern__word font-mono tracking-wider font-bold">CODEX</span>
        </Link>

        <nav
          ref={rootRef}
          className="atd-modern__dock"
          aria-label="Primary"
          data-dock-state="idle"
          data-dock-max="0.00"
        >
          {items.map((item) => (
            <button
              key={item.id}
              className="atd-modern__item"
              data-dock-item
              type="button"
              aria-pressed={active === item.id}
              onClick={() => handleItemClick(item)}
            >
              <span className="atd-modern__icon" aria-hidden="true">
                <svg viewBox="0 0 16 16">{item.icon}</svg>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="atd-modern__actions">
          <button
            className="atd-modern__ghost"
            type="button"
            onClick={() => router.push('/profile')}
          >
            Profile
          </button>
          <button
            className="atd-modern__cta"
            type="button"
            onClick={() => router.push('/tasks/todo')}
          >
            <span>+ Task</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.2 8h9.1M8.6 4.3 12.4 8l-3.8 3.7" />
            </svg>
          </button>
        </div>
      </header>

      <div className="atd-modern__stage" aria-hidden="true">
        <p className="atd-modern__eyebrow">Command & Operating Center</p>
        <p className="atd-modern__headline">Personal Finance, Tasks & Systems</p>
      </div>

      <p className="animated-top-dock-component__caption">
        PROXIMITY SPRING DOCK · CODEX WORKSPACE
      </p>
    </div>
  );
}

export default AnimatedTopDock;
