'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroAnimation } from './intro-animation';

// Combined data for text and neon color (hex codes for text-stroke)
const languages = [
  { text: "Apna Coder",       color: "#ffffff" }, // White
  { text: "अपना कोडर",        color: "#fb923c" }, // Orange
  { text: "Tu Codificador",   color: "#facc15" }, // Yellow
  { text: "Votre Codeur",     color: "#60a5fa" }, // Blue
  { text: "Dein Coder",       color: "#f87171" }, // Red
  { text: "Il Tuo Coder",     color: "#4ade80" }, // Green
  { text: "Seu Codificador",  color: "#34d399" }, // Emerald
  { text: "Ваш Кодер",        color: "#22d3ee" }, // Cyan
  { text: "Kodu Yazan",       color: "#2dd4bf" }, // Teal
  { text: "آپنا کوڈر",        color: "#818cf8" }, // Indigo
  { text: "Anata no Coder",   color: "#fb7185" }, // Rose
  { text: "Ko Deu",           color: "#c084fc" }, // Purple
  { text: "नीज कोडर",         color: "#e879f9" }, // Fuchsia
  { text: "আপনা কোডার",       color: "#f472b6" }, // Pink
  { text: "అప్నా కోడర్",      color: "#fbbf24" }, // Amber
  { text: "અપના કોડર",        color: "#a3e635" }, // Lime
  { text: "അപ്നാ കോഡർ",      color: "#38bdf8" }, // Sky
  { text: "ਅਪਨਾ ਕੋਡਰ",        color: "#a78bfa" }, // Violet
  { text: "Developer",        color: "#ffffff" }, // Final
];

let hasShownSession = false;

export const Preloader = () => {
  const [shouldRender] = useState(!hasShownSession);
  const [index, setIndex] = useState(0);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'text'>('intro');

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (!shouldRender) return;
    if (phase === 'intro') return;

    // Mark as shown for this session
    hasShownSession = true;

    if (index === languages.length - 1) {
        // End of sequence
        setTimeout(() => {
            setShow(false);
        }, 1000);
        return;
    }

    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === 0 ? 2000 : 120); // Hold 'Apna Coder' longer (2s), then very fast (120ms) through others

    return () => clearTimeout(timeout);
  }, [index, shouldRender, phase]);
  
  if (!shouldRender) return null;

  const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height}  L0 0`;
  const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} 0 Q${dimension.width / 2} 0 0 0 L0 0`;

  const curve = {
    initial: {
      d: initialPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] as [number, number, number, number], delay: 0.3 },
    },
  };

  const currentLang = languages[index % languages.length];

  return (
    <AnimatePresence mode="wait">
        {show && phase === 'intro' && (
            <IntroAnimation key="intro" onComplete={() => setPhase('text')} />
        )}

        {show && phase === 'text' && (
            <motion.div
                key="text-loader"
                variants={slideUp}
                initial="initial"
                exit="exit"
                className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
            >
                {dimension.width > 0 && (
                <>
                    <motion.p 
                        variants={opacity}
                        initial="initial"
                        animate="enter"
                        className="flex text-5xl md:text-8xl font-black items-center z-10 font-sans tracking-tighter uppercase"
                        style={{ 
                            WebkitTextStroke: `1px ${currentLang.color}`,
                            color: 'transparent',
                            textShadow: `0 0 2px ${currentLang.color}`
                        }}
                    >
                        <span 
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full mr-4 md:mr-6 inline-block"
                            style={{
                                backgroundColor: currentLang.color,
                                boxShadow: `0 0 10px ${currentLang.color}`
                            }}
                        ></span>
                        {currentLang.text}
                    </motion.p>
                    
                    {/* SVG Curve for the curtain effect */}
                    <svg className="absolute top-0 w-full h-[calc(100%+300px)] pointer-events-none fill-zinc-950">
                        <motion.path 
                            variants={curve} 
                            initial="initial" 
                            exit="exit" 
                        />
                    </svg>
                </>
                )}
            </motion.div>
        )}
    </AnimatePresence>
  );
};

const slideUp = {
    initial: {
        top: 0
    },
    exit: {
        top: "-100vh",
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number], delay: 0.2 }
    }
}

const opacity = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 0.75,
        transition: { duration: 1, delay: 0.2 }
    },
}
