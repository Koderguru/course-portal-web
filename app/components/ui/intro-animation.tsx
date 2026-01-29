'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'closed' | 'open' | 'exit'>('closed');

  useEffect(() => {
    // 1. Start Opening
    const openTimer = setTimeout(() => {
      setPhase('open');
    }, 800);

    // 2. Start Exit
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, 3800);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8 }}
      onAnimationComplete={(definition: any) => {
        if (phase === 'exit') {
          onComplete();
        }
      }}
    >
      {/* 
        TOP CURTAIN 
        - Initially covers >50% to ensure overlap (51vh)
        - Retracts to visible header bar
      */}
      <motion.div
        className="absolute top-0 left-0 w-full z-20 flex flex-col justify-end"
        initial={{ height: "52vh" }}
        animate={phase === 'open' || phase === 'exit' ? { height: "140px" } : { height: "52vh" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      >
        <div className="flex-1 bg-white w-full" />
        <div className="relative w-full h-20 md:h-32 shrink-0">
          <Image
            src="/paper-tear.png"
            alt="Paper Tear Top"
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>
      </motion.div>

      {/* 
        BOTTOM CURTAIN 
        - Initially covers >50%
        - Retracts to visible footer bar
      */}
      <motion.div
        className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-start"
        initial={{ height: "52vh" }}
        animate={phase === 'open' || phase === 'exit' ? { height: "140px" } : { height: "52vh" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      >
        <div className="relative w-full h-20 md:h-32 shrink-0">
          <Image
            src="/paper-tear-bottom.png"
            alt="Paper Tear Bottom"
            fill
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="flex-1 bg-white w-full" />
      </motion.div>

      {/* 
        CENTER LOGO 
        - Pops out from the center void
      */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, opacity: 0, y: 100 }}
        animate={
          phase === 'open' || phase === 'exit'
            ? { scale: 1, opacity: 1, y: 0 }
            : { scale: 0, opacity: 0, y: 100 }
        }
        transition={{ 
            delay: 0.4,
            type: "spring", 
            stiffness: 180, 
            damping: 15 
        }}
      >
        <Image
          src="/logo.png"
          alt="Brand Logo"
          width={500}
          height={500}
          className="w-48 sm:w-80 md:w-96"
          priority
        />
      </motion.div>
    </motion.div>
  );
};
