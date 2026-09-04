import React, { useState, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Upload, 
  Film, 
  Music, 
  Globe, 
  HardDrive, 
  Disc, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  X,
  FileVideo,
  FileAudio,
  Radio,
  Layers,
  Search
} from 'lucide-react';
import { Song, MediaSourceFilter, MediaType } from '../types/rockola';
import { 
  localMusicScannerService, 
  createSongFromFile, 
  SUPPORTED_AUDIO_EXTENSIONS, 
  SUPPORTED_VIDEO_EXTENSIONS 
} from '../services/localMusicScanner';
import { soundEffects } from '../services/soundEffects';
import { generateTrackCode } from '../utils/storage';

interface MediaSourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: MediaSourceFilter;
  onSelectFilter: (filter: MediaSourceFilter) => void;
  allSongs: Song[];
  customSongs: Song[];
  onImportSongs: (newSongs: Song[]) => void;
  onClearCustomSongs: () => void;
  onOpenVideoStage?: () => void;
}

export const MediaSourceSelectorModal: React.FC<MediaSourceSelectorModalProps> = ({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
  allSongs,
  customSongs,
  onImportSongs,
  onClearCustomSongs,
  onOpenVideoStage
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'import-files' | 'scan-folder' | 'add-stream'>('sources');
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Direct Stream URL form state
  const [streamType, setStreamType] = useState<MediaType>('video');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamArtist, setStreamArtist] = useState('');
  const [streamGenre, setStreamGenre] = useState('Music Videos');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Counts
  const totalCount = allSongs.length;
  const audioCount = allSongs.filter(s => s.mediaType !== 'video' && !s.videoUrl).length;
  const videoCount = allSongs.filter(s => s.mediaType === 'video' || Boolean(s.videoUrl)).length;
  const localCount = allSongs.filter(s => s.mediaSource === 'local-file' || s.mediaSource === 'local-folder' || s.isCustom).length;
  const streamCount = allSongs.filter(s => s.mediaSource === 'stream-url').length;
  const factoryCount = allSongs.filter(s => !s.isCustom && s.mediaSource !== 'local-file' && s.mediaSource !== 'local-folder').length;

  // Handle files selected or dropped
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    soundEffects.playCoinDrop();

    const imported: Song[] = [];
    const currentTotal = allSongs.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const song = createSongFromFile(file, currentTotal + i);
      imported.push(song);
    }

    onImportSongs(imported);
    setScanMessage(`🎉 Successfully imported ${imported.length} media file(s)!`);
    setTimeout(() => setScanMessage(null), 4000);
  };

  // Handle directory scan
  const handleScanDirectory = async () => {
    soundEffects.playButtonClick();
    setIsScanning(true);
    setScanMessage('Scanning storage directory for audio and video media files...');

    try {
      const result = await localMusicScannerService.pickAndScanDirectory(allSongs);
      if (result.importedTracks.length > 0) {
        onImportSongs(result.importedTracks);
        setScanMessage(`🎉 Scan complete! Imported ${result.importedTracks.length} new tracks from "${result.directoryPath}".`);
      } else {
        setScanMessage(`Directory scan complete (${result.scannedFilesCount} files inspected). No new tracks found.`);
      }
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message || 'Failed to access directory'}`);
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  // Handle adding direct stream URL
  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    soundEffects.playCoinDrop();
    const trackCode = generateTrackCode(allSongs.length);
    const newSong: Song = {
      id: `stream-${Date.now()}`,
      code: trackCode,
      title: streamTitle.trim() || (streamType === 'video' ? 'Web Video Stream' : 'Web Audio Stream'),
      artist: streamArtist.trim() || 'Online Stream',
      album: 'Web Media Stream',
      genre: streamGenre,
      duration: streamType === 'video' ? 240 : 180,
      audioUrl: streamUrl.trim(),
      videoUrl: streamType === 'video' ? streamUrl.trim() : undefined,
      mediaType: streamType,
      mediaSource: 'stream-url',
      isCustom: true,
      playCount: 0
    };

    onImportSongs([newSong]);
    setStreamUrl('');
    setStreamTitle('');
    setStreamArtist('');
    setScanMessage(`✨ Added stream [${trackCode}] ${newSong.title} to jukebox!`);
    setTimeout(() => setScanMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0b0e1a] border-2 border-cyan-500/50 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-[#0b0e1a] to-purple-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-chakra font-black text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <span>MEDIA SOURCE & FORMAT SELECTOR</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500 text-black font-bold">
                  AUDIO & VIDEO
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Choose active media source, import local music & videos, or configure streaming URLs
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 border border-white/10 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-black/50 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('sources');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-chakra font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sources'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>SELECT SOURCE FILTER</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('import-files');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-chakra font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import-files'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>IMPORT LOCAL FILES</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('scan-folder');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-chakra font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scan-folder'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>SCAN LOCAL FOLDER</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('add-stream');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-chakra font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add-stream'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>ADD STREAM URL</span>
          </button>
        </div>

        {/* Scan / Status Alert Notification */}
        {scanMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-chakra text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 animate-spin" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          
          {/* TAB 1: SOURCE FILTER SELECTOR */}
          {activeTab === 'sources' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-300">
                Choose which media types and source directories are displayed in the 3D Carousel, Dual-Deck and Catalog:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* All Media */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('all');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'all'
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Layers className="w-5 h-5" />
                    </span>
                    {activeFilter === 'all' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">ALL MEDIA</h3>
                    <p className="text-[11px] text-gray-400">Both Music & High-Def Videos</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {totalCount} Total Items
                  </div>
                </button>

                {/* Music Only */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('audio');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'audio'
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <Music className="w-5 h-5" />
                    </span>
                    {activeFilter === 'audio' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">MUSIC ONLY</h3>
                    <p className="text-[11px] text-gray-400">MP3, WAV, FLAC, WMA, AAC, M4A, OGG</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {audioCount} Audio Tracks
                  </div>
                </button>

                {/* Videos Only */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('video');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'video'
                      ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <Film className="w-5 h-5" />
                    </span>
                    {activeFilter === 'video' && <Check className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">VIDEOS ONLY</h3>
                    <p className="text-[11px] text-gray-400">AVI, WMV, MPG, MP4, WebM, MKV, MOV</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-400">
                    {videoCount} Video Tracks
                  </div>
                </button>

                {/* Local Storage Only */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('local');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'local'
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <HardDrive className="w-5 h-5" />
                    </span>
                    {activeFilter === 'local' && <Check className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">LOCAL DISK & USB</h3>
                    <p className="text-[11px] text-gray-400">Files Imported from Computer</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {localCount} Local Files
                  </div>
                </button>

                {/* Web Streams Only */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('stream');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'stream'
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Globe className="w-5 h-5" />
                    </span>
                    {activeFilter === 'stream' && <Check className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">ONLINE STREAMS</h3>
                    <p className="text-[11px] text-gray-400">Web Audio & Video URLs</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {streamCount} Stream URLs
                  </div>
                </button>

                {/* Built-in Factory Library */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onSelectFilter('factory');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    activeFilter === 'factory'
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Disc className="w-5 h-5" />
                    </span>
                    {activeFilter === 'factory' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-sm text-white">FACTORY CATALOG</h3>
                    <p className="text-[11px] text-gray-400">Original Built-in Jukebox Hits</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {factoryCount} Factory Songs
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
                <div className="text-xs text-gray-400">
                  Currently active filter: <strong className="text-cyan-400 uppercase font-chakra">{activeFilter}</strong>
                </div>

                {customSongs.length > 0 && (
                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      if (confirm('Clear all imported local media tracks?')) {
                        onClearCustomSongs();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-chakra font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>CLEAR CUSTOM MEDIA ({customSongs.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT LOCAL MEDIA FILES */}
          {activeTab === 'import-files' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-300">
                Drag and drop or select any audio or video files from your device, computer storage, or USB drive:
              </div>

              {/* Supported Format Grid Badges */}
              <div className="flex flex-col gap-2 bg-black/50 p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-chakra font-black text-purple-400 uppercase mr-1">🎬 Video Types:</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/60 text-purple-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(168,85,247,0.3)]">.AVI</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/60 text-purple-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(168,85,247,0.3)]">.WMV</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/60 text-purple-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(168,85,247,0.3)]">.MPG / .MPEG</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/60 text-purple-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(168,85,247,0.3)]">.MP4 / .M4V</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.MKV</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.MOV</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.WebM</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.FLV</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.VOB</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[11px]">.TS</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-chakra font-black text-cyan-400 uppercase mr-1">🎵 Audio Types:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/70 border border-blue-500/60 text-blue-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(59,130,246,0.3)]">.MP3</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/70 border border-blue-500/60 text-blue-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(59,130,246,0.3)]">.WAV</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/70 border border-blue-500/60 text-blue-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(59,130,246,0.3)]">.WMA</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/70 border border-blue-500/60 text-blue-200 font-mono font-bold text-xs shadow-[0_0_8px_rgba(59,130,246,0.3)]">.FLAC</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300 font-mono text-[11px]">.M4A</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300 font-mono text-[11px]">.AAC</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300 font-mono text-[11px]">.OGG</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300 font-mono text-[11px]">.OPUS</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300 font-mono text-[11px]">.AIFF</span>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/20 scale-[1.01]'
                    : 'border-cyan-500/40 bg-black/40 hover:border-cyan-400 hover:bg-cyan-500/5'
                }`}
              >
                <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-chakra font-black text-white text-base">
                    Click to browse or drop your media files here
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Directly load AVI, WMV, MPG, MP3, MP4, MKV, WAV, FLAC from local disk or USB
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*,video/*,.avi,.wmv,.asf,.mpg,.mpeg,.mpe,.mpv,.m2v,.mp4,.m4v,.webm,.mkv,.mov,.qt,.flv,.vob,.ogv,.3gp,.ts,.mts,.m2ts,.divx,.xvid,.mp3,.wma,.wav,.m4a,.flac,.ogg,.oga,.aac,.opus,.aiff,.aif,.alac,.ape,.mid,.midi,.ac3"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                >
                  SELECT MEDIA FILES (AUDIO & VIDEO)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SCAN LOCAL FOLDER */}
          {activeTab === 'scan-folder' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-300">
                Pick a folder on your Ubuntu Linux computer or local filesystem (e.g. <code>~/Music</code>, <code>~/Videos</code>, or USB mount point). The jukebox will automatically discover all audio and video files and generate vintage select codes for them:
              </div>

              <div className="p-5 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-chakra font-black text-white text-sm">
                      Directory Scanner & Background Poller
                    </h3>
                    <p className="text-xs text-gray-400">
                      Scans subfolders, parses track and artist names, and adds them to your playable collection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScanDirectory}
                    disabled={isScanning}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-chakra font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-50"
                  >
                    <Folder className="w-4 h-4" />
                    <span>{isScanning ? 'SCANNING DIRECTORY...' : 'BROWSE & SCAN MEDIA FOLDER'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADD STREAM URL */}
          {activeTab === 'add-stream' && (
            <form onSubmit={handleAddStream} className="flex flex-col gap-4">
              <div className="text-xs text-gray-300">
                Add an online music or video stream URL (.mp4, .webm, .mp3, .ogg) to the jukebox:
              </div>

              {/* Media Type Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setStreamType('video');
                  }}
                  className={`px-4 py-2 rounded-xl font-chakra font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                    streamType === 'video'
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <FileVideo className="w-4 h-4 text-purple-400" />
                  <span>MUSIC VIDEO STREAM (MP4/WebM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setStreamType('audio');
                  }}
                  className={`px-4 py-2 rounded-xl font-chakra font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                    streamType === 'audio'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  <span>AUDIO STREAM (MP3/OGG)</span>
                </button>
              </div>

              {/* URL Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-chakra font-bold text-gray-300">STREAM OR VIDEO URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/media/music-video.mp4"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-chakra font-bold text-gray-300">TITLE</label>
                  <input
                    type="text"
                    placeholder="Song / Video Title"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-chakra font-bold text-gray-300">ARTIST</label>
                  <input
                    type="text"
                    placeholder="Artist / Band"
                    value={streamArtist}
                    onChange={(e) => setStreamArtist(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              >
                <Plus className="w-4 h-4" />
                <span>ADD STREAM TO CATALOG</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Catalog: {totalCount} total ({audioCount} audio, {videoCount} video)</span>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-chakra font-bold text-xs cursor-pointer"
          >
            DONE
          </button>
        </div>

      </div>
    </div>
  );
};
