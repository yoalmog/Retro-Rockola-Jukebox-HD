import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_40px_rgba(0,0,0,0.9)] text-gray-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10 hover:border-amber-400 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500 text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white tracking-wide">
              USER &amp; HARDWARE GUIDE
            </h3>
            <p className="text-xs text-gray-400 font-chakra">
              5-Button Navigation &amp; Coin Mechanism Reference
            </p>
          </div>
        </div>

        {/* 5-Button Overview Cards */}
        <div className="space-y-2.5 my-4 text-xs font-chakra">
          
          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 flex items-start gap-3">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="px-2 py-1 rounded bg-[#1C1C1C] text-amber-400 font-mono font-bold border border-white/10 text-center">
                ↑ / ↓
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Up &amp; Down</h4>
              <p className="text-gray-400">Navigate tracks vertically through the song list.</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 flex items-start gap-3">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="px-2 py-1 rounded bg-[#1C1C1C] text-amber-400 font-mono font-bold border border-white/10 text-center">
                ← / →
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Left &amp; Right</h4>
              <p className="text-gray-400">Switch genres, albums, and category filters.</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 flex items-start gap-3">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="px-2 py-1 rounded bg-amber-500 text-black font-mono font-bold text-center">
                ENTER / OK
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Select (5th Button)</h4>
              <p className="text-gray-400">Queue the currently highlighted track into playback.</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 flex items-start gap-3">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="px-2 py-1 rounded bg-[#1C1C1C] text-amber-400 font-mono font-bold border border-white/10 text-center">
                5 / C
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Coin Drop</h4>
              <p className="text-gray-400">Accepts coins or bills to grant song credits.</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 flex items-start gap-3">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="px-2 py-1 rounded bg-[#1C1C1C] text-gray-300 font-mono font-bold border border-white/10 text-center">
                F2 / TAB
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Service Menu</h4>
              <p className="text-gray-400">Access technician settings, coin pricing, hardware diagnostics, and audio configuration.</p>
            </div>
          </div>

        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-sm shadow-md transition-all cursor-pointer mt-2"
        >
          Close Guide
        </button>

      </div>
    </div>
  );
};
