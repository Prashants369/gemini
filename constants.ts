import { AnimationStyle } from "./types";

// We can now accept large video files because we extract the audio client-side.
export const MAX_FILE_SIZE_MB = 500; 
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

export const ANIMATION_PRESETS: Record<AnimationStyle, { label: string; className: string; category: 'Viral' | 'Documentary' }> = {
  // Viral
  [AnimationStyle.PUNCH]: { label: 'Punch', category: 'Viral', className: 'anim-punch text-yellow-300 uppercase italic font-black text-stroke' },
  [AnimationStyle.POP]: { label: 'Pop In', category: 'Viral', className: 'anim-pop origin-bottom font-bold' },
  [AnimationStyle.ELASTIC]: { label: 'Elastic', category: 'Viral', className: 'anim-elastic text-emerald-300 font-black text-stroke' },
  [AnimationStyle.NEON]: { label: 'Neon', category: 'Viral', className: 'anim-neon font-bold tracking-wide text-pink-400' },
  
  // Documentary
  [AnimationStyle.CINEMATIC]: { label: 'Cinematic', category: 'Documentary', className: 'font-serif text-yellow-50 drop-shadow-md tracking-wide font-medium italic' },
  [AnimationStyle.JOURNALIST]: { label: 'Journalist', category: 'Documentary', className: 'bg-black/80 text-white px-4 py-1 font-sans font-medium' },
  [AnimationStyle.TYPEWRITER]: { label: 'Typewriter', category: 'Documentary', className: 'font-mono text-green-400 bg-black/90 px-2 py-1 anim-typewriter border-r-2' },
  [AnimationStyle.MINIMAL]: { label: 'Minimal', category: 'Documentary', className: 'font-sans font-light tracking-widest uppercase text-xs bg-black/40 px-3 py-1 backdrop-blur-sm' },
  [AnimationStyle.NONE]: { label: 'Simple', category: 'Documentary', className: 'font-sans' },
};