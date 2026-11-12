// @ts-nocheck
// Carried over unchanged from the original app.
'use client';

import React from "react";
import { AnimatedTopDock } from "@/components/shared/threeui/AnimatedTopDock";
import "@/components/shared/threeui/threeui.css";

export function Scene() {
  return (
    <div className="shader-frame w-full min-h-[140px] relative overflow-hidden flex items-center justify-center">
      <AnimatedTopDock
        variant="modern"
        proximity={122}
        spring={0.19}
        damping={0.70}
        widthGrowth={17}
        heightGrowth={16}
        drop={3.5}
      />
    </div>
  );
}

export default Scene;
