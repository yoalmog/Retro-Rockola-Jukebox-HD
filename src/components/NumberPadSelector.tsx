import React, { useState, useEffect } from 'react';
import { Song } from '../types/rockola';
import { Hash, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface NumberPadSelectorProps {
  songs: Song[];
  onQueueSong: (song: Song) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const NumberPadSelector: React.FC<NumberPadSelectorProps> = ({
  songs,
  onQueueSong,
  onClose,
  isOpen
}) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [selectedLetterIdx, setSelectedLetterIdx] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [focusColumn, setFocusColumn] = useState<'letter' | 'number'>('letter');

  const currentLetter = letters[selectedLetterIdx] || 'A';
  const currentCode = `${currentLetter}${selectedNumber < 10 ? '0' + selectedNumber : selectedNumber}`;

  const matchedSong = songs.find(s => s.code === currentCode);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        soundEffects.playButtonClick();
        setFocusColumn('letter');
      } else if (e.key === 'ArrowRight') {
        soundEffects.playButtonClick();
        setFocusColumn('number');
      } else if (e.key === 'ArrowUp') {
        soundEffects.playButtonClick();
        if (focusColumn === 'letter') {
          setSelectedLetterIdx(prev => (prev - 1 + letters.length) % letters.length);
        } else {
          setSelectedNumber(prev => Math.max(1, prev - 1));
        }
      } else if (e.key === 'ArrowDown') {
        soundEffects.playButtonClick();
        if (focusColumn === 'letter') {
          setSelectedLetterIdx(prev => (prev + 1) % letters.length);
        } else {
          setSelectedNumber(prev => Math.min(20, prev + 1));
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (matchedSong) {
          soundEffects.playSongSelect();
          onQueueSong(matchedSong);
          onClose();
        } else {
          soundEffects.playErrorBuzzer();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusColumn, selectedLetterIdx, selectedNumber, matchedSong]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.9)] text-center relative">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-lg md:text-xl text-white tracking-wide">
            DIAL TRACK CODE
          </h2>
        </div>

        {/* Vintage 2-Drum Selector */}
        <div className="flex items-center justify-center gap-6 my-6">
          
          {/* Drum 1: Letter Dial */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSelectedLetterIdx(p => (p - 1 + letters.length) % letters.length)}
              className="p-2 text-gray-400 hover:text-amber-400 cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className={`w-20 h-24 rounded-xl flex items-center justify-center font-mono text-4xl font-bold border transition-all ${
              focusColumn === 'letter'
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-[#0A0A0A] text-amber-400 border-white/10'
            }`}>
              {currentLetter}
            </div>
            <button
              onClick={() => setSelectedLetterIdx(p => (p + 1) % letters.length)}
              className="p-2 text-gray-400 hover:text-amber-400 cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-400 font-chakra mt-1">Letter (Left)</span>
          </div>

          <div className="text-3xl font-mono font-bold text-gray-600">-</div>

          {/* Drum 2: Number Dial */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSelectedNumber(p => Math.max(1, p - 1))}
              className="p-2 text-gray-400 hover:text-amber-400 cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className={`w-20 h-24 rounded-xl flex items-center justify-center font-mono text-4xl font-bold border transition-all ${
              focusColumn === 'number'
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-[#0A0A0A] text-amber-400 border-white/10'
            }`}>
              {selectedNumber < 10 ? '0' + selectedNumber : selectedNumber}
            </div>
            <button
              onClick={() => setSelectedNumber(p => Math.min(20, p + 1))}
              className="p-2 text-gray-400 hover:text-amber-400 cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-400 font-chakra mt-1">Number (Right)</span>
          </div>

        </div>

        {/* Live Song Preview Card */}
        <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 mb-5 min-h-[76px] flex items-center justify-center">
          {matchedSong ? (
            <div className="flex items-center gap-3 w-full text-left">
              <img
                src={matchedSong.coverArt}
                alt={matchedSong.title}
                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{matchedSong.title}</h4>
                <p className="text-xs text-gray-400 truncate">{matchedSong.artist}</p>
                <span className="text-[10px] text-amber-400 font-mono">✓ Ready to queue</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-chakra">
              No track registered for code {currentCode} - change letter or number
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-gray-300 border border-white/10 font-chakra font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!matchedSong}
            onClick={() => {
              if (matchedSong) {
                soundEffects.playSongSelect();
                onQueueSong(matchedSong);
                onClose();
              }
            }}
            className={`flex-1 py-2.5 rounded-xl font-chakra font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
              matchedSong
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer'
                : 'bg-[#1C1C1C] text-gray-600 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>SELECT (OK)</span>
          </button>
        </div>

        {/* 5-Button instruction footer */}
        <p className="text-[11px] text-gray-500 font-chakra mt-3">
          5-Button Navigation: [← →] Switch column | [↑ ↓] Adjust value | [ENTER] Confirm
        </p>

      </div>
    </div>
  );
};
