import React, { useState, useRef, useMemo } from 'react';
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
  Search,
  Download,
  Edit3,
  Play,
  Pause,
  ListMusic,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  Sliders,
  Database,
  Info,
  Tag,
  ChevronRight,
  ExternalLink,
  Flame,
  Clock,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, MediaType, MediaSourceFilter } from '../types/rockola';
import { 
  createSongFromFile, 
  localMusicScannerService,
  SUPPORTED_AUDIO_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
  ALL_SUPPORTED_MEDIA_EXTENSIONS,
  detectFormatBadge
} from '../services/localMusicScanner';
import { soundEffects } from '../services/soundEffects';
import { generateTrackCode } from '../utils/storage';
import { getSongCoverArt } from '../utils/coverArtUtils';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs: Song[];
  customSongs: Song[];
  onImportSongs: (newSongs: Song[]) => void;
  onUpdateSong?: (updatedSong: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onBatchDeleteSongs?: (songIds: string[]) => void;
  onClearCustomSongs: () => void;
  onPlaySong?: (song: Song) => void;
  onQueueSong?: (song: Song) => void;
  onOpenVideoStage?: (mode?: 'cinema' | 'floating') => void;
}

type FileFilterCategory = 'all' | 'audio' | 'video' | 'custom' | 'factory';
type SortField = 'code' | 'title' | 'artist' | 'format' | 'duration' | 'plays';

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  allSongs,
  customSongs,
  onImportSongs,
  onUpdateSong,
  onDeleteSong,
  onBatchDeleteSongs,
  onClearCustomSongs,
  onPlaySong,
  onQueueSong,
  onOpenVideoStage
}) => {
  const [filterCategory, setFilterCategory] = useState<FileFilterCategory>('all');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Inspector & Tag Editor Drawer State
  const [inspectedSong, setInspectedSong] = useState<Song | null>(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Song>>({});

  // Direct Stream Modal tab inside file manager
  const [isStreamTabOpen, setIsStreamTabOpen] = useState(false);
  const [streamType, setStreamType] = useState<MediaType>('video');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamArtist, setStreamArtist] = useState('');
  const [streamGenre, setStreamGenre] = useState('Music Videos');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Metrics & Counters
  const totalCount = allSongs.length;
  const audioCount = allSongs.filter(s => s.mediaType !== 'video' && !s.videoUrl).length;
  const videoCount = allSongs.filter(s => s.mediaType === 'video' || Boolean(s.videoUrl)).length;
  const customCount = customSongs.length;
  const factoryCount = totalCount - customCount;

  // Formats present in library
  const availableFormats = useMemo(() => {
    const fmts = new Set<string>();
    allSongs.forEach(s => {
      if (s.fileFormat) {
        fmts.add(s.fileFormat.toUpperCase());
      } else if (s.videoUrl) {
        fmts.add(detectFormatBadge(s.videoUrl));
      } else if (s.audioUrl) {
        fmts.add(detectFormatBadge(s.audioUrl));
      } else {
        fmts.add('MP3');
      }
    });
    return Array.from(fmts).sort();
  }, [allSongs]);

  // Estimated media storage footprint (calculating ~4.5MB per audio track, ~35MB per video clip)
  const estimatedStorageMb = useMemo(() => {
    const audioMb = audioCount * 4.8;
    const videoMb = videoCount * 38.5;
    return (audioMb + videoMb).toFixed(1);
  }, [audioCount, videoCount]);

  // Filtered and sorted songs
  const displayedSongs = useMemo(() => {
    return allSongs.filter(song => {
      const isVideo = song.mediaType === 'video' || Boolean(song.videoUrl);
      const isCustom = song.isCustom || song.mediaSource === 'local-file' || song.mediaSource === 'local-folder' || song.mediaSource === 'stream-url';

      // Category filter
      if (filterCategory === 'audio' && isVideo) return false;
      if (filterCategory === 'video' && !isVideo) return false;
      if (filterCategory === 'custom' && !isCustom) return false;
      if (filterCategory === 'factory' && isCustom) return false;

      // Format filter
      if (formatFilter !== 'ALL') {
        const fmt = (song.fileFormat || (isVideo ? 'MP4' : 'MP3')).toUpperCase();
        if (fmt !== formatFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = song.title.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q);
        const matchCode = song.code.toLowerCase().includes(q);
        const matchAlbum = song.album.toLowerCase().includes(q);
        const matchGenre = song.genre.toLowerCase().includes(q);
        const matchFormat = (song.fileFormat || '').toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchCode && !matchAlbum && !matchGenre && !matchFormat) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let result = 0;
      switch (sortField) {
        case 'code':
          result = a.code.localeCompare(b.code, undefined, { numeric: true });
          break;
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
        case 'artist':
          result = a.artist.localeCompare(b.artist);
          break;
        case 'format':
          result = (a.fileFormat || '').localeCompare(b.fileFormat || '');
          break;
        case 'duration':
          result = a.duration - b.duration;
          break;
        case 'plays':
          result = (a.playCount || 0) - (b.playCount || 0);
          break;
      }
      return sortAsc ? result : -result;
    });
  }, [allSongs, filterCategory, formatFilter, searchQuery, sortField, sortAsc]);

  // Handle Multi-Select
  const toggleSelectAll = () => {
    soundEffects.playButtonClick();
    if (selectedIds.size === displayedSongs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedSongs.map(s => s.id)));
    }
  };

  const toggleSelectSong = (id: string) => {
    soundEffects.playButtonClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Import files handler
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
    showNotify(`Imported ${imported.length} media file(s) into jukebox library!`, 'success');
  };

  // Scan folder handler
  const handleScanFolder = async () => {
    soundEffects.playButtonClick();
    setIsScanning(true);
    showNotify('Scanning local folder & USB storage for media...', 'info');

    try {
      const res = await localMusicScannerService.pickAndScanDirectory(allSongs);
      if (res.importedTracks.length > 0) {
        onImportSongs(res.importedTracks);
        showNotify(`Scan complete: Imported ${res.importedTracks.length} files from "${res.directoryPath}"`, 'success');
      } else {
        showNotify(`Scan complete (${res.scannedFilesCount} files inspected). No new tracks found.`, 'info');
      }
    } catch (err: any) {
      showNotify(`Folder scan error: ${err.message || 'Access denied'}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Add direct stream URL
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
      album: 'Online Stream',
      genre: streamGenre,
      duration: streamType === 'video' ? 240 : 180,
      audioUrl: streamUrl.trim(),
      videoUrl: streamType === 'video' ? streamUrl.trim() : undefined,
      mediaType: streamType,
      mediaSource: 'stream-url',
      fileFormat: streamType === 'video' ? 'MP4' : 'MP3',
      isCustom: true,
      playCount: 0
    };

    onImportSongs([newSong]);
    setStreamUrl('');
    setStreamTitle('');
    setStreamArtist('');
    setIsStreamTabOpen(false);
    showNotify(`Added online stream [${trackCode}] ${newSong.title}`, 'success');
  };

  // Export M3U Playlist File
  const handleExportM3U = () => {
    soundEffects.playButtonClick();
    const songsToExport = selectedIds.size > 0 
      ? allSongs.filter(s => selectedIds.has(s.id))
      : displayedSongs;

    if (songsToExport.length === 0) {
      showNotify('No files to export', 'error');
      return;
    }

    let m3uContent = '#EXTM3U\n#PLAYLIST: Rockola Jukebox Media Export\n\n';
    songsToExport.forEach(s => {
      m3uContent += `#EXTINF:${s.duration},${s.artist} - ${s.title}\n`;
      m3uContent += `${s.videoUrl || s.audioUrl}\n\n`;
    });

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rockola_playlist_${Date.now()}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotify(`Exported ${songsToExport.length} tracks to .M3U playlist!`, 'success');
  };

  // Export JSON Library Manifest
  const handleExportJSON = () => {
    soundEffects.playButtonClick();
    const songsToExport = selectedIds.size > 0 
      ? allSongs.filter(s => selectedIds.has(s.id))
      : allSongs;

    const manifest = {
      app: 'Rockola Pro Digital Jukebox',
      version: '2026.4',
      exportedAt: new Date().toISOString(),
      totalTracks: songsToExport.length,
      tracks: songsToExport
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rockola_library_manifest_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotify(`Exported JSON manifest with ${songsToExport.length} files`, 'success');
  };

  // Tag Editor Open
  const handleOpenTagEditor = (song: Song) => {
    soundEffects.playButtonClick();
    setInspectedSong(song);
    setEditFormData({
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      code: song.code,
      year: song.year,
      mediaType: song.mediaType || 'audio',
      fileFormat: song.fileFormat || (song.mediaType === 'video' ? 'MP4' : 'MP3'),
      coverArt: song.coverArt || ''
    });
    setIsEditingTags(true);
  };

  // Tag Editor Save
  const handleSaveTagEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedSong || !onUpdateSong) return;

    soundEffects.playCoinDrop();
    const updated: Song = {
      ...inspectedSong,
      title: editFormData.title || inspectedSong.title,
      artist: editFormData.artist || inspectedSong.artist,
      album: editFormData.album || inspectedSong.album,
      genre: editFormData.genre || inspectedSong.genre,
      code: (editFormData.code || inspectedSong.code).toUpperCase().trim(),
      year: editFormData.year ? Number(editFormData.year) : inspectedSong.year,
      mediaType: editFormData.mediaType || inspectedSong.mediaType,
      fileFormat: editFormData.fileFormat || inspectedSong.fileFormat,
      coverArt: editFormData.coverArt?.trim() || inspectedSong.coverArt
    };

    onUpdateSong(updated);
    setInspectedSong(updated);
    setIsEditingTags(false);
    showNotify(`Updated tags for [${updated.code}] ${updated.title}`, 'success');
  };

  // Batch delete selected custom files
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    soundEffects.playButtonClick();

    const idsToDelete = Array.from(selectedIds).filter(id => {
      const song = allSongs.find(s => s.id === id);
      return song?.isCustom || song?.mediaSource === 'local-file' || song?.mediaSource === 'local-folder' || song?.mediaSource === 'stream-url';
    });

    if (idsToDelete.length === 0) {
      showNotify('Factory songs are protected and cannot be deleted.', 'error');
      return;
    }

    if (confirm(`Remove ${idsToDelete.length} custom file(s) from the jukebox library?`)) {
      if (onBatchDeleteSongs) {
        onBatchDeleteSongs(idsToDelete);
      } else if (onDeleteSong) {
        idsToDelete.forEach(id => onDeleteSong(id));
      }
      setSelectedIds(new Set());
      showNotify(`Deleted ${idsToDelete.length} custom file(s)`, 'success');
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {/* Drag & Drop Full Overlay Banner */}
      {isDragging && (
        <div className="absolute inset-0 z-60 bg-cyan-950/80 border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none gap-3">
          <Upload className="w-16 h-16 text-cyan-400 animate-bounce" />
          <div className="text-2xl font-chakra font-black text-white">
            DROP MEDIA FILES TO IMPORT TO JUKEBOX
          </div>
          <div className="text-sm font-mono text-cyan-300">
            MP3, MP4, AVI, WMV, MPG, MKV, FLAC, WAV, AAC, OGG
          </div>
        </div>
      )}

      {/* Main File Manager Window */}
      <div 
        id="jukebox-file-manager-window"
        className="bg-[#0b0e1b] border-2 border-cyan-500/60 rounded-2xl max-w-6xl w-full h-[92vh] flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.4)] overflow-hidden"
      >
        
        {/* 1. Header Bar with Storage Meter */}
        <div className="p-3 sm:p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/70 via-[#0a0d18] to-purple-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-chakra font-black text-base sm:text-xl text-white tracking-wide flex items-center gap-2">
                  <span>JUKEBOX FILES MANAGER</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-600 text-white font-bold font-mono">
                    AUDIO & VIDEO REPOSITORY
                  </span>
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 font-sans flex items-center gap-2 mt-0.5">
                <span>Manage files, inspect video clips & audio codecs, edit tags, import local tracks</span>
                <span className="text-cyan-400 hidden sm:inline">•</span>
                <span className="text-cyan-300 font-mono hidden sm:inline">Storage: ~{estimatedStorageMb} MB</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Close Button */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 border border-white/10 transition-all cursor-pointer"
              title="Close File Manager"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-2 text-xs font-chakra font-bold flex items-center justify-between border-b ${
                notification.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                  : notification.type === 'error'
                  ? 'bg-red-950/90 text-red-300 border-red-500/40'
                  : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
              }`}
            >
              <span>{notification.text}</span>
              <button 
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Operations Toolbar */}
        <div className="p-2.5 sm:p-3 bg-black/60 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
          
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Import Files Native Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all"
              title="Load MP3, MP4, AVI, WMV, MPG, WAV, FLAC from disk or USB"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD FILES</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,video/*,.avi,.wmv,.asf,.mpg,.mpeg,.mpe,.mpv,.m2v,.mp4,.m4v,.webm,.mkv,.mov,.qt,.flv,.vob,.ogv,.3gp,.ts,.mts,.m2ts,.divx,.xvid,.mp3,.wma,.wav,.m4a,.flac,.ogg,.oga,.aac,.opus,.aiff,.aif,.alac,.ape,.mid,.midi,.ac3"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Scan Folder Button */}
            <button
              onClick={handleScanFolder}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-lg bg-[#151928] hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 font-chakra font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Select a directory or USB folder to scan all media files"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{isScanning ? 'SCANNING...' : 'SCAN FOLDER / USB'}</span>
            </button>

            {/* Add Stream Button */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setIsStreamTabOpen(o => !o);
              }}
              className={`px-3 py-1.5 rounded-lg border font-chakra font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                isStreamTabOpen
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-[#151928] hover:bg-white/10 text-gray-300 border-white/10'
              }`}
              title="Add an online video or audio stream URL"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>ADD STREAM URL</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Export M3U Playlist */}
            <button
              onClick={handleExportM3U}
              className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-chakra font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Export displayed or selected songs to standard M3U playlist file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT .M3U</span>
            </button>

            {/* Export JSON Library Manifest */}
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-chakra font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Download library JSON backup"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON BACKUP</span>
            </button>

            {/* Batch Delete (if items selected) */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 text-xs font-chakra font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Delete selected custom tracks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Inline Stream Form Drawer (if opened) */}
        <AnimatePresence>
          {isStreamTabOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddStream}
              className="p-3 bg-[#0f1324] border-b border-purple-500/40 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-chakra font-black text-purple-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>ADD ONLINE MEDIA STREAM OR REMOTE FILE</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStreamType('video')}
                    className={`px-2 py-1 rounded text-[11px] font-chakra font-bold cursor-pointer ${
                      streamType === 'video' ? 'bg-purple-600 text-white' : 'bg-black/50 text-gray-400'
                    }`}
                  >
                    Video Clip (MP4/WebM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreamType('audio')}
                    className={`px-2 py-1 rounded text-[11px] font-chakra font-bold cursor-pointer ${
                      streamType === 'audio' ? 'bg-cyan-500 text-black' : 'bg-black/50 text-gray-400'
                    }`}
                  >
                    Audio Stream (MP3/OGG)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://example.com/video.mp4"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Song or Video Title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Artist / Band"
                    value={streamArtist}
                    onChange={(e) => setStreamArtist(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs cursor-pointer shrink-0"
                  >
                    ADD TO REPOSITORY
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 4. Filter & Search Controls Strip */}
        <div className="p-2.5 bg-[#0e1122] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setFilterCategory('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-bold cursor-pointer whitespace-nowrap transition-all ${
                filterCategory === 'all'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-gray-400 hover:text-white bg-black/40'
              }`}
            >
              ALL FILES ({totalCount})
            </button>

            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setFilterCategory('audio');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-all ${
                filterCategory === 'audio'
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                  : 'text-gray-400 hover:text-white bg-black/40'
              }`}
            >
              <Music className="w-3 h-3 text-cyan-400" />
              <span>AUDIO ({audioCount})</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setFilterCategory('video');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-all ${
                filterCategory === 'video'
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'text-gray-400 hover:text-white bg-black/40'
              }`}
            >
              <Film className="w-3 h-3 text-purple-300" />
              <span>VIDEO CLIPS ({videoCount})</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setFilterCategory('custom');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-all ${
                filterCategory === 'custom'
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'text-gray-400 hover:text-white bg-black/40'
              }`}
            >
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>LOCAL IMPORTED ({customCount})</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setFilterCategory('factory');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-bold cursor-pointer whitespace-nowrap transition-all ${
                filterCategory === 'factory'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white bg-black/40'
              }`}
            >
              FACTORY DISK ({factoryCount})
            </button>
          </div>

          {/* Search Box & Sort Selection */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[240px] justify-end">
            {/* Live Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search file, artist, title, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-6 py-1 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-chakra focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Format Filter Dropdown */}
            <select
              value={formatFilter}
              onChange={(e) => {
                soundEffects.playButtonClick();
                setFormatFilter(e.target.value);
              }}
              aria-label="Filter media by format"
              className="px-2 py-1 rounded-lg bg-black/70 border border-white/15 text-cyan-300 font-chakra text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Formats</option>
              {availableFormats.map(fmt => (
                <option key={fmt} value={fmt}>{fmt}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortField}
              onChange={(e) => {
                soundEffects.playButtonClick();
                setSortField(e.target.value as SortField);
              }}
              aria-label="Sort media files"
              className="px-2 py-1 rounded-lg bg-black/70 border border-white/15 text-gray-300 font-chakra text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="code">Sort by Track Code</option>
              <option value="title">Sort by Title</option>
              <option value="artist">Sort by Artist</option>
              <option value="format">Sort by Format</option>
              <option value="duration">Sort by Duration</option>
              <option value="plays">Sort by Popularity</option>
            </select>

            {/* Sort Asc/Desc toggle */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                setSortAsc(a => !a);
              }}
              className="p-1 rounded-lg bg-black/70 hover:bg-white/10 text-gray-300 border border-white/15 cursor-pointer"
              title={sortAsc ? 'Ascending Order' : 'Descending Order'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Main Content: Files List / Explorer Table */}
        <div className="flex-1 overflow-y-auto flex">
          
          {/* Main Files Table */}
          <div className="flex-1 overflow-y-auto">
            {displayedSongs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-gray-400">
                <FolderOpen className="w-12 h-12 text-cyan-500/40" />
                <div className="font-chakra font-black text-white text-base">
                  NO MATCHING MEDIA FILES FOUND
                </div>
                <p className="text-xs max-w-md">
                  Try adjusting your search query or format filter, or import new media files from your local drive or USB storage.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-chakra font-black text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                >
                  SELECT MEDIA FILES TO LOAD
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-300 font-sans border-collapse">
                <thead className="sticky top-0 z-10 bg-[#090c17] border-b border-white/15 font-chakra text-[11px] font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="cursor-pointer text-gray-400 hover:text-white"
                        title="Select All"
                      >
                        {selectedIds.size === displayedSongs.length && displayedSongs.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-2.5 w-16">CODE</th>
                    <th className="p-2.5 w-16 text-center">TYPE</th>
                    <th className="p-2.5">FILE & TRACK TITLE</th>
                    <th className="p-2.5 hidden md:table-cell">ARTIST</th>
                    <th className="p-2.5 hidden lg:table-cell">ALBUM / GENRE</th>
                    <th className="p-2.5 w-20 text-center">LENGTH</th>
                    <th className="p-2.5 w-24 hidden sm:table-cell text-center">SOURCE</th>
                    <th className="p-2.5 w-36 text-right pr-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {displayedSongs.map((song) => {
                    const isSelected = selectedIds.has(song.id);
                    const isVideo = song.mediaType === 'video' || Boolean(song.videoUrl);
                    const format = (song.fileFormat || (isVideo ? 'MP4' : 'MP3')).toUpperCase();
                    const isInspected = inspectedSong?.id === song.id;

                    return (
                      <tr
                        key={song.id}
                        onClick={() => setInspectedSong(song)}
                        className={`transition-colors cursor-pointer group ${
                          isInspected
                            ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400'
                            : isSelected
                            ? 'bg-purple-950/30'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Checkbox */}
                        <td 
                          className="p-2.5 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectSong(song.id);
                          }}
                        >
                          <button className="cursor-pointer text-gray-400 hover:text-white">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Track Code */}
                        <td className="p-2.5 font-mono font-bold text-cyan-300 whitespace-nowrap">
                          [{song.code}]
                        </td>

                        {/* Format / Type Badge */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold inline-flex items-center gap-1 ${
                            isVideo
                              ? 'bg-purple-900/90 text-purple-200 border border-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                              : 'bg-cyan-900/60 text-cyan-200 border border-cyan-400/40'
                          }`}>
                            {isVideo ? <Film className="w-2.5 h-2.5 text-purple-300" /> : <Music className="w-2.5 h-2.5 text-cyan-300" />}
                            <span>{format}</span>
                          </span>
                        </td>

                        {/* Title & Cover thumbnail */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-black border border-white/10 shrink-0 overflow-hidden relative">
                              {song.coverArt ? (
                                <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                              ) : isVideo ? (
                                <div className="w-full h-full bg-purple-950 flex items-center justify-center">
                                  <Film className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-cyan-950 flex items-center justify-center">
                                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-chakra font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                                {song.title}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate md:hidden">
                                {song.artist}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Artist */}
                        <td className="p-2.5 font-chakra text-gray-300 hidden md:table-cell truncate max-w-[150px]">
                          {song.artist}
                        </td>

                        {/* Album / Genre */}
                        <td className="p-2.5 text-gray-400 hidden lg:table-cell truncate max-w-[160px]">
                          <span className="text-gray-300">{song.album}</span>
                          {song.genre && (
                            <span className="text-gray-500 text-[11px] block font-chakra uppercase">
                              {song.genre}
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="p-2.5 text-center font-mono text-gray-400 whitespace-nowrap">
                          {formatDuration(song.duration)}
                        </td>

                        {/* Media Source Badge */}
                        <td className="p-2.5 text-center hidden sm:table-cell whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-chakra uppercase ${
                            song.mediaSource === 'local-file' || song.mediaSource === 'local-folder'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : song.mediaSource === 'stream-url'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                              : 'bg-black/60 text-gray-400 border border-white/10'
                          }`}>
                            {song.mediaSource === 'local-file' ? 'Local File' : song.mediaSource === 'local-folder' ? 'USB/Dir' : song.mediaSource === 'stream-url' ? 'Web Stream' : 'Factory'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td 
                          className="p-2.5 text-right pr-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {/* Play Track / Video */}
                            <button
                              onClick={() => {
                                soundEffects.playButtonClick();
                                if (onPlaySong) {
                                  onPlaySong(song);
                                }
                                if (isVideo && onOpenVideoStage) {
                                  onOpenVideoStage('floating');
                                }
                              }}
                              className={`p-1.5 rounded-lg text-white cursor-pointer transition-all ${
                                isVideo 
                                  ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                              }`}
                              title={isVideo ? 'Play Video Clip' : 'Play Audio Track'}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>

                            {/* Queue Track */}
                            {onQueueSong && (
                              <button
                                onClick={() => {
                                  soundEffects.playButtonClick();
                                  onQueueSong(song);
                                }}
                                className="p-1.5 rounded-lg bg-[#141828] hover:bg-white/10 text-gray-300 hover:text-white border border-white/15 cursor-pointer"
                                title="Add to Jukebox Queue"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tag Editor */}
                            <button
                              onClick={() => handleOpenTagEditor(song)}
                              className="p-1.5 rounded-lg bg-[#141828] hover:bg-white/10 text-gray-300 hover:text-cyan-300 border border-white/15 cursor-pointer"
                              title="Edit Tags and Properties"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (if custom) */}
                            {(song.isCustom || song.mediaSource === 'local-file' || song.mediaSource === 'local-folder' || song.mediaSource === 'stream-url') && onDeleteSong && (
                              <button
                                onClick={() => {
                                  soundEffects.playButtonClick();
                                  if (confirm(`Delete custom file "${song.title}" from library?`)) {
                                    onDeleteSong(song.id);
                                    showNotify(`Removed file ${song.title}`, 'info');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500 text-gray-400 hover:text-white border border-white/10 cursor-pointer"
                                title="Delete from Library"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Inspector & Tag Editor Pane */}
          {inspectedSong && (
            <div className="w-80 sm:w-88 border-l border-white/10 bg-[#0a0d18] flex flex-col shrink-0 overflow-y-auto">
              {/* Inspector Header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="font-chakra font-black text-xs text-white uppercase">
                    FILE INSPECTOR & METADATA
                  </span>
                </div>
                <button
                  onClick={() => setInspectedSong(null)}
                  className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tag Editor Mode */}
              {isEditingTags ? (
                <form onSubmit={handleSaveTagEditor} className="p-4 flex flex-col gap-3">
                  <div className="text-xs font-chakra font-black text-cyan-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>EDIT TRACK METADATA TAGS</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-chakra font-bold text-gray-400">TRACK CODE</label>
                    <input
                      type="text"
                      value={editFormData.code || ''}
                      onChange={(e) => setEditFormData(f => ({ ...f, code: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-cyan-300 font-mono text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-chakra font-bold text-gray-400">TRACK TITLE *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData(f => ({ ...f, title: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white font-chakra text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-chakra font-bold text-gray-400">ARTIST</label>
                    <input
                      type="text"
                      value={editFormData.artist || ''}
                      onChange={(e) => setEditFormData(f => ({ ...f, artist: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white font-chakra text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-chakra font-bold text-gray-400">ALBUM</label>
                    <input
                      type="text"
                      value={editFormData.album || ''}
                      onChange={(e) => setEditFormData(f => ({ ...f, album: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-chakra font-bold text-gray-400">GENRE</label>
                      <input
                        type="text"
                        value={editFormData.genre || ''}
                        onChange={(e) => setEditFormData(f => ({ ...f, genre: e.target.value }))}
                        className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs focus:border-cyan-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-chakra font-bold text-gray-400">MEDIA TYPE</label>
                      <select
                        value={editFormData.mediaType || 'audio'}
                        onChange={(e) => setEditFormData(f => ({ ...f, mediaType: e.target.value as MediaType }))}
                        aria-label="Select track media type"
                        className="px-2 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs focus:border-cyan-400"
                      >
                        <option value="audio">Audio Track</option>
                        <option value="video">Video Clip</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-chakra font-bold text-gray-400">FORMAT / CODEC BADGE</label>
                    <input
                      type="text"
                      placeholder="MP3, MP4, AVI, WMV, FLAC, WAV..."
                      value={editFormData.fileFormat || ''}
                      onChange={(e) => setEditFormData(f => ({ ...f, fileFormat: e.target.value.toUpperCase() }))}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white font-mono text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    >
                      SAVE TAGS
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTags(false)}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-chakra cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              ) : (
                /* Inspector View Mode */
                <div className="p-4 flex flex-col gap-4">
                  {/* Big Album / Video Preview Card */}
                  <div className="w-full aspect-video rounded-xl bg-black border border-white/15 overflow-hidden relative shadow-lg flex items-center justify-center">
                    {inspectedSong.coverArt ? (
                      <img src={inspectedSong.coverArt} alt="" className="w-full h-full object-cover" />
                    ) : inspectedSong.mediaType === 'video' || Boolean(inspectedSong.videoUrl) ? (
                      <div className="flex flex-col items-center gap-2 text-purple-400">
                        <Film className="w-10 h-10" />
                        <span className="font-chakra font-bold text-xs">HD VIDEO CLIP</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-cyan-400">
                        <Music className="w-10 h-10" />
                        <span className="font-chakra font-bold text-xs">AUDIO STREAM / FILE</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs">
                      [{inspectedSong.code}]
                    </span>
                  </div>

                  {/* Title & Artist */}
                  <div>
                    <h3 className="font-chakra font-black text-white text-base leading-tight">
                      {inspectedSong.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-chakra mt-0.5">
                      by <span className="text-gray-200">{inspectedSong.artist}</span>
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundEffects.playButtonClick();
                        if (onPlaySong) onPlaySong(inspectedSong);
                        if ((inspectedSong.mediaType === 'video' || inspectedSong.videoUrl) && onOpenVideoStage) {
                          onOpenVideoStage('floating');
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-chakra font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>PLAY NOW</span>
                    </button>

                    {onQueueSong && (
                      <button
                        onClick={() => {
                          soundEffects.playButtonClick();
                          onQueueSong(inspectedSong);
                        }}
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenTagEditor(inspectedSong)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 cursor-pointer"
                      title="Edit metadata"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Metadata Key-Value List */}
                  <div className="flex flex-col gap-2 bg-black/50 p-3 rounded-xl border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Media Type:</span>
                      <span className="font-chakra font-bold text-white uppercase">
                        {inspectedSong.mediaType || 'audio'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Codec / Format:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {inspectedSong.fileFormat || (inspectedSong.mediaType === 'video' ? 'MP4' : 'MP3')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="font-mono text-gray-200">
                        {formatDuration(inspectedSong.duration)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Album:</span>
                      <span className="text-gray-200 truncate max-w-[150px]">
                        {inspectedSong.album}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Genre:</span>
                      <span className="text-gray-200">
                        {inspectedSong.genre}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Source:</span>
                      <span className="font-mono text-xs text-purple-300">
                        {inspectedSong.mediaSource || 'Factory'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Play Count:</span>
                      <span className="font-chakra font-bold text-amber-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>{inspectedSong.playCount || 0} plays</span>
                      </span>
                    </div>

                    {inspectedSong.audioUrl && (
                      <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px]">Source Path / URL:</span>
                        <div className="font-mono text-[10px] text-gray-400 truncate bg-black/80 p-1 rounded">
                          {inspectedSong.audioUrl}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Footer Status Bar */}
        <div className="p-2.5 sm:p-3 bg-black/80 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-gray-400 shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-white font-chakra font-bold">
              Showing {displayedSongs.length} of {totalCount} files
            </span>
            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-chakra font-bold text-[11px]">
                {selectedIds.size} file(s) selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="px-5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-chakra font-black text-xs cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            >
              DONE [ESC]
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
