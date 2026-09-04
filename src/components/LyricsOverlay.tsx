import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Song, SkinType } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';
import { X, Mic, Music, Play, Copy, Check, Sparkles, Sliders } from 'lucide-react';

interface LyricsOverlayProps {
  song: Song | null;
  currentTime: number;
  duration: number;
  isOpen: boolean;
  onClose: () => void;
  onSeek?: (seconds: number) => void;
  skin?: SkinType;
}

interface LyricLine {
  id: number;
  time: number; // in seconds
  text: string;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({
  song,
  currentTime,
  duration,
  isOpen,
  onClose,
  onSeek,
  skin = 'touchtunes-digital'
}) => {
  const theme = getTheme(skin);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Parse lyrics into timed lines
  const lyricLines: LyricLine[] = useMemo(() => {
    if (!song || !song.lyrics) return [];

    let rawLines: string[] = [];
    if (Array.isArray(song.lyrics)) {
      rawLines = song.lyrics;
    } else if (typeof song.lyrics === 'string') {
      rawLines = song.lyrics.split('\n').map(l => l.trim()).filter(Boolean);
    }

    if (rawLines.length === 0) return [];

    // Check if lines have LRC timestamps [mm:ss.xx] or [mm:ss]
    const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
    const hasLrc = rawLines.some(line => lrcRegex.test(line));

    if (hasLrc) {
      const parsed: LyricLine[] = [];
      rawLines.forEach((line, idx) => {
        const match = line.match(lrcRegex);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
          const time = mins * 60 + secs + ms / 1000;
          const text = match[4].trim();
          if (text) {
            parsed.push({ id: idx, time, text });
          }
        } else {
          parsed.push({ id: idx, time: (idx / rawLines.length) * (duration || 180), text: line });
        }
      });
      return parsed.sort((a, b) => a.time - b.time);
    } else {
      // Distribute lines evenly across duration
      const totalDur = duration > 0 ? duration : 180;
      // Start lyrics slightly after intro (e.g. 3% into track)
      const startOffset = totalDur * 0.02;
      const endOffset = totalDur * 0.95;
      const usableDur = endOffset - startOffset;
      const interval = usableDur / Math.max(1, rawLines.length);

      return rawLines.map((line, idx) => ({
        id: idx,
        time: startOffset + idx * interval,
        text: line
      }));
    }
  }, [song, duration]);

  // Find currently active line index
  const activeIndex = useMemo(() => {
    if (lyricLines.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (currentTime >= lyricLines[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyricLines, currentTime]);

  // Auto scroll to active line
  useEffect(() => {
    if (autoScroll && activeLineRef.current && isOpen) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, autoScroll, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!song || !song.lyrics) return;
    const textToCopy = Array.isArray(song.lyrics) ? song.lyrics.join('\n') : song.lyrics;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0b0e1a] border border-cyan-500/40 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden relative">
        
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 bg-[#101426] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-chakra font-black text-sm sm:text-base text-white truncate">
                  LIVE LYRICS &amp; SYNC OVERLAY
                </h3>
                {song?.code && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                    [{song.code}]
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-chakra truncate">
                {song ? `${song.title} — ${song.artist}` : 'No track selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                autoScroll
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-black/50 text-gray-400 border-white/10'
              }`}
              title="Toggle Auto-scroll sync"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{autoScroll ? 'AUTO-SCROLL ON' : 'MANUAL SCROLL'}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!song?.lyrics}
              className="p-2 rounded-lg bg-black/50 hover:bg-white/10 text-gray-300 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Copy Lyrics to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-black border border-red-500/40 transition-all cursor-pointer"
              title="Close Lyrics Overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle Scrollable Lyrics Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30 font-chakra select-none"
        >
          {lyricLines.length > 0 ? (
            lyricLines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek && onSeek(line.time)}
                  className={`group rounded-xl p-3 sm:p-4 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 border ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/90 via-blue-950/80 to-transparent border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : isPast
                      ? 'bg-[#080b14] border-white/5 text-gray-400 hover:text-white hover:bg-[#0d1222]'
                      : 'bg-[#060810] border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#0a0f20]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-xs font-mono font-bold shrink-0 w-12 ${
                      isActive ? 'text-cyan-300' : 'text-gray-600'
                    }`}>
                      {formatTime(line.time)}
                    </span>

                    <span className={`text-base sm:text-xl font-bold leading-relaxed transition-colors ${
                      isActive
                        ? 'text-white font-black drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]'
                        : isPast
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}>
                      {line.text}
                    </span>
                  </div>

                  {/* Click to Seek Hint */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono px-2 py-0.5 rounded border ${
                    isActive
                      ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                      : 'bg-black/60 text-cyan-300 border-cyan-500/30'
                  }`}>
                    JUMP HERE
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3">
              <Music className="w-12 h-12 text-cyan-500/30 animate-bounce" />
              <div>
                <p className="font-bold text-white text-base">No lyrics available for this track</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  You can add or edit lyrics for custom songs in the Service Menu or import LRC lyric files.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Track Controls & Progress Status */}
        <div className="p-4 border-t border-white/10 bg-[#080b18] flex items-center justify-between shrink-0 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="text-[11px] text-gray-400">
            Click any line to jump audio • Auto-scroll synchronized with Web Audio
          </div>
        </div>

      </div>
    </div>
  );
};
