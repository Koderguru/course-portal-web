'use client';

import React, { useState } from 'react';
import { Course, Lesson } from '../../types/api';
import VideoPlayer from '../../components/VideoPlayer';
import Link from 'next/link';
import { ChevronDown, PlayCircle, FileText, CheckCircle, ChevronLeft, Menu, Youtube } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper for duration
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

interface CourseViewProps {
  content: Course;
}

export default function CourseView({ content }: CourseViewProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    // Auto-select the first video lesson
    for (const section of content.sections) {
        const firstVideo = section.lessons.find(l => l.type === 'video'); // Lowercase 'video' as per API
        if (firstVideo) return firstVideo;
    }
    return null;
  });

  const [currentProgress, setCurrentProgress] = useState(0);

  // Reset progress when lesson changes
  React.useEffect(() => {
     setCurrentProgress(0);
  }, [activeLesson]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.type === 'video') {
        setActiveLesson(lesson);
        // On mobile, close menu after selection
        setMobileMenuOpen(false);
    } else {
        // Open other types in new tab
        window.open(lesson.url, '_blank');
    }
  };

  const totalLessons = content.sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="h-screen bg-zinc-950 flex flex-col text-zinc-100 overflow-hidden font-sans">
        {/* Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
            <div className="flex items-center gap-4">
                <Link href={`/category/${content.id.split('-')[0] || 'sigma'}`} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
                     <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex flex-col">
                   <h1 className="text-sm font-medium text-zinc-400 uppercase tracking-wider hidden sm:block">{content.title}</h1>
                   {activeLesson ? (
                       <p className="text-white font-semibold truncate max-w-[200px] sm:max-w-md">{activeLesson.title}</p>
                   ) : (
                       <p className="text-white font-semibold sm:hidden">{content.title}</p>
                   )}
                </div>
            </div>
            
            <button 
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <Menu className="w-6 h-6" />
            </button>
        </header>

        <div className="flex-1 flex lg:overflow-hidden relative">
            {/* Left/Main Column: Video Player */}
            <main className={cn("flex-1 flex flex-col bg-black relative z-10 w-full transition-all duration-300", mobileMenuOpen ? "hidden lg:flex" : "flex")}>
                {activeLesson ? (
                    <div className="flex flex-col h-full">
                         <div className="relative flex-grow bg-black flex items-center justify-center">
                             <VideoPlayer 
                                src={activeLesson.url} 
                                autoPlay={true}
                                className="h-full w-full max-h-[calc(100vh-140px)]"
                                onTimeUpdate={(curr, dur) => {
                                    if (dur > 0) setCurrentProgress((curr / dur) * 100);
                                }}
                                onEnded={() => setCurrentProgress(100)}
                             />
                         </div>
                         <div className="p-4 lg:p-6 bg-zinc-900 border-t border-zinc-800 shrink-0">
                             <h2 className="text-lg lg:text-xl font-bold text-white mb-2">{activeLesson.title}</h2>
                             <div className="flex items-center gap-4 text-xs lg:text-sm text-zinc-500">
                                 {activeLesson.duration && <span>{formatDuration(activeLesson.duration)}</span>}
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        Select a lesson to start learning
                    </div>
                )}
            </main>

            {/* Right/Sidebar Column: Lesson List */}
             <aside className={cn("w-full lg:w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col absolute inset-0 z-20 lg:static transition-transform duration-300", mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")}>
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h2 className="font-semibold text-white">Course Content</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{totalLessons} lessons</p>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 text-zinc-400">
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {content.sections.map((section) => (
                        <div key={section.id} className="mb-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 mb-1 flex items-center gap-2">
                                {section.title}
                                {!section.isAvailable && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Coming Soon</span>}
                            </h3>
                            <div className="space-y-0.5">
                                {section.lessons.map((lesson) => {
                                    const isActive = activeLesson?.id === lesson.id;
                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonClick(lesson)}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-3 text-left rounded-lg transition-all group",
                                                isActive 
                                                    ? "bg-zinc-900 ring-1 ring-zinc-800 shadow-sm" 
                                                    : "hover:bg-zinc-900/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                isActive ? "text-green-500 bg-green-500/10" : "text-zinc-600 group-hover:text-zinc-400"
                                            )}>
                                                {lesson.type === 'video' ? (
                                                    <PlayCircle className="w-5 h-5" />
                                                ) : lesson.type === 'pdf' ? (
                                                    <FileText className="w-4 h-4" />
                                                ) : (
                                                    <Youtube className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-medium leading-snug", isActive ? "text-green-400" : "text-zinc-300")}>
                                                    {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {lesson.duration && (
                                                        <span className="text-xs text-zinc-500">{formatDuration(lesson.duration)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="mt-1">
                                                    {/* Animated EQ or just an indicator */}
                                                    <div className="flex gap-0.5 h-3 items-end">
                                                        <span className="w-0.5 bg-green-500 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-0.5 bg-green-500 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                                                        <span className="w-0.5 bg-green-500 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>

        <style jsx>{`
            @keyframes music-bar {
                0%, 100% { height: 30%; }
                50% { height: 100%; }
            }
        `}</style>
    </div>
  );
}
