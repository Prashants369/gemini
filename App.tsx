import React, { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, Type, Sparkles, AlertCircle, Download, FileVideo, Languages, Film, Clapperboard } from 'lucide-react';
import { generateCaptions } from './services/geminiService';
import { VideoPlayer } from './components/VideoPlayer';
import { CaptionEditor } from './components/CaptionEditor';
import { Button } from './components/Button';
import { Caption, AnimationStyle, SpokenLanguage, CaptionOutputFormat } from './types';
import { ANIMATION_PRESETS, MAX_FILE_SIZE_MB } from './constants';

const App: React.FC = () => {
  // State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>(AnimationStyle.CINEMATIC);
  
  // Position State (Default to bottom center-ish)
  const [captionPosition, setCaptionPosition] = useState({ x: 50, y: 80 });

  // Language State
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>(SpokenLanguage.AUTO);
  const [outputFormat, setOutputFormat] = useState<CaptionOutputFormat>(CaptionOutputFormat.ENGLISH);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Cleanup old URL
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setCaptions([]); // Reset captions
    setError(null);
  };

  const handleGenerate = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setError(null);
    try {
      const generatedCaptions = await generateCaptions(
        videoFile, 
        spokenLanguage,
        outputFormat,
        (status) => setProgressStatus(status)
      );
      setCaptions(generatedCaptions);
    } catch (err: any) {
      setError(err.message || "Failed to generate captions. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgressStatus("");
    }
  };

  const handleExport = () => {
    // Generate .srt content
    let srtContent = "";
    captions.forEach((cap, index) => {
      const start = new Date(cap.startTime * 1000).toISOString().slice(11, 23).replace('.', ',');
      const end = new Date(cap.endTime * 1000).toISOString().slice(11, 23).replace('.', ',');
      srtContent += `${index + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group Animations by Category
  const viralAnimations = Object.entries(ANIMATION_PRESETS).filter(([_, val]) => val.category === 'Viral');
  const docAnimations = Object.entries(ANIMATION_PRESETS).filter(([_, val]) => val.category === 'Documentary');

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AutoCaption AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <Clapperboard size={14} /> Documentary Mode
             </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
              Gemini 3 Powered
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-fade">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)] min-h-[600px]">
          
          {/* Left Column: Video & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Video Preview */}
            <div className="bg-surface rounded-3xl p-6 shadow-xl border border-slate-800 flex-1 flex flex-col justify-center min-h-[400px]">
              <VideoPlayer
                src={videoUrl}
                captions={captions}
                animationStyle={animationStyle}
                onTimeUpdate={setCurrentTime}
                videoRef={videoRef}
                captionPosition={captionPosition}
                setCaptionPosition={setCaptionPosition}
              />
              {captions.length > 0 && (
                <div className="mt-4 text-center">
                   <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                     Drag text on video to position it
                   </p>
                </div>
              )}
            </div>

            {/* Main Action Area */}
            <div className="bg-surface rounded-2xl p-6 border border-slate-800 space-y-4">
              {!videoFile ? (
                <div 
                  className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-800/50 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-primary" size={32} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-1">Upload Video</h3>
                  <p className="text-slate-400 text-sm mb-4">Portrait or Landscape (Max {MAX_FILE_SIZE_MB}MB)</p>
                  <Button variant="secondary" size="sm">Select File</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileVideo size={20} className="text-indigo-400" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-white truncate">{videoFile.name}</p>
                      <p className="text-xs text-slate-400">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setVideoFile(null); setVideoUrl(null); setCaptions([]); }}
                    className="text-slate-500 hover:text-red-400 p-2"
                  >
                    Change
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*" 
              />

              {videoFile && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                     {/* Spoken Language */}
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                           <Languages size={12} /> Audio Speech
                        </label>
                        <select 
                          value={spokenLanguage}
                          onChange={(e) => setSpokenLanguage(e.target.value as SpokenLanguage)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                          {Object.values(SpokenLanguage).map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                     </div>

                     {/* Caption Format */}
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                           <Type size={12} /> Caption Text
                        </label>
                        <select 
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value as CaptionOutputFormat)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                          {Object.values(CaptionOutputFormat).map((fmt) => (
                            <option key={fmt} value={fmt}>{fmt}</option>
                          ))}
                        </select>
                     </div>
                  </div>

                  <p className="text-xs text-slate-500 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    Converting <strong>{spokenLanguage}</strong> speech to <strong>{outputFormat}</strong> text.
                  </p>

                  <Button 
                    className="w-full font-display text-lg shadow-xl shadow-primary/20" 
                    onClick={handleGenerate} 
                    isLoading={isProcessing}
                    disabled={captions.length > 0}
                    icon={<Wand2 size={20} />}
                  >
                    {isProcessing ? progressStatus : captions.length > 0 ? 'Captions Generated!' : 'Generate Captions'}
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Editor & Styles */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* Style Selector */}
            <div className="bg-surface rounded-2xl p-6 border border-slate-800 overflow-y-auto max-h-[40vh]">
              <div className="flex items-center gap-2 mb-4">
                <Film size={18} className="text-secondary" />
                <h3 className="font-display font-bold text-white">Visual Style</h3>
              </div>
              
              {/* Documentary Styles */}
              <div className="mb-4">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Documentary & Professional</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {docAnimations.map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => setAnimationStyle(key as AnimationStyle)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all border
                        ${animationStyle === key 
                          ? 'bg-secondary/20 text-white border-secondary ring-1 ring-secondary' 
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}
                      `}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viral Styles */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Viral & Social</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {viralAnimations.map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => setAnimationStyle(key as AnimationStyle)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all border
                        ${animationStyle === key 
                          ? 'bg-primary/20 text-white border-primary ring-1 ring-primary' 
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}
                      `}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript Editor */}
            <div className="flex-1 min-h-0">
               <CaptionEditor 
                  captions={captions}
                  setCaptions={setCaptions}
                  currentTime={currentTime}
                  seekTo={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                      videoRef.current.play();
                    }
                  }}
               />
            </div>

            {/* Export Actions */}
            <div className="flex justify-end pt-2">
               <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={captions.length === 0}
                icon={<Download size={18} />}
               >
                 Export .SRT
               </Button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;