import React, { useState, useEffect } from 'react';
import { Song, QueueItem, RockolaConfig } from '../types/rockola';
import { QrCode, Smartphone, Volume2, VolumeX, Play, Pause, SkipForward, Plus, Music, Coins, Check, X, Radio } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface MobileRemoteOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: RockolaConfig;
  currentSong: Song | null;
  isPlaying: boolean;
  queue: QueueItem[];
  allSongs: Song[];
  onQueueSong: (song: Song) => void;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSetVolume: (vol: number) => void;
  onInsertCoin: (count: number) => void;
}

export const MobileRemoteOverlay: React.FC<MobileRemoteOverlayProps> = ({
  isOpen,
  onClose,
  config,
  currentSong,
  isPlaying,
  queue,
  allSongs,
  onQueueSong,
  onTogglePlay,
  onSkipNext,
  onSetVolume,
  onInsertCoin
}) => {
  const [activeRemoteTab, setActiveRemoteTab] = useState<'qr' | 'remote'>('remote');
  const [searchFilter, setSearchFilter] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(config.volume * 100);

  useEffect(() => {
    setVolumeLevel(config.volume * 100);
  }, [config.volume]);

  if (!isOpen) return null;

  const filteredSongs = allSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.code.toLowerCase().includes(searchFilter.toLowerCase())
  ).slice(0, 8);

  const localRemoteUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}?remote=1` 
    : 'https://rockola247.app/remote';

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0D0F18] border-2 border-cyan-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-black p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-chakra font-black text-white text-base uppercase tracking-wider flex items-center gap-2">
                <span>MOBILE REMOTE 24/7</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  LIVE SYNC
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-chakra">
                Control queue, playback &amp; volume from your mobile device
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-black/40">
          <button
            onClick={() => setActiveRemoteTab('remote')}
            className={`flex-1 py-2.5 text-xs font-chakra font-black uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeRemoteTab === 'remote'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Mobile Keypad</span>
          </button>
          <button
            onClick={() => setActiveRemoteTab('qr')}
            className={`flex-1 py-2.5 text-xs font-chakra font-black uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeRemoteTab === 'qr'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {activeRemoteTab === 'qr' ? (
            <div className="flex flex-col items-center justify-center text-center py-6 space-y-4 font-chakra">
              <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-cyan-400/50">
                {/* Simulated High Density QR Code SVG */}
                <svg className="w-44 h-44" viewBox="0 0 100 100">
                  <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" fill="#000" />
                  <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" fill="#000" />
                  <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" fill="#000" />
                  <rect x="35" y="5" width="10" height="10" fill="#000" />
                  <rect x="50" y="15" width="15" height="10" fill="#000" />
                  <rect x="35" y="35" width="30" height="30" fill="#000" />
                  <rect x="75" y="45" width="20" height="15" fill="#000" />
                  <rect x="45" y="75" width="25" height="20" fill="#000" />
                  <rect x="75" y="75" width="20" height="20" fill="#000" />
                </svg>
              </div>

              <div>
                <p className="text-white font-bold text-sm">SCAN WITH SMARTPHONE CAMERA</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Scan to open the mobile controller interface on any connected phone or tablet.
                </p>
              </div>

              <div className="bg-black/60 px-3 py-2 rounded-xl border border-white/10 font-mono text-xs text-cyan-300 break-all max-w-xs">
                {localRemoteUrl}
              </div>
            </div>
          ) : (
            <div className="space-y-4 font-chakra">
              
              {/* Now Playing Mini Widget */}
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-white/10 shrink-0">
                    <img
                      src={currentSong?.albumArtUrl || currentSong?.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{currentSong?.title || 'Standby Mode'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{currentSong?.artist || 'Select a track to start'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      onTogglePlay();
                    }}
                    className="p-2 rounded-xl bg-cyan-500 text-black font-bold active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      onSkipNext();
                    }}
                    className="p-2 rounded-xl bg-white/10 text-white active:scale-95 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Master Volume Slider */}
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Master Remote Volume</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{Math.round(volumeLevel)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumeLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVolumeLevel(val);
                    onSetVolume(val / 100);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
                />
              </div>

              {/* Add Coins Button */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Credits: {config.freePlay ? 'FREE PLAY' : config.credits}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">Insert credit to play songs</p>
                </div>
                <button
                  onClick={() => {
                    soundEffects.playCoinDrop();
                    onInsertCoin(1);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  + Add Credit
                </button>
              </div>

              {/* Song Search & Queue Selector */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Quick Song Queue</p>
                <input
                  type="text"
                  placeholder="Search songs or enter code (e.g. A01)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-chakra"
                />

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                          {song.code}
                        </span>
                        <div className="truncate">
                          <p className="text-xs text-white font-bold truncate">{song.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          soundEffects.playButtonClick();
                          onQueueSong(song);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-bold text-[11px] border border-cyan-500/30 transition-all cursor-pointer shrink-0"
                      >
                        + Queue
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 text-center text-[11px] text-gray-400 font-chakra">
          ROCKOLA 24/7 NETWORK REMOTE CONTROLLER
        </div>

      </div>
    </div>
  );
};
