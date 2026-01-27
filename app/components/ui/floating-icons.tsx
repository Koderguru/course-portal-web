'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Database, Globe, Server, Terminal, Cpu, Braces, Laptop } from 'lucide-react';

export const FloatingIcons = () => {
  const icons = [
    { Icon: Code, color: 'text-blue-500', x: '10%', y: '20%', delay: 0 },
    { Icon: Database, color: 'text-emerald-500', x: '85%', y: '15%', delay: 1 },
    { Icon: Server, color: 'text-purple-500', x: '15%', y: '60%', delay: 2 },
    { Icon: Terminal, color: 'text-amber-500', x: '80%', y: '70%', delay: 0.5 },
    { Icon: Cpu, color: 'text-rose-500', x: '50%', y: '10%', delay: 1.5 },
    { Icon: Globe, color: 'text-cyan-500', x: '5%', y: '40%', delay: 2.5 },
    { Icon: Braces, color: 'text-indigo-400', x: '90%', y: '45%', delay: 3 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {icons.map(({ Icon, color, x, y, delay }, index) => (
        <motion.div
          key={index}
          className={`absolute ${color} opacity-20 dark:opacity-20`}
          style={{ left: x, top: y }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ 
            y: [-10, 10, -10],
            opacity: 0.2,
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
          }}
        >
          <Icon size={index % 2 === 0 ? 40 : 24} />
        </motion.div>
      ))}
    </div>
  );
};
