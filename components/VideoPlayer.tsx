import React, { useRef, useEffect, useState } from 'react';
import { Caption, AnimationStyle } from '../types';
import { ANIMATION_PRESETS } from '../constants';
import { Play, Pause, RotateCcw, Move } from 'lucide-react';

interface VideoPlayerProps {
  src: string | null;
  captions: Caption[];
  animationStyle: AnimationStyle;
  onTimeUpdate: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  captionPosition: { x: number; y: number };
  setCaptionPosition: (pos: { x: number; y: number }) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  captions, 
  animationStyle, 
  onTimeUpdate,
  videoRef,
  captionPosition,
  setCaptionPosition
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<Caption | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (!videoRef.current || !src) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    onTimeUpdate(time);
    
    // Find active caption
    const active = captions.find(c => time >= c.startTime && time <= c.endTime);
    
    // Only update state if changed to prevent re-renders
    if (active?.id !== currentCaption?.id) {
      setCurrentCaption(active);
    }

    const duration = videoRef.current.duration || 1;
    setProgress((time / duration) * 100);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const ratio = video.videoWidth / video.videoHeight;
    setAspectRatio(ratio);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  };

  // --- Drag Logic ---
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent play/pause click
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp values between 0 and 100
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      setCaptionPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setCaptionPosition]);

  // Reset play state if src changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentCaption(undefined);
    setAspectRatio(null);
  }, [src]);

  const isPortrait = aspectRatio ? aspectRatio < 1 : true;
  const containerStyle = aspectRatio ? { aspectRatio: `${aspectRatio}` } : { aspectRatio: '9/16' };
  const maxWidthClass = isPortrait ? 'max-w-[400px]' : 'max-w-[640px]';

  return (
    <div 
      ref={containerRef}
      className={`relative group w-full ${maxWidthClass} mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 transition-all duration-500 ease-in-out`}
      style={src ? containerStyle : undefined}
    >
      {!src ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-4 aspect-[9/16]">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center">
            <Play size={24} className="ml-1" />
          </div>
          <p className="font-medium">Preview Area</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain bg-black"
            playsInline
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Caption Overlay - Draggable Area */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {/* 
               The caption container. 
               We use translate to center the text on the coordinate point.
             */}
             <div 
               className={`absolute flex flex-col items-center justify-center transition-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} pointer-events-auto`}
               style={{ 
                 left: `${captionPosition.x}%`, 
                 top: `${captionPosition.y}%`,
                 transform: 'translate(-50%, -50%)',
                 width: '80%' // prevent text from being too wide
               }}
               onMouseDown={handleDragStart}
             >
                {/* Drag Handle (Visible on Hover/Drag) */}
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-white/20 p-1 rounded-full backdrop-blur-sm transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Move size={12} className="text-white" />
                </div>

                {/* The Caption Text */}
                <div className={`text-center w-full`}>
                  <span 
                    className={`
                      inline-block text-center rounded-xl font-display transition-all duration-200
                      ${isPortrait ? 'text-3xl leading-snug' : 'text-2xl leading-snug'}
                      ${ANIMATION_PRESETS[animationStyle].className}
                      ${isDragging ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-black/50' : ''}
                    `}
                  >
                    {currentCaption ? currentCaption.text : <span className="opacity-50 text-base italic font-sans bg-black/50 px-2 py-1 rounded">Drag to position captions</span>}
                  </span>
                </div>
             </div>
          </div>

          {/* Custom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
             {/* Progress Bar */}
            <div 
              className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-2.5 transition-all"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-primary rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
               <button 
                onClick={() => {
                  if(videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw size={20} />
              </button>

              <button 
                onClick={togglePlay}
                className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};