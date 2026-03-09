'use client';
import { cn } from "../../lib/utils";
import React from "react";

export const HeroParallax = ({
  header,
}: {
  header: React.ReactNode;
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center bg-white dark:bg-black overflow-hidden pb-16">
        <div className="absolute inset-0 w-full h-full bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/20 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pt-12 text-center">
            {header}
        </div>
    </div>
  );
};
