import React from 'react';
import { Caption } from '../types';
import { Trash2, Plus, Clock } from 'lucide-react';

interface CaptionEditorProps {
  captions: Caption[];
  setCaptions: React.Dispatch<React.SetStateAction<Caption[]>>;
  currentTime: number;
  seekTo: (time: number) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({ 
  captions, 
  setCaptions, 
  currentTime, 
  seekTo 
}) => {
  
  const handleTextChange = (id: string, newText: string) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text: newText } : c));
  };

  const handleDelete = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const activeCaptionId = captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.id;

  return (
    <div className="flex flex-col h-full bg-surface/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50 backdrop-blur-sm">
        <h3 className="font-display font-bold text-lg text-white">Transcript</h3>
        <span className="text-xs text-slate-400 font-mono">{captions.length} segments</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {captions.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            <p>No captions generated yet.</p>
            <p className="text-sm mt-2">Upload a video to start.</p>
          </div>
        ) : (
          captions.map((caption) => (
            <div 
              key={caption.id}
              className={`group relative p-3 rounded-xl border transition-all duration-200 ${
                activeCaptionId === caption.id 
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20' 
                  : 'bg-slate-800/50 border-transparent hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => seekTo(caption.startTime)}
                  className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                >
                  <Clock size={10} />
                  {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                </button>
              </div>
              
              <textarea
                value={caption.text}
                onChange={(e) => handleTextChange(caption.id, e.target.value)}
                className="w-full bg-transparent text-slate-200 text-sm focus:outline-none focus:text-white resize-none"
                rows={Math.max(1, Math.ceil(caption.text.length / 40))}
              />

              <button
                onClick={() => handleDelete(caption.id)}
                className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-slate-700/50"
                title="Delete segment"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
