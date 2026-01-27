'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Settings, Check, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, RotateCcw, RotateCw
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

interface QualityLevel {
    height: number;
    levelIndex: number;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({ src, poster, className, autoPlay = false, onTimeUpdate, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 is Auto
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [doubleClickAction, setDoubleClickAction] = useState<'forward' | 'backward' | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- HLS Setup & Video Events ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setIsBuffering(true);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((level, index) => ({
            height: level.height,
            levelIndex: index
        }));
        levels.sort((a, b) => b.height - a.height);
        setQualities(levels);
        setIsBuffering(false);
        if (autoPlay) video.play().catch(() => {});
      });
      
      setHlsInstance(hls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
         setIsBuffering(false);
         if (autoPlay) video.play().catch(() => {});
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src, autoPlay]);

  // Handle User Input Idle to hide controls
  const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying && !showSettings) setShowControls(false);
      }, 3000);
  };

  useEffect(() => {
      if (!isPlaying) {
          setShowControls(true);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      } else {
          handleMouseMove();
      }
  }, [isPlaying]);

  // Handle Double Tap Area Logic
  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      // If we are on a button/control, ignore
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !videoRef.current) return;
      
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      // Determine area (Left 30% for rewind, Right 30% for forward, Center for play/pause)
      if (x < width * 0.3) {
           // Double Click Logic for Rewind handled by specialized localized hook or state
      } else if (x > width * 0.7) {
           // Double Click Logic for Forward
      } else {
          togglePlay();
      }
  }, []);

  const lastClickTime = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef(0);

  const handleSmartClick = (e: React.MouseEvent) => {
      // Prevent click propagation if clicking on controls
      if ((e.target as HTMLElement).closest('.group\\/controls')) return;

      const now = Date.now();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !videoRef.current) return;
      
      const x = e.clientX - rect.left;
      const width = rect.width;
      const isCenter = x > width * 0.3 && x < width * 0.7;

      if (isCenter) {
           togglePlay();
           return;
      }

      // Handle Double Tap for sides
      if (now - lastClickTime.current < 300) {
          // Double tap detected
          if (clickTimeout.current) clearTimeout(clickTimeout.current);
          
          if (x < width * 0.3) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
            setDoubleClickAction('backward');
            setTimeout(() => setDoubleClickAction(null), 500);
          } else if (x > width * 0.7) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
            setDoubleClickAction('forward');
            setTimeout(() => setDoubleClickAction(null), 500);
          }
          lastClickTime.current = 0;
      } else {
          lastClickTime.current = now;
          // You could add single click side play/pause logic here if desired, 
          // but usually side clicks do nothing on single tap in mobile interactions to prevent accidental pauses 
          // while trying to double tap. For desktop, we might want to just toggle play if it's a slow single click,
          // but that gets complex. Let's keep it simple: Sides = Double Tap Seek only. Center = Play/Pause.
          clickTimeout.current = setTimeout(() => {
              if (isCenter) togglePlay(); 
          }, 300);
      }
  };


  // --- Video Control Handlers ---
  const togglePlay = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
          } else {
              videoRef.current.pause();
              setIsPlaying(false);
          }
      }
  };

  const handleTimeUpdate = () => {
      if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          setDuration(videoRef.current.duration);
          if (onTimeUpdate) onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration);
      }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (progressBarRef.current && videoRef.current) {
          const rect = progressBarRef.current.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          const newTime = pos * videoRef.current.duration;
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
      }
  };

  const toggleMute = () => {
      if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (videoRef.current) {
          videoRef.current.volume = val;
          setIsMuted(val === 0);
      }
  };

  const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen();
          setIsFullscreen(true);
      } else {
          document.exitFullscreen();
          setIsFullscreen(false);
      }
  };

  const changeSpeed = (speed: number) => {
      if (videoRef.current) {
          videoRef.current.playbackRate = speed;
          setPlaybackSpeed(speed);
      }
      setShowSettings(false);
  };

  const changeQuality = (levelIndex: number) => {
      if (hlsInstance) {
          hlsInstance.currentLevel = levelIndex;
          setCurrentQuality(levelIndex);
      }
      setShowSettings(false);
  };

  // Click outside setting to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div 
        ref={containerRef}
        className={`relative bg-black group overflow-hidden select-none ${className} ${isFullscreen ? 'h-screen w-screen' : 'rounded-xl shadow-2xl'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={handleSmartClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain pointer-events-none"
        poster={poster}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); if(onEnded) onEnded(); }}
      />
      
      {/* Double Tap Animation Overlay */}
      {doubleClickAction && (
        <div className={`absolute inset-y-0 w-1/3 flex items-center justify-center z-30 bg-white/10 backdrop-blur-[1px] animate-in fade-in duration-200 ${doubleClickAction === 'backward' ? 'left-0 rounded-r-[50%]' : 'right-0 rounded-l-[50%]'}`}>
            <div className="flex flex-col items-center text-white">
                {doubleClickAction === 'backward' ? <RotateCcw size={40} className="mb-2" /> : <RotateCw size={40} className="mb-2" />}
                <span className="text-sm font-bold">{doubleClickAction === 'backward' ? '-10s' : '+10s'}</span>
            </div>
        </div>
      )}

      {/* Center Buffering / Play Action */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isBuffering && <Loader2 className="w-12 h-12 text-white/50 animate-spin" />}
          {!isPlaying && !isBuffering && (
              <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                 <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              </div>
          )}
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 group/controls ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
          
          {/* Progress Bar */}
          <div 
            className="group/progress relative h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer mb-4 transition-all"
            onClick={handleSeek}
            ref={progressBarRef}
          >
             <div 
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
             >
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm scale-0 group-hover/progress:scale-100 transition-transform"></div>
             </div>
          </div>

          <div className="flex items-center justify-between">
             {/* Left Controls */}
             <div className="flex items-center gap-4">
                 <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                 </button>

                 <div className="group/vol flex items-center gap-2">
                     <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                         {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                     </button>
                     <input 
                        type="range"
                        min="0" max="1" step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-0 overflow-hidden group-hover/vol:w-20 transition-all h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                     />
                 </div>

                 <div className="text-xs text-zinc-300 font-mono">
                     {formatTime(currentTime)} / {formatTime(duration)}
                 </div>
             </div>

             {/* Right Controls */}
             <div className="flex items-center gap-3">
                 <div className="relative" ref={settingsRef}>
                     <button 
                        onClick={() => setShowSettings(!showSettings)} 
                        className={`p-1.5 rounded-full transition-all ${showSettings ? 'bg-white/10 text-white rotate-45' : 'text-zinc-300 hover:text-white hover:rotate-45'}`}
                    >
                         <Settings size={20} />
                     </button>
                     
                     {/* Settings Menu Popup - Youtube Style */}
                     {showSettings && (
                        <div className="absolute bottom-full right-0 mb-4 w-60 bg-black/95 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                             <div className="p-1 max-h-[300px] overflow-y-auto">
                                 
                                 {/* Playback Speed Section */}
                                 <div className="p-3 border-b border-white/10">
                                     <div className="text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Speed</div>
                                     <div className="grid grid-cols-3 gap-1">
                                        {[0.5, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => changeSpeed(speed)}
                                                className={`text-xs py-1.5 rounded-md transition-colors ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
                                            >
                                                {speed === 1 ? 'Normal' : `${speed}x`}
                                            </button>
                                        ))}
                                     </div>
                                 </div>

                                 {/* Quality Section */}
                                 {qualities.length > 0 && (
                                     <div className="p-3">
                                         <div className="text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Quality</div>
                                         <div className="space-y-0.5">
                                             <button
                                                 onClick={() => changeQuality(-1)}
                                                 className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${currentQuality === -1 ? 'bg-white/10 text-indigo-400' : 'hover:bg-white/5 text-zinc-300'}`}
                                             >
                                                 Auto
                                                 {currentQuality === -1 && <Check size={14} />}
                                             </button>
                                             {qualities.map(q => (
                                                 <button
                                                     key={q.levelIndex}
                                                     onClick={() => changeQuality(q.levelIndex)}
                                                     className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${currentQuality === q.levelIndex ? 'bg-white/10 text-indigo-400' : 'hover:bg-white/5 text-zinc-300'}`}
                                                 >
                                                     {q.height}p
                                                     {currentQuality === q.levelIndex && <Check size={14} />}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                     )}
                 </div>

                 <button onClick={toggleFullscreen} className="text-zinc-300 hover:text-white transition-colors">
                     {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                 </button>
             </div>
          </div>
      </div>
    </div>
  );
}
