'use client';

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import Link from "next/link";
import React from "react";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}) => {
  const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
  
  return (
    <div
      className={cn(
        "relative h-full flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-black",
        containerClassName
      )}
      {...props}
    >
        <div className="absolute inset-0 opacity-10 dark:opacity-20" style={{ backgroundImage: noise }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/50 to-white dark:from-black/0 dark:via-black/50 dark:to-black z-0 pointer-events-none"></div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
    link: string;
    colorFrom: string;
    colorTo: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}) => {
  let [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-10",
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          href={item.link}
          key={item.link}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div
            className="rounded-2xl h-full w-full p-4 overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-gray-200 dark:border-white/[0.1] hover:border-blue-500/50 dark:hover:border-blue-500/50 relative z-20 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:-translate-y-1"
          >
             {/* Gradient Background Effect on Hover */}
             <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br" 
                style={{ backgroundImage: `linear-gradient(to bottom right, ${item.colorFrom}, ${item.colorTo})` }}
             ></div>

             <div className="relative z-50 flex flex-col h-full">
                <div 
                    className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-500 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.colorFrom}20, ${item.colorTo}20)`, color: item.colorFrom }}
                >
                    <div className="opacity-80 drop-shadow-sm" style={{ color: item.colorTo }}>
                        {item.icon}
                    </div>
                </div>
                
                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold tracking-tight mb-2 text-lg group-hover:text-zinc-700 dark:group-hover:text-white transition-colors duration-300 shrink-0">
                    {item.title}
                </h4>
                
                <p className="text-zinc-500 dark:text-zinc-400 leading-snug text-xs sm:text-sm line-clamp-2 mb-3 flex-grow">
                    {item.description}
                </p>
                
                <div className="flex items-center text-xs font-semibold transition-all duration-300 group-hover:translate-x-1 shrink-0"
                     style={{ color: item.colorTo }}
                >
                    Start Learning <span className="ml-2">→</span>
                </div>
            </div>
            
             {/* Decorative bottom border */}
             <div className="absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${item.colorFrom}, ${item.colorTo})` }}></div>
          </div>
        </Link>
      ))}
    </div>
  );
};
