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
  Sparkles, 
  Film, 
  ExternalLink,
  X,
  Sliders,
  Disc
} from 'lucide-react';
import { Song } from '../types/rockola';
import { audioEngineService } from '../services/audioEngine';
import { soundEffects } from '../services/soundEffects';

interface VideoJukeboxStageProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onToggleMute: () => void;
  onClose?: () => void;
  isDocked?: boolean;
}

export const VideoJukeboxStage: React.FC<VideoJukeboxStageProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  onTogglePlay,
  onSkipNext,
  onToggleMute,
  onClose,
  isDocked = false
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

  return (
    <div 
      ref={containerRef}
      id="video-jukebox-stage"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black shadow-[0_0_40px_rgba(0,0,0,0.9)] transition-all ${
        isDocked 
          ? 'w-full aspect-video' 
          : 'w-full max-w-4xl mx-auto aspect-video'
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
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 z-10" />
      )}

      {/* Ambient Neon Backlight Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl filter blur-xl pointer-events-none -z-10" />

      {/* Top Header Overlay Bar */}
      <div className={`absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${
        isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 sm:opacity-75'
      }`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-purple-600/90 text-white font-chakra font-black text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.7)]">
            <Film className="w-3.5 h-3.5" />
            <span>HD VIDEO JUKEBOX</span>
          </span>

          {currentSong?.code && (
            <span className="px-2 py-0.5 rounded bg-black/80 border border-cyan-400/40 text-cyan-400 font-chakra font-bold text-xs">
              [{currentSong.code}]
            </span>
          )}

          <div className="text-white font-chakra font-black text-xs sm:text-sm truncate max-w-[200px] sm:max-w-md drop-shadow">
            {currentSong?.title || 'Video Player'} <span className="text-gray-400 font-normal">by {currentSong?.artist || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Scanline Toggle */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setShowScanlines(s => !s);
            }}
            className={`p-1.5 rounded-lg border text-xs font-chakra font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showScanlines 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CRT</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-cyan-500 hover:text-black text-gray-300 border border-white/10 transition-all cursor-pointer"
            title="Cinema Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close / Minimize Button (if not docked) */}
          {onClose && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500 hover:text-white text-gray-300 border border-white/10 transition-all cursor-pointer"
              title="Close Cinema Stage"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-20 flex flex-col gap-2 transition-opacity duration-300 ${
        isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 sm:opacity-85'
      }`}>
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-chakra text-cyan-400 font-mono w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[11px] font-chakra text-gray-400 font-mono w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onTogglePlay();
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            {/* Skip Next */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onSkipNext();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-white/20 font-chakra font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">SKIP</span>
            </button>

            {/* Mute */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleMute();
              }}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-white/20 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>

          {/* Media Info Pill */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-chakra uppercase px-2 py-0.5 rounded bg-black/70 border border-white/10 text-gray-300">
              Source: {currentSong?.mediaSource || 'Factory Direct'}
            </span>
            <span className="text-[10px] font-chakra font-bold text-purple-400 hidden sm:inline">
              1080p Full-Motion Video
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
