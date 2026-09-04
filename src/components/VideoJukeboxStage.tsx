import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Tv, 
  Film, 
  X,
  PictureInPicture2,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types/rockola';
import { audioEngineService } from '../services/audioEngine';
import { soundEffects } from '../services/soundEffects';

export type VideoStageMode = 'cinema' | 'floating' | 'docked';

interface VideoJukeboxStageProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onToggleMute: () => void;
  onClose?: () => void;
  mode?: VideoStageMode;
  onToggleMode?: (newMode: VideoStageMode) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const VideoJukeboxStage: React.FC<VideoJukeboxStageProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  onTogglePlay,
  onSkipNext,
  onToggleMute,
  onClose,
  mode = 'cinema',
  onToggleMode,
  isMinimized = false,
  onToggleMinimize
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScanlines, setShowScanlines] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Attach video element to audioEngine for unified synchronization
  useEffect(() => {
    if (videoRef.current) {
      audioEngineService.attachVideoElement(videoRef.current);
      videoRef.current.muted = isMuted;
    }
    return () => {
      audioEngineService.attachVideoElement(null);
    };
  }, [isMuted]);

  // Sync video source with currentSong
  useEffect(() => {
    if (!videoRef.current || !currentSong) return;
    const vUrl = currentSong.videoUrl || currentSong.audioUrl;
    if (vUrl && videoRef.current.src !== vUrl) {
      videoRef.current.src = vUrl;
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(e => console.warn('Stage video play warning:', e));
      }
    }
  }, [currentSong]);

  // Sync play/pause with prop
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Time & duration listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || currentSong?.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
      audioEngineService.seek(val);
    }
  };

  const toggleFullscreen = () => {
    soundEffects.playButtonClick();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVideo = currentSong?.mediaType === 'video' || Boolean(currentSong?.videoUrl);

  // Compact Minimized Pill (Floating Mode)
  if (mode === 'floating' && isMinimized) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        id="video-player-minimized-pill"
        className="fixed bottom-5 right-5 z-40 bg-[#0c0d18]/95 border-2 border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.5)] rounded-2xl p-2.5 flex items-center gap-3 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
          <Film className="w-4 h-4 text-purple-300" />
          <div className="text-xs font-chakra font-bold text-white max-w-[150px] sm:max-w-[200px] truncate">
            {currentSong?.code ? `[${currentSong.code}] ` : ''}{currentSong?.title || 'Clip Playing'}
          </div>
          {currentSong?.fileFormat && (
            <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-mono text-[9px] font-bold">
              {currentSong.fileFormat}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 border-l border-white/20 pl-2">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onTogglePlay();
            }}
            className="p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {onToggleMinimize && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleMinimize();
              }}
              className="px-2 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-chakra font-black flex items-center gap-1 cursor-pointer"
              title="Expand Video Player"
            >
              <Maximize2 className="w-3 h-3" />
              <span>EXPAND</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1 rounded-lg bg-black/60 hover:bg-red-500 hover:text-white text-gray-400 cursor-pointer"
              title="Close Video Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id="video-jukebox-stage"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden transition-all select-none ${
        mode === 'floating'
          ? 'fixed bottom-4 right-4 z-40 w-80 sm:w-[400px] md:w-[440px] aspect-video rounded-2xl border-2 border-purple-500/80 bg-[#070913]/95 shadow-[0_0_35px_rgba(168,85,247,0.45)] backdrop-blur-xl'
          : mode === 'docked'
          ? 'w-full aspect-video rounded-2xl border border-cyan-500/30 bg-black shadow-xl'
          : 'w-full max-w-5xl mx-auto aspect-video rounded-2xl border-2 border-purple-500/50 bg-black shadow-[0_0_50px_rgba(0,0,0,0.95)]'
      }`}
    >
      {/* 1. HTML5 Video Player */}
      <video
        ref={videoRef}
        id="html5-jukebox-video-element"
        className="w-full h-full object-contain bg-black"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onSkipNext}
      />

      {/* Retro CRT Scanlines Overlay */}
      {showScanlines && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-35 z-10" />
      )}

      {/* Ambient Neon Backlight Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 rounded-2xl filter blur-xl pointer-events-none -z-10" />

      {/* Top Header Overlay Bar */}
      <div className={`absolute top-0 left-0 right-0 p-2.5 sm:p-3 bg-gradient-to-b from-black/95 via-black/70 to-transparent z-20 flex items-center justify-between transition-opacity duration-200 ${
        isHovered || !isPlaying ? 'opacity-100' : 'opacity-85 sm:opacity-70'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
          <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-chakra font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.7)] shrink-0">
            <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{mode === 'floating' ? 'CLIP PLAYER' : 'HD VIDEO STAGE'}</span>
          </span>

          {currentSong?.code && (
            <span className="px-1.5 py-0.5 rounded bg-black/80 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-[10px] sm:text-xs shrink-0">
              {currentSong.code}
            </span>
          )}

          {currentSong?.fileFormat && (
            <span className="px-1.5 py-0.5 rounded bg-purple-900/90 border border-purple-400/60 text-purple-200 font-mono font-bold text-[10px] sm:text-xs shrink-0">
              {currentSong.fileFormat}
            </span>
          )}

          <div className="text-white font-chakra font-black text-xs sm:text-sm truncate drop-shadow">
            {currentSong?.title || 'Video Clip'}{' '}
            <span className="text-gray-400 font-normal hidden sm:inline">by {currentSong?.artist || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mode Switch: Cinema <-> Floating */}
          {onToggleMode && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleMode(mode === 'cinema' ? 'floating' : 'cinema');
              }}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-400/30 transition-all cursor-pointer"
              title={mode === 'cinema' ? 'Pop out to Floating Window' : 'Expand to Cinema Theater'}
            >
              {mode === 'cinema' ? <PictureInPicture2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Minimize Button (Floating mode) */}
          {mode === 'floating' && onToggleMinimize && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleMinimize();
              }}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-cyan-500 hover:text-black text-gray-300 border border-white/10 transition-all cursor-pointer"
              title="Minimize Video Player"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Scanline Toggle */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setShowScanlines(s => !s);
            }}
            className={`p-1.5 rounded-lg border text-[10px] font-chakra font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showScanlines 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CRT</span>
          </button>

          {/* HTML5 Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-cyan-500 hover:text-black text-gray-300 border border-white/10 transition-all cursor-pointer"
            title="Native Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500 hover:text-white text-gray-300 border border-white/10 transition-all cursor-pointer"
              title="Close Video Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 flex flex-col gap-1.5 transition-opacity duration-200 ${
        isHovered || !isPlaying ? 'opacity-100' : 'opacity-85 sm:opacity-75'
      }`}>
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] font-chakra text-cyan-400 font-mono w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-cyan-400"
          />
          <span className="text-[10px] sm:text-[11px] font-chakra text-gray-400 font-mono w-9">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onTogglePlay();
              }}
              className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-chakra font-black text-xs flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.6)]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            {/* Skip Next */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onSkipNext();
              }}
              className="px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-white/20 font-chakra font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NEXT</span>
            </button>

            {/* Mute */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleMute();
              }}
              className="p-1 rounded-lg bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-white/20 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>

          {/* Media Info Pill */}
          <div className="flex items-center gap-1.5 text-[10px] font-chakra text-gray-300">
            <span className="px-1.5 py-0.5 rounded bg-black/80 border border-white/10">
              {currentSong?.album || 'Rockola Video'}
            </span>
            <span className="text-purple-400 font-bold hidden sm:inline">
              HD CLIP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
