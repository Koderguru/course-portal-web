import { getCategories } from './lib/api';
import { HoverEffect } from './components/ui/card-hover-effect';
import { Preloader } from './components/ui/preloader';
import { FloatingIcons } from './components/ui/floating-icons';
import { SecretChat } from './components/SecretChat';
import { BadgeCheck, BookOpen, Code, GraduationCap, Layout, Sparkles, Terminal, Cpu } from 'lucide-react';

// Map icons and colors
const getCategoryMetadata = (id: string) => {
    const meta: Record<string, { colorFrom: string, colorTo: string, icon: any }> = {
      'alpha': { colorFrom: '#3B82F6', colorTo: '#06B6D4', icon: <Code className="text-blue-500" /> }, // Blue to Cyan
      'delta': { colorFrom: '#10B981', colorTo: '#34D399', icon: <Layout className="text-emerald-500" /> }, // Green
      'sigma': { colorFrom: '#8B5CF6', colorTo: '#C084FC', icon: <Terminal className="text-purple-500" /> }, // Purple
      'prime': { colorFrom: '#F59E0B', colorTo: '#FBBF24', icon: <Cpu className="text-amber-500" /> }, // Orange
      'alpha-plus': { colorFrom: '#2563EB', colorTo: '#6366F1', icon: <Sparkles className="text-indigo-500" /> }, // Indigo
      'sigma-prime': { colorFrom: '#DB2777', colorTo: '#F472B6', icon: <GraduationCap className="text-pink-500" /> }, // Pink
      'aptitude': { colorFrom: '#E11D48', colorTo: '#F43F5E', icon: <BookOpen className="text-rose-500" /> }, // Rose
    };
    return meta[id] || { colorFrom: '#64748B', colorTo: '#94A3B8', icon: <BadgeCheck className="text-slate-500" /> };
};

export default async function Home() {
  const categories = await getCategories();
  
  const formattedItems = categories.map(cat => {
      const meta = getCategoryMetadata(cat.id);
      return {
          title: cat.name,
          description: cat.description || "Explore comprehensive courses and materials in this category.",
          link: `/category/${cat.id}`,
          colorFrom: meta.colorFrom,
          colorTo: meta.colorTo,
          icon: meta.icon
      };
  });

  return (
    <main className="h-screen w-full bg-gray-50 dark:bg-black font-sans selection:bg-indigo-500 selection:text-white overflow-hidden flex flex-col justify-center items-center relative">
      <Preloader />
      <FloatingIcons />
      <SecretChat />
      
      {/* Background Grid - Absolute to not take space */}
      <div className="absolute inset-0 w-full h-full bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/20 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none z-0"></div>

      <div className="z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col h-full justify-center">
          
          {/* Header Section - Compact */}
          <div className="text-center mb-4 sm:mb-8 pt-12 sm:pt-16 shrink-0 relative z-20">
                <h2 className="text-sm md:text-base font-medium text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-3">
                    Welcome to Apna Coder
                </h2>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 leading-tight drop-shadow-sm">
                    Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 animate-gradient-x">Engineering Skills</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] sm:text-xs font-semibold mb-4 border border-blue-200 dark:border-blue-700/50 backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" /> v2.0 Now Available
                </span>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
                    Premium coding courses, aptitude training, and full-stack development.
                </p>
          </div>

          {/* Cards Section - Takes remaining space */}
          <div className="flex-1 flex items-center justify-center min-h-0 relative z-20">
            <HoverEffect items={formattedItems} className="py-0" />
          </div>
      </div>

    </main>
  );
}
