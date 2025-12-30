export interface Caption {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export enum AnimationStyle {
  // Viral / Social
  NONE = 'None',
  POP = 'Pop',
  PUNCH = 'Punch', // The "MrBeast/Hormozi" style rapid zoom
  ELASTIC = 'Elastic',
  NEON = 'Neon',
  
  // Documentary / Professional
  CINEMATIC = 'Cinematic', // Classic yellow/white with drop shadow, serif
  JOURNALIST = 'Journalist', // Box background, clean sans
  TYPEWRITER = 'Typewriter', // Mono font, blinking cursor feel
  MINIMAL = 'Minimal' // Thin font, subtle
}

// What the person is actually speaking
export enum SpokenLanguage {
  AUTO = 'Auto Detect',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  GUJARATI = 'Gujarati',
  MARATHI = 'Marathi',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  BENGALI = 'Bengali'
}

// How the text should appear on screen
export enum CaptionOutputFormat {
  ORIGINAL = 'Same as Audio (Native Script)',
  ENGLISH = 'English (Translation)',
  HINGLISH = 'Hinglish (Hindi in English bits)',
  GUJLISH = 'Gujlish (Gujarati in English bits)',
  ROMANIZED = 'Romanized (Any language in English bits)'
}

export interface VideoMetadata {
  name: string;
  url: string;
  duration: number;
}