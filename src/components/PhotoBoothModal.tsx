import React, { useState } from 'react';
import { Camera, X, Sparkles, RefreshCw, Image, Download, Share2 } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface PhotoBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineTitle: string;
}

export const PhotoBoothModal: React.FC<PhotoBoothModalProps> = ({
  isOpen,
  onClose,
  machineTitle
}) => {
  const [activeFilter, setActiveFilter] = useState<'neon' | 'vintage' | 'party' | 'rock'>('neon');
  const [isSnapped, setIsSnapped] = useState(false);

  if (!isOpen) return null;

  const handleSnap = () => {
    soundEffects.playButtonClick();
    setIsSnapped(true);
    setTimeout(() => {
      setIsSnapped(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-[#0a0d18] border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.6)] text-white flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-cyan-400" />
            <h2 className="font-chakra font-black text-xl text-white tracking-wide">
              TOUCHTUNES PHOTO BOOTH
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Stage */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-cyan-400/60 bg-black flex items-center justify-center shadow-inner">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80"
            alt="Camera Feed"
            className={`w-full h-full object-cover transition-all ${
              activeFilter === 'neon'
                ? 'hue-rotate-90 saturate-150'
                : activeFilter === 'vintage'
                ? 'sepia contrast-125'
                : activeFilter === 'party'
                ? 'saturate-200 contrast-110'
                : 'grayscale contrast-150'
            }`}
          />

          {/* Jukebox Overlay Frame */}
          <div className="absolute inset-0 pointer-events-none border-8 border-cyan-500/30 flex flex-col justify-between p-3">
            <div className="flex justify-between items-center">
              <span className="font-chakra font-black text-xs text-cyan-300 bg-black/70 px-2 py-0.5 rounded border border-cyan-400/40">
                Rockola Live
              </span>
              <span className="font-mono text-xs text-pink-400 bg-black/70 px-2 py-0.5 rounded border border-pink-400/40">
                REC ●
              </span>
            </div>

            <div className="text-center bg-black/70 py-1 px-3 rounded-xl border border-white/20 self-center">
              <span className="font-chakra font-black text-sm text-cyan-300">
                {machineTitle || 'Rockola HD'}
              </span>
            </div>
          </div>

          {/* Flash animation */}
          {isSnapped && (
            <div className="absolute inset-0 bg-white animate-fade-out pointer-events-none flex items-center justify-center">
              <span className="text-black font-chakra font-black text-2xl animate-bounce">
                📸 SNAPSHOT SAVED!
              </span>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(['neon', 'vintage', 'party', 'rock'] as const).map(f => (
            <button
              key={f}
              onClick={() => {
                soundEffects.playButtonClick();
                setActiveFilter(f);
              }}
              className={`px-3 py-1.5 rounded-xl font-chakra font-bold text-xs uppercase cursor-pointer transition-all ${
                activeFilter === f
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                  : 'bg-[#141828] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {f} Filter
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSnap}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-chakra font-black text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer active:scale-98 transition-all"
        >
          <Camera className="w-5 h-5" />
          <span>TAKE SNAPSHOT</span>
        </button>

      </div>
    </div>
  );
};
