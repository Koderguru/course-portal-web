'use client';

import React, { useState } from 'react';
import { BatchContent } from '../../types/BatchContent';
import { Lesson, formatDuration } from '../../types/Lesson';
import VideoPlayer from '../../components/VideoPlayer';
import Link from 'next/link';
import { ChevronDown, PlayCircle, FileText, CheckCircle, ChevronLeft, Menu, Youtube } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CourseViewProps {
  content: BatchContent;
}

export default function CourseView({ content }: CourseViewProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    // Auto-select the first video lesson
    for (const section of content.sections) {
        const firstVideo = section.lessons.find(l => l.type === 'VIDEO');
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
    if (lesson.type === 'VIDEO') {
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
                                 {activeLesson.sectionTitle && (
                                     <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                        <span>{activeLesson.sectionTitle}</span>
                                     </>
                                 )}
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                         <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <PlayCircle className="w-8 h-8 opacity-50" />
                         </div>
                         <h3 className="text-lg font-medium text-white mb-1">Select a lesson</h3>
                         <p>Choose a video from the list to start watching.</p>
                    </div>
                )}
            </main>

            {/* Right/Sidebar Column: Content List */}
            <aside 
                className={cn(
                    "absolute inset-y-0 right-0 w-full sm:w-80 lg:w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col transform transition-transform duration-300 z-20 lg:relative lg:transform-none lg:flex h-full",
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                )}
            >
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
                    <h3 className="font-semibold text-white">Course Content</h3>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-zinc-500">{totalLessons} Lessons</span>
                        <span className="text-xs text-white font-medium">{Math.round(currentProgress)}% Completed</span>
                    </div>
                    {/* Progress Bar tied to current video */}
                    <div className="h-1 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-300 ease-linear rounded-full" 
                            style={{ width: `${currentProgress}%` }}
                        ></div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col pb-4">
                        {content.sections.map((section, idx) => {
                             // Check if section contains current lesson to open it by default
                             const containsActive = section.lessons.some(l => l.id === activeLesson?.id);
                             return (
                                <div key={section.id} className="border-b border-zinc-800 last:border-0">
                                    <details className="group" open={containsActive || idx === 0}>
                                        <summary className="cursor-pointer list-none px-4 py-3 font-medium text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors flex justify-between items-center bg-zinc-900 sticky top-0 z-10 selection:bg-transparent">
                                            <span className="truncate pr-2">{section.title}</span>
                                            <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform" />
                                        </summary>
                                        
                                        <div className="flex flex-col bg-zinc-900/50">
                                            {section.lessons.map((lesson) => {
                                                const isActive = activeLesson?.id === lesson.id;
                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => handleLessonClick(lesson)}
                                                        className={cn(
                                                            "flex items-start gap-3 px-4 py-3 text-left transition-colors text-sm hover:bg-zinc-800 relative group/item",
                                                            isActive ? "bg-indigo-500/10 hover:bg-indigo-500/20" : ""
                                                        )}
                                                    >
                                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                                                        
                                                        <div className={cn("mt-0.5 shrink-0", isActive ? "text-indigo-400" : "text-zinc-500 group-hover/item:text-zinc-400")}>
                                                            {lesson.type === 'VIDEO' ? (
                                                                <PlayCircle className="w-4 h-4" />
                                                            ) : lesson.type === 'YOUTUBE' ? (
                                                                <Youtube className="w-4 h-4" />
                                                            ) : (
                                                                <FileText className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("leading-tight mb-1 transition-colors", isActive ? "text-indigo-300 font-medium" : "text-zinc-400 group-hover/item:text-zinc-300")}>
                                                                {lesson.title}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-zinc-600">{formatDuration(lesson.duration)}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </details>
                                </div>
                             )
                        })}
                    </div>
                </div>
            </aside>
            
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    </div>
  );
}
