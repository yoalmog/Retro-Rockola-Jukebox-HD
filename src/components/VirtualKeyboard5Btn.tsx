import React, { useState, useEffect } from 'react';
import { Search, Delete, CornerDownLeft, X } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface VirtualKeyboard5BtnProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  isOpen: boolean;
  initialQuery?: string;
}

export const VirtualKeyboard5Btn: React.FC<VirtualKeyboard5BtnProps> = ({
  onSearch,
  onClose,
  isOpen,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);

  // Keyboard layout grid (7 columns x 5 rows)
  const keyGrid = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
    ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z', '0', '1'],
    ['2', '3', '4', 'SPACE', 'DEL', 'OK', 'CLEAR']
  ];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        soundEffects.playButtonClick();
        setCurrentRow(prev => (prev - 1 + keyGrid.length) % keyGrid.length);
      } else if (e.key === 'ArrowDown') {
        soundEffects.playButtonClick();
        setCurrentRow(prev => (prev + 1) % keyGrid.length);
      } else if (e.key === 'ArrowLeft') {
        soundEffects.playButtonClick();
        const maxCol = keyGrid[currentRow].length;
        setCurrentCol(prev => (prev - 1 + maxCol) % maxCol);
      } else if (e.key === 'ArrowRight') {
        soundEffects.playButtonClick();
        const maxCol = keyGrid[currentRow].length;
        setCurrentCol(prev => (prev + 1) % maxCol);
      } else if (e.key === 'Enter' || e.key === ' ') {
        soundEffects.playButtonClick();
        const currentKey = keyGrid[currentRow]?.[currentCol] || '';
        handleKeyPress(currentKey);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentRow, currentCol, query]);

  const handleKeyPress = (key: string) => {
    if (key === 'SPACE') {
      setQuery(prev => prev + ' ');
    } else if (key === 'DEL') {
      setQuery(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setQuery('');
    } else if (key === 'OK') {
      onSearch(query);
      onClose();
    } else {
      setQuery(prev => prev + key);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.9)] text-center relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-white tracking-wide">
              5-BUTTON HARDWARE SEARCH
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10 hover:border-amber-400 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Query Screen */}
        <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 mb-4 shadow-inner flex items-center justify-between">
          <span className="font-mono text-xl md:text-2xl text-amber-400 font-bold tracking-wider truncate">
            {query || <span className="text-gray-600 text-sm font-chakra">Navigate keys using directional buttons...</span>}
          </span>
          <span className="w-2.5 h-6 bg-amber-500 animate-pulse"></span>
        </div>

        {/* 5-Button Matrix Key Grid */}
        <div className="flex flex-col gap-2 my-3">
          {keyGrid.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-1.5">
              {row.map((k, cIdx) => {
                const isSelected = currentRow === rIdx && currentCol === cIdx;
                const isActionKey = ['SPACE', 'DEL', 'OK', 'CLEAR'].includes(k);

                return (
                  <button
                    key={k}
                    onClick={() => {
                      setCurrentRow(rIdx);
                      setCurrentCol(cIdx);
                      handleKeyPress(k);
                    }}
                    className={`h-11 rounded-lg font-mono font-bold text-sm transition-all duration-100 flex items-center justify-center cursor-pointer ${
                      isActionKey ? 'flex-1 px-2 text-xs' : 'w-11'
                    } ${
                      isSelected
                        ? 'bg-amber-500 text-black border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                        : isActionKey
                        ? 'bg-[#1C1C1C] text-amber-400 border border-white/10 hover:bg-[#252525]'
                        : 'bg-[#1C1C1C] text-gray-200 border border-white/5 hover:border-amber-500/50'
                    }`}
                  >
                    {k === 'DEL' ? <Delete className="w-4 h-4" /> : k === 'OK' ? <CornerDownLeft className="w-4 h-4" /> : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Navigation Tip */}
        <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 font-chakra">
          <span>Navigation: Arrow Keys [↑ ↓ ← →]</span>
          <span>Select: [OK / ENTER]</span>
        </div>

      </div>
    </div>
  );
};
