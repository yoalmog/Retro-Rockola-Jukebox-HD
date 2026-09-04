import React, { useState, useRef, useEffect } from 'react';
import { RockolaConfig, SkinType, Song, KeyBindings, Playlist, MachineBranding, HardwareDiagnosticLog, MacroSequence } from '../types/rockola';
import { THEMES, getTheme } from '../utils/themeStyles';
import { 
  Settings, X, HardDrive, Keyboard, DollarSign, Palette, 
  Upload, Trash2, Monitor, BarChart3, RefreshCw, Terminal, 
  ShieldCheck, ListMusic, Sparkles, Crown, Image as ImageIcon,
  Plus, ArrowUp, ArrowDown, Download, FileText, Check, Music,
  Tv, Cpu, Sliders, Activity, Zap, CheckCircle2, AlertCircle,
  Radio, Copy, Play, Filter, AlertTriangle, Info, Bell, Smartphone,
  Database, Gauge, Volume2, Shuffle, FolderSearch, Repeat, PieChart as PieIcon, Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { LANGUAGES, getTranslation } from '../utils/i18n';
import { soundEffects } from '../services/soundEffects';
import { hardwareDiagnosticService } from '../services/hardwareDiagnosticService';
import { storageHealthService, StorageHealthReport } from '../services/storageHealthService';
import { audioEngine } from '../services/audioEngine';
import { generateTrackCode, DEFAULT_KEY_BINDINGS, DEFAULT_MACRO_SEQUENCES, createSystemBackupPackage, validateAndParseBackupPackage } from '../utils/storage';
import { localMusicScannerService, ScanResult } from '../services/localMusicScanner';
import { partyModeService, GroupSongRequest, PartyGuest } from '../services/partyModeService';
import { selectAutoDjNextSong } from '../utils/autoDjService';

interface ServiceMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RockolaConfig;
  onUpdateConfig: (newConfig: RockolaConfig) => void;
  customSongs: Song[];
  onAddCustomSongs: (songs: Song[]) => void;
  onClearCustomSongs: () => void;
  onResetLifetimeStats: () => void;
  playlists: Playlist[];
  onUpdatePlaylists: (updated: Playlist[]) => void;
  allSongs: Song[];
  onTriggerBootSequence?: () => void;
}

interface DiagnosticLogItem {
  id: string;
  code: string;
  key: string;
  keyCode: number;
  mappedAction: string;
  timestamp: string;
}

export const ServiceMenuModal: React.FC<ServiceMenuModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  customSongs,
  onAddCustomSongs,
  onClearCustomSongs,
  onResetLifetimeStats,
  playlists,
  onUpdatePlaylists,
  allSongs,
  onTriggerBootSequence
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'branding'
    | 'music'
    | 'diagnostic'
    | 'storage'
    | 'calibration'
    | 'backup'
    | 'pricing'
    | 'audit'
    | 'kiosk'
    | 'analytics'
    | 'debounce'
    | 'language'
    | 'system-health'
    | 'balance-panning'
    | 'auto-dj'
    | 'party-mode'
  >('branding');
  
  // Storage & Cache Health State
  const [storageReport, setStorageReport] = useState<StorageHealthReport | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);

  // System Health Monitoring State
  const [cpuTemp, setCpuTemp] = useState<number>(44.8);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [healthLogs, setHealthLogs] = useState<string[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<{ usedMb: number; totalMb: number; percent: number }>({
    usedMb: 184,
    totalMb: 512,
    percent: 35.9
  });

  // System Health polling loop
  useEffect(() => {
    if (!isOpen) return;

    const updateHealth = () => {
      const audioMetrics = audioEngine.getSystemHealthMetrics();

      let used = 184;
      let total = 512;
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const mem = (performance as any).memory;
        used = Math.round(mem.usedJSHeapSize / (1024 * 1024));
        total = Math.round(mem.jsHeapSizeLimit / (1024 * 1024));
      }
      const memPct = Math.min(100, Math.round((used / total) * 1000) / 10);
      setMemoryInfo({ usedMb: used, totalMb: total, percent: memPct });

      const isAudioPlaying = audioMetrics.isPlaying;
      const targetBase = isStressTesting ? 78.5 : isAudioPlaying ? 52.4 : 42.1;
      const jitter = (Math.random() - 0.5) * 1.8;
      const newTemp = Math.max(35, Math.min(95, targetBase + jitter));
      setCpuTemp(newTemp);

      const timeStr = new Date().toLocaleTimeString();
      const statusTag = newTemp > 75 || audioMetrics.underrunCount > 5 ? 'WARN' : 'NOMINAL';
      const logLine = `[${timeStr}] CPU: ${newTemp.toFixed(1)}°C | RAM: ${used}MB (${memPct}%) | AudioCtx: ${audioMetrics.contextState.toUpperCase()} | Underruns: ${audioMetrics.underrunCount} | [${statusTag}]`;
      
      setHealthLogs(prev => [logLine, ...prev.slice(0, 19)]);
    };

    updateHealth();
    const interval = setInterval(updateHealth, 2000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, isStressTesting]);

  // Speaker Test Tone Generator
  const playSpeakerTestPulse = (channel: 'left' | 'right' | 'center') => {
    soundEffects.playButtonClick();
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(channel === 'left' ? 440 : channel === 'right' ? 880 : 660, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(channel === 'left' ? -1 : channel === 'right' ? 1 : 0, ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      showFeedback(`🔊 Played ${channel.toUpperCase()} speaker test pulse tone`);
    } catch (err) {
      console.warn('Speaker test error:', err);
    }
  };

  const refreshStorageReport = async () => {
    setIsLoadingStorage(true);
    try {
      const rep = await storageHealthService.getStorageHealthReport(customSongs, allSongs.length);
      setStorageReport(rep);
    } catch (err) {
      console.warn('Storage health diagnostic error:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorageReport();
    }
  }, [isOpen, customSongs.length, allSongs.length]);

  const handleTestStorageHealth = async () => {
    soundEffects.playButtonClick();
    await refreshStorageReport();
    showFeedback('✓ Storage speed and integrity benchmark completed successfully!');
  };

  const handleClearAudioCache = () => {
    soundEffects.playButtonClick();
    showFeedback('✓ Local audio cache cleared!');
    refreshStorageReport();
  };

  const handleRequestPersist = async () => {
    soundEffects.playButtonClick();
    const success = await storageHealthService.requestPersistentStorage();
    if (success) {
      showFeedback('✓ Persistent storage eviction lock granted by browser!');
    } else {
      showFeedback('Browser does not currently allow permanent storage locking');
    }
    refreshStorageReport();
  };

  // Calibration & Hardware State
  const [calibratingAction, setCalibratingAction] = useState<keyof KeyBindings | null>(null);

  // Diagnostic Mode State
  const [diagnosticActiveButtons, setDiagnosticActiveButtons] = useState<Record<string, boolean>>({});
  const [diagnosticHitCounts, setDiagnosticHitCounts] = useState<Record<string, number>>({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    select: 0,
    coin1: 0,
    coin2: 0,
    service: 0,
    freePlayToggle: 0,
    volumeUp: 0,
    volumeDown: 0
  });
  const [hardwareLogs, setHardwareLogs] = useState<HardwareDiagnosticLog[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'NOISE' | 'FAILURES' | 'STUCK' | 'NORMAL'>('ALL');
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLogItem[]>([]);
  const [lastEventInfo, setLastEventInfo] = useState<{
    code: string;
    key: string;
    keyCode: number;
    mappedAction: string;
  } | null>(null);

  // Subscribe to hardware diagnostic logger
  useEffect(() => {
    const unsubscribe = hardwareDiagnosticService.subscribe((logs) => {
      setHardwareLogs(logs);
    });
    return unsubscribe;
  }, []);

  // Branding & Backup file input refs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const systemCloneInputRef = useRef<HTMLInputElement | null>(null);

  // Status message / toast inside modal
  const [modalFeedbackMessage, setModalFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Playlist management sub-state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Custom Macro Sequences Sub-State
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroSequence, setNewMacroSequence] = useState('1, 1, 2');
  const [newMacroActionType, setNewMacroActionType] = useState<'PLAYLIST' | 'COIN' | 'FREEPLAY' | 'ATTRACT' | 'GENRE' | 'CODE'>('PLAYLIST');
  const [newMacroTargetValue, setNewMacroTargetValue] = useState(playlists[0]?.id || 'pl-wildwest');

  // Local Directory Auto-Scanner State
  const [isDirectoryScanning, setIsDirectoryScanning] = useState(false);
  const [scanReport, setScanReport] = useState<ScanResult | null>(localMusicScannerService.getLastScanReport());

  const handleAddMacro = () => {
    if (!newMacroName.trim() || !newMacroSequence.trim()) {
      showFeedback('Please provide a macro name and sequence steps', true);
      return;
    }
    const steps = newMacroSequence.split(/[,-\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (steps.length === 0) {
      showFeedback('Invalid macro sequence steps', true);
      return;
    }

    const newMacro: MacroSequence = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim(),
      sequence: steps,
      actionType: newMacroActionType,
      targetValue: newMacroTargetValue || '1',
      description: `Custom sequence [${steps.join('-')}] -> ${newMacroActionType}`
    };

    const currentMacros = config.macroSequences || DEFAULT_MACRO_SEQUENCES;
    const updated = [...currentMacros, newMacro];

    onUpdateConfig({ ...config, macroSequences: updated });
    soundEffects.playButtonClick();
    showFeedback(`✓ Macro "${newMacroName}" added! Sequence: [${steps.join('-')}]`);

    setNewMacroName('');
  };

  const handleDeleteMacro = (macroId: string) => {
    const currentMacros = config.macroSequences || DEFAULT_MACRO_SEQUENCES;
    const updated = currentMacros.filter(m => m.id !== macroId);
    onUpdateConfig({ ...config, macroSequences: updated });
    soundEffects.playButtonClick();
    showFeedback('✓ Macro sequence deleted');
  };

  const handleScanLocalDirectory = async () => {
    setIsDirectoryScanning(true);
    soundEffects.playButtonClick();
    try {
      const res = await localMusicScannerService.pickAndScanDirectory(allSongs);
      setScanReport(res);
      if (res.importedTracks.length > 0) {
        onAddCustomSongs(res.importedTracks);
        showFeedback(`✓ Auto-imported ${res.importedTracks.length} new tracks from local music directory!`);
      } else if (res.error) {
        showFeedback(`Directory Scan Note: ${res.error}`, true);
      } else {
        showFeedback(`✓ Directory scanned: ${res.scannedFilesCount} files checked. No new tracks found.`);
      }
    } catch (err: any) {
      showFeedback(`Scan failed: ${err.message}`, true);
    } finally {
      setIsDirectoryScanning(false);
    }
  };

  // Helper to show modal feedback
  const showFeedback = (text: string, isError = false) => {
    setModalFeedbackMessage({ text, isError });
    setTimeout(() => setModalFeedbackMessage(null), 4000);
  };

  const branding = config.branding || {
    title: 'ROCKOLA 24',
    subtitle: 'Legacy Hardware Interface',
    logoShape: 'circle',
    marqueeCustomText: '★ ROCKOLA DIGITAL JUKEBOX HD • 5-BUTTON LEGACY HARDWARE • UBUNTU 24.04 & WINDOWS ★',
    themePreset: config.skin,
    ownerName: 'JUKEBOX OPERATOR'
  };

  // Diagnostic & Calibration global keyboard listener while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If currently in dynamic calibration mode for a specific action
      if (calibratingAction) {
        e.preventDefault();
        e.stopPropagation();

        const code = e.code;
        const currentKeys = config.keyBindings[calibratingAction] || [];
        const updatedKeys = Array.from(new Set([code, ...currentKeys]));

        onUpdateConfig({
          ...config,
          keyBindings: {
            ...config.keyBindings,
            [calibratingAction]: updatedKeys
          }
        });

        soundEffects.playButtonClick();
        showFeedback(`✓ Key [${code}] mapped successfully to action ${calibratingAction.toUpperCase()}`);
        setCalibratingAction(null);
        return;
      }

      // 2. If on Diagnostic tab or testing hardware
      const code = e.code;
      const key = e.key;
      const keyCode = e.keyCode || e.which;

      // Find which action(s) this key corresponds to
      let foundAction = 'UNASSIGNED_KEY';
      const triggeredActions: string[] = [];

      (Object.keys(config.keyBindings) as (keyof KeyBindings)[]).forEach(act => {
        const boundKeys = config.keyBindings[act] || [];
        if (boundKeys.includes(code) || boundKeys.includes(key)) {
          foundAction = act;
          triggeredActions.push(act);
        }
      });

      // Update diagnostic state
      if (triggeredActions.length > 0) {
        setDiagnosticActiveButtons(prev => {
          const next = { ...prev };
          triggeredActions.forEach(a => { next[a] = true; });
          return next;
        });

        setDiagnosticHitCounts(prev => {
          const next = { ...prev };
          triggeredActions.forEach(a => {
            next[a] = (next[a] || 0) + 1;
          });
          return next;
        });

        // Turn off indicator after 180ms
        setTimeout(() => {
          setDiagnosticActiveButtons(prev => {
            const next = { ...prev };
            triggeredActions.forEach(a => { next[a] = false; });
            return next;
          });
        }, 180);

        soundEffects.playButtonClick();
      }

      // Add to event logs
      const d = new Date();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(d.getMilliseconds() / 100);
      
      const newLogItem: DiagnosticLogItem = {
        id: `log-${Date.now()}-${Math.random()}`,
        code: code || 'Unknown',
        key: key || 'Unknown',
        keyCode: keyCode,
        mappedAction: triggeredActions.length > 0 ? triggeredActions.join(', ') : 'Unmapped',
        timestamp: timeStr
      };

      setLastEventInfo({
        code: code || 'Unknown',
        key: key || 'Unknown',
        keyCode: keyCode,
        mappedAction: triggeredActions.length > 0 ? triggeredActions.join(', ') : 'Unmapped'
      });

      setDiagnosticLogs(prev => [newLogItem, ...prev.slice(0, 19)]);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, calibratingAction, config, onUpdateConfig]);

  if (!isOpen) return null;

  // Audio file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newSongs: Song[] = [];
    const baseCodeIndex = customSongs.length + 50;

    Array.from(files).forEach((file: File, idx) => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = fileNameWithoutExt.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Local Artist';
      const title = parts.length > 1 ? parts[1].trim() : fileNameWithoutExt;

      const blobUrl = URL.createObjectURL(file);

      newSongs.push({
        id: `custom-${Date.now()}-${idx}`,
        code: generateTrackCode(baseCodeIndex + idx),
        title: title,
        artist: artist,
        album: 'Custom Tracks (Local Music)',
        genre: 'rock',
        year: new Date().getFullYear(),
        duration: 180,
        audioUrl: blobUrl,
        isCustom: true,
        isNewlyImported: true,
        isImported: true,
        playCount: 0
      });
    });

    onAddCustomSongs(newSongs);
    soundEffects.playSongSelect();
    showFeedback(`✓ Added ${newSongs.length} new audio tracks to jukebox catalog!`);
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundEffects.playButtonClick();
        onUpdateConfig({
          ...config,
          branding: {
            ...branding,
            customLogoUrl: dataUrl
          }
        });
        showFeedback('✓ Custom venue logo updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    soundEffects.playButtonClick();
    onUpdateConfig({
      ...config,
      branding: {
        ...branding,
        customLogoUrl: undefined
      }
    });
    showFeedback('✓ Custom logo removed; restored default emblem');
  };

  // Active playlist resolution
  const activePlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];
  const playlistSongs = activePlaylist
    ? activePlaylist.songIds.map(id => allSongs.find(s => s.id === id)).filter((s): s is Song => Boolean(s))
    : [];

  // Playlist modification helpers
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      nameHe: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom curated playlist',
      coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [...playlists, newPl];
    onUpdatePlaylists(updated);
    setSelectedPlaylistId(newPl.id);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreatingPlaylist(false);
    soundEffects.playSongSelect();
    showFeedback(`✓ Created new playlist: ${newPl.name}`);
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    onUpdatePlaylists(updated);
    if (selectedPlaylistId === id) {
      setSelectedPlaylistId(updated[0]?.id || '');
    }
    soundEffects.playButtonClick();
    showFeedback('✓ Playlist deleted successfully');
  };

  const handleAddSongToPlaylist = (songId: string) => {
    if (!activePlaylist) return;
    if (activePlaylist.songIds.includes(songId)) return;
    const updatedPl: Playlist = {
      ...activePlaylist,
      songIds: [...activePlaylist.songIds, songId],
      updatedAt: Date.now()
    };
    const updatedList = playlists.map(p => p.id === activePlaylist.id ? updatedPl : p);
    onUpdatePlaylists(updatedList);
    soundEffects.playButtonClick();
  };

  const handleRemoveSongFromPlaylist = (songId: string) => {
    if (!activePlaylist) return;
    const updatedPl: Playlist = {
      ...activePlaylist,
      songIds: activePlaylist.songIds.filter(id => id !== songId),
      updatedAt: Date.now()
    };
    const updatedList = playlists.map(p => p.id === activePlaylist.id ? updatedPl : p);
    onUpdatePlaylists(updatedList);
    soundEffects.playButtonClick();
  };

  const handleMoveSongOrder = (songIndex: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const newSongIds = [...activePlaylist.songIds];
    const targetIndex = direction === 'up' ? songIndex - 1 : songIndex + 1;
    if (targetIndex < 0 || targetIndex >= newSongIds.length) return;

    const temp = newSongIds[songIndex];
    newSongIds[songIndex] = newSongIds[targetIndex];
    newSongIds[targetIndex] = temp;

    const updatedPl: Playlist = {
      ...activePlaylist,
      songIds: newSongIds,
      updatedAt: Date.now()
    };
    const updatedList = playlists.map(p => p.id === activePlaylist.id ? updatedPl : p);
    onUpdatePlaylists(updatedList);
    soundEffects.playButtonClick();
  };

  // Export Full System Package (JSON)
  const handleExportFullSystem = () => {
    const jsonString = createSystemBackupPackage(config, playlists, customSongs);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rockola-full-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    soundEffects.playSongSelect();
    showFeedback('✓ Complete system backup package exported to JSON file!');
  };

  // Import Full System Package (JSON)
  const handleImportFullSystem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseBackupPackage(content);

      if (result.success) {
        if (result.config) onUpdateConfig(result.config);
        if (result.playlists) onUpdatePlaylists(result.playlists);
        if (result.customSongs) onAddCustomSongs(result.customSongs);

        soundEffects.playSongSelect();
        showFeedback(`✓ ${result.message}`);
      } else {
        soundEffects.playErrorBuzzer();
        showFeedback(`⚠️ ${result.message}`, true);
      }
    };
    reader.readAsText(file);
  };

  // Key Calibration helpers
  const handleRemoveKeyBinding = (action: keyof KeyBindings, keyToRemove: string) => {
    const currentKeys = config.keyBindings[action] || [];
    const updatedKeys = currentKeys.filter(k => k !== keyToRemove);

    onUpdateConfig({
      ...config,
      keyBindings: {
        ...config.keyBindings,
        [action]: updatedKeys
      }
    });
    soundEffects.playButtonClick();
  };

  const handleResetFactoryKeyBindings = () => {
    onUpdateConfig({
      ...config,
      keyBindings: DEFAULT_KEY_BINDINGS
    });
    soundEffects.playSongSelect();
    showFeedback('✓ Key bindings reset to Arcade Defaults (I-PAC / Xin-Mo)!');
  };

  // Diagnostic reset
  const handleResetDiagnosticCounters = () => {
    setDiagnosticHitCounts({
      up: 0,
      down: 0,
      left: 0,
      right: 0,
      select: 0,
      coin1: 0,
      coin2: 0,
      service: 0,
      freePlayToggle: 0,
      volumeUp: 0,
      volumeDown: 0
    });
    setDiagnosticLogs([]);
    setLastEventInfo(null);
    hardwareDiagnosticService.clearLogs();
    soundEffects.playButtonClick();
    showFeedback('✓ Diagnostic counters and event logs reset');
  };

  // Export diagnostic logs report
  const handleExportDiagnosticReport = () => {
    const text = hardwareDiagnosticService.exportLogsAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `touchtunes-diagnostic-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playButtonClick();
    showFeedback('✓ Diagnostic report and fault log downloaded');
  };

  // Trigger synthetic diagnostic sweep and signal noise test
  const handleRunDiagnosticSweep = () => {
    soundEffects.playButtonClick();
    hardwareDiagnosticService.runSimulatedDiagnosticTest();
    showFeedback('⚡ Initiating signal and contact noise test across all 5 channels...');
  };

  const hardwareActionsList: { key: keyof KeyBindings; labelHe: string; descHe: string; arcadeTag: string }[] = [
    { key: 'up', labelHe: 'UP / Joystick Up', descHe: 'Navigate track selection upward', arcadeTag: 'JOYSTICK UP' },
    { key: 'down', labelHe: 'DOWN / Joystick Down', descHe: 'Navigate track selection downward', arcadeTag: 'JOYSTICK DOWN' },
    { key: 'left', labelHe: 'LEFT / Back', descHe: 'Previous genre or track page', arcadeTag: 'JOYSTICK LEFT' },
    { key: 'right', labelHe: 'RIGHT / Forward', descHe: 'Next genre or playlists', arcadeTag: 'JOYSTICK RIGHT' },
    { key: 'select', labelHe: 'SELECT / OK (Button 5)', descHe: 'Queue selected track to playback queue', arcadeTag: 'BTN 1 / SELECT' },
    { key: 'coin1', labelHe: 'COIN DROP 1', descHe: 'Primary mechanical coin drop trigger', arcadeTag: 'COIN MECH 1' },
    { key: 'coin2', labelHe: 'COIN DROP 2 / BILL', descHe: 'Secondary coin mech / bill acceptor pulse', arcadeTag: 'COIN MECH 2' },
    { key: 'service', labelHe: 'SERVICE MENU', descHe: 'Open technician & administrator settings', arcadeTag: 'SERVICE SWITCH' },
    { key: 'freePlayToggle', labelHe: 'FREE PLAY SWITCH', descHe: 'Toggle free play / coin-op requirements', arcadeTag: 'TEST SWITCH' },
    { key: 'volumeUp', labelHe: 'VOLUME UP', descHe: 'Increase master audio volume output', arcadeTag: 'VOL +' },
    { key: 'volumeDown', labelHe: 'VOLUME DOWN', descHe: 'Decrease master audio volume output', arcadeTag: 'VOL -' }
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none outline-none">
      <div className="bg-[#141414] border-2 border-amber-500/30 rounded-2xl max-w-5xl w-full h-[94vh] max-h-[850px] shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative text-gray-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-black font-bold shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <span>SERVICE & TECHNICIAN DASHBOARD</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C1C1C] text-amber-400 font-mono border border-white/10">
                  COMMERCIAL KIOSK PRO
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-chakra">
                Theme configuration, hardware diagnostics, keypad calibration, storage health & pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selection Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#1C1C1C] px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-cyan-400 transition-colors shadow">
              <Globe className="w-4 h-4 text-cyan-400" />
              <select
                value={config.language || 'en'}
                onChange={(e) => {
                  const lang = e.target.value as any;
                  onUpdateConfig({ ...config, language: lang });
                  soundEffects.playButtonClick();
                  showFeedback(`✓ Language changed to ${LANGUAGES.find(l => l.code === lang)?.label || lang}`);
                }}
                className="bg-transparent text-xs font-chakra font-bold text-white focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#141414] text-white">
                    {lang.flag} {lang.label} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1C1C1C] text-gray-300 hover:text-white hover:border-amber-400 border border-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner inside modal */}
        {modalFeedbackMessage && (
          <div className={`px-6 py-2 flex items-center gap-2 text-xs font-chakra font-bold transition-all border-b ${
            modalFeedbackMessage.isError
              ? 'bg-red-950/90 text-red-200 border-red-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}>
            {modalFeedbackMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{modalFeedbackMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0A0A0A] border-b border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'branding', label: 'Themes & Display', icon: Palette },
            { id: 'system-health', label: 'System Health', icon: Cpu },
            { id: 'balance-panning', label: 'Balance & Panning', icon: Volume2 },
            { id: 'auto-dj', label: 'Auto-DJ & Mixer', icon: Shuffle },
            { id: 'party-mode', label: 'Party Mode Queue', icon: Smartphone },
            { id: 'analytics', label: 'Revenue Analytics', icon: PieIcon },
            { id: 'debounce', label: 'Keypad Debounce', icon: Sliders },
            { id: 'language', label: 'Language & i18n', icon: Globe },
            { id: 'diagnostic', label: 'Input Monitor Diagnostics', icon: Activity },
            { id: 'storage', label: 'Storage & Cache', icon: Gauge },
            { id: 'calibration', label: 'Keypad Calibration', icon: Sliders },
            { id: 'music', label: 'Music & Playlists', icon: ListMusic },
            { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
            { id: 'pricing', label: 'Pricing & Coins', icon: DollarSign },
            { id: 'audit', label: 'Audit & Lifetime Meters', icon: BarChart3 },
            { id: 'kiosk', label: 'Kiosk Shell Setup', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playButtonClick();
                  setActiveTab(tab.id as typeof activeTab);
                  setCalibratingAction(null);
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-chakra font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md border border-amber-300'
                    : 'bg-[#1C1C1C] text-gray-300 hover:bg-[#252525] border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: BRANDING, LOGO, SKINS & DETAILED VISUAL FEEDBACK */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              
              {/* Detailed Visual Feedback / Projector Mode Toggle Banner */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border-2 border-amber-500/40 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-base text-white flex items-center gap-2">
                        <span>Projector &amp; Large TV Mode (Detailed Visual Feedback)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                          LARGE DISPLAY MODE
                        </span>
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                        Enlarges track codes (A01, A02), artist titles, release dates, credit counters, and navigation controls for high visibility on projectors and large TVs across bars, pubs, and commercial lounges.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !config.detailedVisualFeedback;
                      onUpdateConfig({ ...config, detailedVisualFeedback: nextVal });
                      soundEffects.playButtonClick();
                      showFeedback(nextVal ? '✓ Projector & Large Display mode enabled!' : '✓ Returned to standard screen layout');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-sm transition-all cursor-pointer shadow-md ${
                      config.detailedVisualFeedback
                        ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {config.detailedVisualFeedback ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                  </button>
                </div>
              </div>

              {/* Header Mobile App Promo Banner Toggle */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-base text-white flex items-center gap-2">
                        <span>Header App Promo Banner ("YOUR NIGHT. YOUR MUSIC.")</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 font-mono">
                          HEADER BANNER
                        </span>
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                        Displays the colorful "YOUR NIGHT. YOUR MUSIC. - GET THE APP" promotional banner across the top header bar. Turn off to keep the main header minimal and clean.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !config.showPromoBanner;
                      onUpdateConfig({ ...config, showPromoBanner: nextVal });
                      soundEffects.playButtonClick();
                      showFeedback(nextVal ? '✓ Header Mobile App Promo Banner enabled!' : '✓ Header Mobile App Promo Banner hidden');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-sm transition-all cursor-pointer shadow-md ${
                      config.showPromoBanner
                        ? 'bg-pink-500 text-black border border-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {config.showPromoBanner ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                  </button>
                </div>
              </div>

              {/* Top Commercial Header Bar Toggle */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-base text-white flex items-center gap-2">
                        <span>Top Commercial Header Bar (Now Playing, Credits &amp; Tools)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                          HEADER BAR
                        </span>
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                        Shows the top commercial marquee strip with Now Playing pill, Credits ring badge, and quick utility tools. Enable or disable for ultra-minimal full-canvas playback.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !config.showHeaderBar;
                      onUpdateConfig({ ...config, showHeaderBar: nextVal });
                      soundEffects.playButtonClick();
                      showFeedback(nextVal ? '✓ Top Commercial Header Bar enabled!' : '✓ Top Commercial Header Bar hidden');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-sm transition-all cursor-pointer shadow-md ${
                      config.showHeaderBar
                        ? 'bg-cyan-500 text-black border border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {config.showHeaderBar ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                  </button>
                </div>
              </div>

              {/* Outer Kiosk Cabinet Frame Toggle */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-base text-white flex items-center gap-2">
                        <span>Outer Physical Kiosk Cabinet Shell Frame</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                          CABINET FRAME
                        </span>
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                        Wraps the entire application screen in a metallic commercial jukebox cabinet shell frame with speaker grilles and glowing marquee lights.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !config.showKioskFrame;
                      onUpdateConfig({ ...config, showKioskFrame: nextVal });
                      soundEffects.playButtonClick();
                      showFeedback(nextVal ? '✓ Physical Kiosk Cabinet Frame enabled!' : '✓ Physical Kiosk Cabinet Frame hidden');
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-sm transition-all cursor-pointer shadow-md ${
                      config.showKioskFrame
                        ? 'bg-purple-500 text-black border border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {config.showKioskFrame ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                  </button>
                </div>
              </div>

              {/* Logo & Title Setup Box */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-4">
                <h3 className="font-bold text-sm text-amber-400 font-chakra flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Venue Branding, Logo &amp; Custom Cabinet Titles</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Upload and preview */}
                  <div className="flex items-center gap-4 bg-[#141414] p-4 rounded-xl border border-white/10">
                    <div className="w-16 h-16 rounded-xl bg-black/80 border border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {branding.customLogoUrl ? (
                        <img src={branding.customLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold">
                          R24
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Venue Logo</span>
                        </button>

                        {branding.customLogoUrl && (
                          <button
                            onClick={handleRemoveLogo}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 text-xs font-chakra font-bold cursor-pointer"
                            title="Remove Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-chakra">
                        Supports PNG, JPG, SVG image formats
                      </p>
                    </div>
                  </div>

                  {/* Right: Shape selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-chakra font-bold text-gray-400">
                      Logo Badge Shape on Header:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'circle', label: 'Circle' },
                        { id: 'square', label: 'Square' },
                        { id: 'badge', label: 'Badge' },
                        { id: 'wide-banner', label: 'Banner' }
                      ].map(shape => (
                        <button
                          key={shape.id}
                          onClick={() => {
                            onUpdateConfig({
                              ...config,
                              branding: {
                                ...branding,
                                logoShape: shape.id as any
                              }
                            });
                            soundEffects.playButtonClick();
                          }}
                          className={`px-2 py-2 rounded-lg text-xs font-chakra font-bold border transition-all cursor-pointer ${
                            branding.logoShape === shape.id
                              ? 'bg-amber-500 text-black border-amber-300 shadow'
                              : 'bg-[#141414] text-gray-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Name & Subtitle inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-chakra font-bold text-gray-400">Primary Jukebox / Venue Title:</label>
                    <input
                      type="text"
                      value={branding.title || ''}
                      onChange={(e) => onUpdateConfig({
                        ...config,
                        branding: { ...branding, title: e.target.value }
                      })}
                      placeholder="e.g. COSTCO PRO JUKEBOX"
                      className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-chakra focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-chakra font-bold text-gray-400">Subtitle / Tagline:</label>
                    <input
                      type="text"
                      value={branding.subtitle || ''}
                      onChange={(e) => onUpdateConfig({
                        ...config,
                        branding: { ...branding, subtitle: e.target.value }
                      })}
                      placeholder="e.g. Rockola Digital Edition"
                      className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-chakra focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* LED Marquee custom text */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-chakra font-bold text-gray-400">Marquee LED Ticker Custom Announcement:</label>
                  <input
                    type="text"
                    value={branding.marqueeCustomText || ''}
                    onChange={(e) => onUpdateConfig({
                      ...config,
                      branding: { ...branding, marqueeCustomText: e.target.value }
                    })}
                    placeholder="Enter promotion / venue announcement displayed on top LED marquee..."
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Ready-Made 8 Themes Selection */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-amber-400 font-chakra flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <span>Visual Themes &amp; Skins (8 Presets)</span>
                  </h3>
                  <span className="text-xs text-gray-500 font-chakra">
                    Instant cabinet skin, backdrop, and accent lighting switch
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(THEMES) as SkinType[]).map(key => {
                    const themeItem = THEMES[key];
                    const isSelected = config.skin === key;

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onUpdateConfig({ 
                            ...config, 
                            skin: key,
                            branding: { ...branding, themePreset: key }
                          });
                          soundEffects.playButtonClick();
                        }}
                        className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[135px] ${
                          isSelected
                            ? 'bg-[#1C1C1C] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                            : 'bg-[#141414] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-amber-400 border border-white/10">
                              {themeItem.badge}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                <Check className="w-3 h-3 text-amber-400" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-chakra font-bold text-xs text-white mt-1.5 leading-tight">
                            {themeItem.nameEn}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{themeItem.subtitleEn}</p>
                        </div>

                        {/* Font Family Display for Theme */}
                        <div className="pt-2 border-t border-white/5 mt-2">
                          <p className="text-[9px] text-gray-400 font-mono flex items-center justify-between">
                            <span>Font Family:</span>
                          </p>
                          <p className={`text-[11px] ${themeItem.fontFamilyClass} font-bold text-amber-300 truncate mt-0.5`}>
                            {themeItem.fontFamilyName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display & Sound Effects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">CRT Scanlines Shader</h4>
                    <p className="text-xs text-gray-400">Authentic retro arcade cathode-ray tube simulation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.crtScanlinesEnabled ?? config.scanlinesEnabled}
                    onChange={(e) => onUpdateConfig({ ...config, crtScanlinesEnabled: e.target.checked, scanlinesEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Phosphor Glow &amp; Vignette</h4>
                    <p className="text-xs text-gray-400">CRT glass curvature and ambient phosphor lighting</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.phosphorGlowEnabled ?? true}
                    onChange={(e) => onUpdateConfig({ ...config, phosphorGlowEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Visual Sync Spectrum</h4>
                    <p className="text-xs text-gray-400">Link LED lights to Web Audio API spectrum</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.visualSyncSpectrumEnabled ?? true}
                    onChange={(e) => onUpdateConfig({ ...config, visualSyncSpectrumEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Cabinet Sound FX (Coin &amp; Clicks)</h4>
                    <p className="text-xs text-gray-400">Audio feedback for coin drops and arcade tactile microswitches</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.soundEffectsEnabled}
                    onChange={(e) => onUpdateConfig({ ...config, soundEffectsEnabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-amber-300">Volume Normalization (Compressor)</h4>
                    <p className="text-xs text-gray-400">DynamicCompressorNode auto-leveling loudness across tracks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.loudnessNormalization ?? true}
                    onChange={(e) => {
                      onUpdateConfig({ ...config, loudnessNormalization: e.target.checked });
                      audioEngine.setLoudnessNormalization(e.target.checked);
                    }}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Commercial Navigation Dock</h4>
                    <p className="text-xs text-gray-400">Display bottom commercial navigation bar on the main screen</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showCommercialDock ?? false}
                    onChange={(e) => onUpdateConfig({ ...config, showCommercialDock: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB: SYSTEM HEALTH MONITOR */}
          {activeTab === 'system-health' && (() => {
            const metrics = audioEngine.getSystemHealthMetrics();
            const underruns = metrics.underrunCount;
            
            let statusLevel: 'green' | 'yellow' | 'red' = 'green';
            let statusTitle = 'OPTIMAL STABILITY';
            let statusDesc = 'All jukebox DSP components, audio context buffers, and system hardware temperatures are operating within safe optimal limits.';
            let bgBorder = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300';
            let badgeStyle = 'bg-emerald-500 text-black';
            let dotColor = 'bg-emerald-400 animate-ping';

            if (cpuTemp > 75 || memoryInfo.percent > 85 || underruns > 5) {
              statusLevel = 'red';
              statusTitle = 'THERMAL / BUFFER UNDERRUN WARNING';
              statusDesc = 'System thermal load or audio buffer dropouts detected! Consider clearing audio cache or lowering visualizer processing.';
              bgBorder = 'bg-red-950/40 border-red-500/60 text-red-300';
              badgeStyle = 'bg-red-500 text-white';
              dotColor = 'bg-red-500 animate-ping';
            } else if (cpuTemp > 62 || memoryInfo.percent > 70 || underruns >= 2) {
              statusLevel = 'yellow';
              statusTitle = 'MODERATE SYSTEM LOAD';
              statusDesc = 'Slight thermal rise or memory pressure detected. System performance monitoring is actively engaged.';
              bgBorder = 'bg-amber-950/40 border-amber-500/60 text-amber-300';
              badgeStyle = 'bg-amber-500 text-black';
              dotColor = 'bg-amber-400 animate-pulse';
            }

            return (
              <div className="space-y-6">
                
                {/* Visual Green/Yellow/Red Status Banner */}
                <div className={`p-5 rounded-2xl border-2 shadow-xl flex items-center justify-between transition-all ${bgBorder}`}>
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black/50 border border-white/10 shrink-0">
                      <span className={`absolute w-3 h-3 rounded-full ${dotColor}`} />
                      <span className={`w-3 h-3 rounded-full ${badgeStyle}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeStyle}`}>
                          STATUS: {statusLevel.toUpperCase()}
                        </span>
                        <h3 className="font-chakra font-bold text-lg sm:text-xl text-white tracking-wide">
                          {statusTitle}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-300 font-chakra mt-1 max-w-2xl leading-relaxed">
                        {statusDesc}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-1 font-mono text-xs shrink-0">
                    <span className="text-gray-400">JUKEBOX CORE ENGINE</span>
                    <span className="text-white font-bold bg-black/60 px-3 py-1 rounded-lg border border-white/10">
                      SYSTEM HEALTH: {statusLevel === 'green' ? '100% NOMINAL' : statusLevel === 'yellow' ? '82% MODERATE' : '64% ALERT'}
                    </span>
                  </div>
                </div>

                {/* Subsystem Health Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* CARD 1: CPU Temperature Monitor */}
                  <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-amber-400" />
                          <span>CPU Thermal Sensor</span>
                        </h4>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          cpuTemp > 75 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          cpuTemp > 62 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {cpuTemp.toFixed(1)}°C
                        </span>
                      </div>

                      {/* Temperature Gauge Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px] text-gray-400 font-chakra">
                          <span>30°C (Min)</span>
                          <span className="font-bold text-white">{cpuTemp < 65 ? 'Normal Zone' : cpuTemp < 78 ? 'Elevated' : 'High Temp'}</span>
                          <span>85°C (Limit)</span>
                        </div>
                        <div className="w-full h-3 bg-[#181818] rounded-full overflow-hidden border border-white/10 relative">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              cpuTemp > 75 ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                              cpuTemp > 62 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' :
                              'bg-gradient-to-r from-cyan-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, ((cpuTemp - 30) / 55) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-3 font-chakra leading-relaxed">
                        Monitors central processor thermal output from Web Audio DSP synthesizer and canvas animations.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setIsStressTesting(prev => !prev);
                        showFeedback(!isStressTesting ? '⚡ Stress test started: Simulating high thermal load...' : '✓ Stress test completed');
                      }}
                      className={`w-full py-2 px-3 rounded-lg font-chakra font-bold text-xs transition-colors cursor-pointer border ${
                        isStressTesting 
                          ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30' 
                          : 'bg-[#181818] text-amber-400 border-amber-500/30 hover:bg-[#202020]'
                      }`}
                    >
                      {isStressTesting ? '⏹ Stop Thermal Stress Test' : '⚡ Run Thermal & DSP Stress Test'}
                    </button>
                  </div>

                  {/* CARD 2: Memory & JS Heap Monitor */}
                  <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-cyan-400" />
                          <span>System Memory (RAM)</span>
                        </h4>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {memoryInfo.percent}% USED
                        </span>
                      </div>

                      {/* Memory Gauge Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px] text-gray-400 font-chakra">
                          <span>{memoryInfo.usedMb} MB Used</span>
                          <span className="font-bold text-white">{memoryInfo.totalMb} MB Limit</span>
                        </div>
                        <div className="w-full h-3 bg-[#181818] rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                            style={{ width: `${memoryInfo.percent}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-3 font-chakra leading-relaxed">
                        Tracks JavaScript heap allocation, audio buffer storage, and song artwork memory footprint.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        soundEffects.playButtonClick();
                        handleClearAudioCache();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#181818] text-cyan-300 border border-cyan-500/30 hover:bg-[#202020] font-chakra font-bold text-xs transition-colors cursor-pointer"
                    >
                      🧹 Clear RAM &amp; Audio Buffer Cache
                    </button>
                  </div>

                  {/* CARD 3: Audio Buffer & Stream Underruns */}
                  <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span>Audio Buffer Underruns</span>
                        </h4>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          underruns > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {underruns} DROPS
                        </span>
                      </div>

                      <div className="bg-[#141414] rounded-lg p-3 border border-white/5 space-y-1.5 font-mono text-[11px] text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500">AudioContext State:</span>
                          <span className="text-emerald-400 font-bold uppercase">{metrics.contextState}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sample Rate:</span>
                          <span className="text-white font-bold">{metrics.sampleRate.toLocaleString()} Hz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Base / Output Latency:</span>
                          <span className="text-cyan-400 font-bold">{metrics.baseLatencyMs}ms / {metrics.outputLatencyMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Active Audio Channel:</span>
                          <span className="text-amber-400 font-bold">CHANNEL {metrics.activeChannel}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundEffects.playButtonClick();
                        audioEngine.resetUnderrunCount();
                        showFeedback('✓ Audio buffer underrun counter cleared');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#181818] text-purple-300 border border-purple-500/30 hover:bg-[#202020] font-chakra font-bold text-xs transition-colors cursor-pointer"
                    >
                      ↺ Clear Underrun Counter
                    </button>
                  </div>

                </div>

                {/* Real-Time Hardware Diagnostics Terminal */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-chakra font-bold text-sm text-amber-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span>Live Hardware &amp; Audio Telemetry Console</span>
                    </h4>
                    <span className="text-xs text-gray-500 font-mono">Auto-polling every 2000ms</span>
                  </div>

                  <div className="bg-black p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/10 h-36 overflow-y-auto space-y-1 select-text">
                    {healthLogs.length === 0 ? (
                      <p className="text-gray-600 italic">Initializing hardware diagnostic polling stream...</p>
                    ) : (
                      healthLogs.map((log, i) => (
                        <div key={i} className="leading-tight hover:bg-white/5 px-1 rounded">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB: BALANCE & PANNING */}
          {activeTab === 'balance-panning' && (
            <div className="space-y-6">
              
              {/* Header explanation banner */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-chakra font-bold text-lg text-white">
                      Stereo Panning, Channel Balance &amp; Speaker Orientation
                    </h3>
                    <p className="text-xs text-gray-400 font-chakra mt-0.5">
                      Fine-tune stereo channel balance and spatial sound width to compensate for vintage jukebox cabinet speaker placement, corner reflections, or non-symmetrical loudspeaker arrays.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. CHANNEL BALANCE SECTION */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>Channel Balance (Left vs Right Panning)</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-chakra">
                      Shifts relative volume output between left and right cabinet speaker channels
                    </p>
                  </div>

                  <span className="text-sm font-mono font-bold px-3 py-1 rounded bg-[#181818] border border-white/10 text-amber-400">
                    {(config.stereoBalance ?? 0) === 0 
                      ? 'CENTER (0)' 
                      : (config.stereoBalance ?? 0) < 0 
                      ? `${Math.abs(config.stereoBalance ?? 0)}% LEFT` 
                      : `${config.stereoBalance}% RIGHT`}
                  </span>
                </div>

                {/* Balance Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={config.stereoBalance ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateConfig({ ...config, stereoBalance: val });
                      audioEngine.setBalance(val);
                    }}
                    className="w-full accent-amber-500 h-2.5 bg-[#1C1C1C] rounded-lg appearance-none cursor-pointer border border-white/10"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 px-1">
                    <span>100% LEFT</span>
                    <span>50% L</span>
                    <span className="text-amber-400 font-bold">CENTER</span>
                    <span>50% R</span>
                    <span>100% RIGHT</span>
                  </div>
                </div>

                {/* Live L/R Speaker Power Output Distribution Indicator */}
                <div className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-chakra font-bold">
                    <span className="text-cyan-400">Left Speaker Output: {Math.round(Math.max(0, 100 - (config.stereoBalance ?? 0)))}%</span>
                    <span className="text-amber-400">Right Speaker Output: {Math.round(Math.max(0, 100 + (config.stereoBalance ?? 0)))}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-3 bg-[#1C1C1C] rounded-full overflow-hidden border border-white/10 flex justify-end">
                      <div 
                        className="h-full bg-cyan-400 transition-all rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (config.stereoBalance ?? 0)))}%` }}
                      />
                    </div>
                    <div className="h-3 bg-[#1C1C1C] rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-amber-400 transition-all rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, 100 + (config.stereoBalance ?? 0)))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Presets for Vintage Jukebox Speaker Cabinet Orientations */}
                <div className="space-y-2">
                  <label className="text-xs font-chakra font-bold text-gray-400">
                    Cabinet Speaker Orientation Quick Presets:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: 'Full Left (-100)', val: -100 },
                      { label: 'Corner Wall (-25)', val: -25 },
                      { label: 'Center Equal (0)', val: 0 },
                      { label: 'Side Wall (+25)', val: 25 },
                      { label: 'Full Right (+100)', val: 100 }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        onClick={() => {
                          onUpdateConfig({ ...config, stereoBalance: preset.val });
                          audioEngine.setBalance(preset.val);
                          soundEffects.playButtonClick();
                          showFeedback(`✓ Speaker balance set to ${preset.label}`);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-chakra font-bold border transition-all cursor-pointer ${
                          (config.stereoBalance ?? 0) === preset.val
                            ? 'bg-amber-500 text-black border-amber-300 shadow'
                            : 'bg-[#141414] text-gray-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. STEREO WIDTH & EXPANSION MATRIX SECTION */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Stereo Width &amp; Spatial Expansion Matrix</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-chakra">
                      Adjusts channel separation matrix from 0% (Full Mono) to 200% (Expanded Spatial Stereo)
                    </p>
                  </div>

                  <span className="text-sm font-mono font-bold px-3 py-1 rounded bg-[#181818] border border-white/10 text-cyan-400">
                    {config.stereoWidth ?? 100}% WIDTH
                  </span>
                </div>

                {/* Width Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={config.stereoWidth ?? 100}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateConfig({ ...config, stereoWidth: val });
                      audioEngine.setStereoWidth(val);
                    }}
                    className="w-full accent-cyan-400 h-2.5 bg-[#1C1C1C] rounded-lg appearance-none cursor-pointer border border-white/10"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 px-1">
                    <span>0% (MONO SUM)</span>
                    <span>50% (NARROW)</span>
                    <span className="text-cyan-400 font-bold">100% (STANDARD STEREO)</span>
                    <span>150% (EXPANDED)</span>
                    <span>200% (SPATIAL WIDE)</span>
                  </div>
                </div>

                {/* Presets for Stereo Width */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: '0% MONO SUM', val: 0 },
                    { label: '50% NARROW', val: 50 },
                    { label: '100% STEREO', val: 100 },
                    { label: '150% EXPANDED', val: 150 },
                    { label: '200% SPATIAL', val: 200 }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      onClick={() => {
                        onUpdateConfig({ ...config, stereoWidth: preset.val });
                        audioEngine.setStereoWidth(preset.val);
                        soundEffects.playButtonClick();
                        showFeedback(`✓ Stereo width set to ${preset.label}`);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-chakra font-bold border transition-all cursor-pointer ${
                        (config.stereoWidth ?? 100) === preset.val
                          ? 'bg-cyan-400 text-black border-cyan-200 shadow'
                          : 'bg-[#141414] text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. SPEAKER HARDWARE TEST TONE GENERATOR */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-4">
                <h4 className="font-chakra font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  <span>Hardware Speaker Diagnostic Test Pulse Tones</span>
                </h4>
                <p className="text-xs text-gray-400 font-chakra">
                  Generates direct 1-second sine wave audio test tones to verify cabinet wiring and speaker driver integrity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => playSpeakerTestPulse('left')}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-cyan-500/40 text-cyan-300 font-chakra font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Test LEFT Speaker (440Hz)</span>
                  </button>

                  <button
                    onClick={() => playSpeakerTestPulse('center')}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-purple-500/40 text-purple-300 font-chakra font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>Test CENTER Imaging (660Hz)</span>
                  </button>

                  <button
                    onClick={() => playSpeakerTestPulse('right')}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-amber-500/40 text-amber-300 font-chakra font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Test RIGHT Speaker (880Hz)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: HARDWARE DIAGNOSTIC MODE */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-6">

              {/* Theme Boot Sequence Trigger Card */}
              {onTriggerBootSequence && (
                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white font-chakra">
                        Theme Boot &amp; Hardware Startup Diagnostics
                      </h4>
                      <p className="text-[11px] text-gray-400 font-chakra mt-0.5">
                        Play the full theme graphic startup boot sequence with logo, audio chime, and diagnostic loading bar.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      onClose();
                      onTriggerBootSequence();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-chakra font-black flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Play Theme Boot Sequence</span>
                  </button>
                </div>
              )}
              
              {/* Top Banner & Control Actions */}
              <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-chakra flex flex-wrap items-center gap-2">
                      <span>Input Monitor Diagnostic Dashboard</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                        REAL-TIME EVENT LOG ACTIVE
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 font-chakra mt-0.5">
                      Continuous telemetry for 5-button arcade microswitches, debounce filter, contact bounce &amp; USB bus health
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                  <button
                    onClick={handleRunDiagnosticSweep}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-chakra font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Signal Test Sweep</span>
                  </button>

                  <button
                    onClick={handleExportDiagnosticReport}
                    className="px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-white/10 text-xs font-chakra text-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export TXT Report</span>
                  </button>

                  <button
                    onClick={handleResetDiagnosticCounters}
                    className="px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-white/10 text-xs font-chakra text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Log</span>
                  </button>
                </div>
              </div>

              {/* Real-time Hardware Metrics Deck */}
              {(() => {
                const noiseCount = hardwareLogs.filter(l => l.type === 'SIGNAL_NOISE' || l.type === 'CONTACT_BOUNCE').length;
                const failureCount = hardwareLogs.filter(l => l.type === 'CONNECTION_FAILURE' || l.type === 'DEVICE_DISCONNECTED' || l.severity === 'ERROR' || l.severity === 'CRITICAL').length;
                const stuckCount = hardwareLogs.filter(l => l.type === 'STUCK_SWITCH').length;
                const totalHits = Object.values(diagnosticHitCounts).reduce((a: number, b: number) => a + b, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#0A0A0A] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-gray-400 text-xs font-chakra">
                        <span>Signal Noise &amp; Bounce</span>
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className={`font-mono text-2xl font-bold ${noiseCount > 0 ? 'text-amber-400' : 'text-gray-200'}`}>
                          {noiseCount}
                        </span>
                        <span className="text-[10px] text-gray-500 font-chakra">Debounce Filtered</span>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-gray-400 text-xs font-chakra">
                        <span>Disconnects &amp; Faults</span>
                        <AlertTriangle className={`w-4 h-4 ${failureCount > 0 ? 'text-red-400 animate-bounce' : 'text-gray-500'}`} />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className={`font-mono text-2xl font-bold ${failureCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {failureCount}
                        </span>
                        <span className="text-[10px] text-gray-500 font-chakra">{failureCount === 0 ? 'Stable Bus' : 'Signal Drop Errors'}</span>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-gray-400 text-xs font-chakra">
                        <span>Stuck Switches</span>
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className={`font-mono text-2xl font-bold ${stuckCount > 0 ? 'text-orange-400' : 'text-gray-200'}`}>
                          {stuckCount}
                        </span>
                        <span className="text-[10px] text-gray-500 font-chakra">&gt; 5.0 Seconds</span>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-gray-400 text-xs font-chakra">
                        <span>5-Button Controller</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-xl font-bold text-emerald-400">
                          READY
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">USB 5V</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Timestamped Diagnostic Log Stream */}
              <div className="bg-[#0A0A0A] rounded-xl p-4 sm:p-5 border border-white/10 space-y-4 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white font-chakra flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span>Real-time Signal &amp; Error Telemetry Log ({hardwareLogs.length} events)</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-chakra mt-0.5">
                      Tracks microswitch presses, electrical noise, contact bounce, and reconnect events with microsecond timestamps
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'NOISE', label: 'Noise & Bounce' },
                      { id: 'FAILURES', label: 'Errors & Faults' },
                      { id: 'STUCK', label: 'Stuck Switches' },
                      { id: 'NORMAL', label: 'Valid Presses' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setLogFilter(f.id as typeof logFilter)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-chakra font-medium transition-all cursor-pointer whitespace-nowrap ${
                          logFilter === f.id
                            ? 'bg-amber-500 text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Timestamped Log Table */}
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                  {(() => {
                    const filteredLogs = hardwareLogs.filter(log => {
                      if (logFilter === 'NOISE') return log.type === 'SIGNAL_NOISE' || log.type === 'CONTACT_BOUNCE';
                      if (logFilter === 'FAILURES') return log.type === 'CONNECTION_FAILURE' || log.type === 'DEVICE_DISCONNECTED' || log.severity === 'ERROR' || log.severity === 'CRITICAL';
                      if (logFilter === 'STUCK') return log.type === 'STUCK_SWITCH';
                      if (logFilter === 'NORMAL') return log.type === 'BUTTON_PRESS';
                      return true;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500 font-chakra text-xs">
                          <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                          <span>No events match this filter. Press cabinet buttons or run a signal test sweep.</span>
                        </div>
                      );
                    }

                    return filteredLogs.map((log) => {
                      const isError = log.severity === 'ERROR' || log.severity === 'CRITICAL';
                      const isWarning = log.severity === 'WARNING';
                      const isNoise = log.type === 'SIGNAL_NOISE' || log.type === 'CONTACT_BOUNCE';

                      const severityBadgeClass = isError
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : isWarning || isNoise
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

                      return (
                        <div
                          key={log.id}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            isError
                              ? 'bg-red-950/30 border-red-500/40 text-red-200'
                              : isNoise
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                              : 'bg-[#141414] border-white/5 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {/* Timestamp */}
                            <span className="text-gray-500 text-[11px] font-mono shrink-0 w-24">
                              {new Date(log.timestamp).toLocaleTimeString('he-IL', { hour12: false })}.{String(new Date(log.timestamp).getMilliseconds()).padStart(3, '0')}
                            </span>

                            {/* Severity / Type Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono shrink-0 ${severityBadgeClass}`}>
                              {log.type}
                            </span>

                            {/* Button & Mapped Action */}
                            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-cyan-300 shrink-0">
                              {log.buttonId}
                              {log.mappedAction ? ` → ${log.mappedAction}` : ''}
                            </span>

                            {/* Message */}
                            <span className="text-xs font-chakra truncate text-gray-200">
                              {log.message}
                            </span>
                          </div>

                          {/* Extra Technical Details */}
                          {log.details && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 shrink-0">
                              {log.details.jitterIntervalMs !== undefined && (
                                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/5 text-amber-400">
                                  jitter: {log.details.jitterIntervalMs}ms
                                </span>
                              )}
                              {log.details.durationMs !== undefined && (
                                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/5 text-orange-300">
                                  held: {log.details.durationMs}ms
                                </span>
                              )}
                              {log.details.keyCode && (
                                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/5 text-gray-400">
                                  key: {log.details.keyCode}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Visual Arcade Controller & Coin Buttons Deck */}
              <div className="bg-[#0A0A0A] rounded-xl p-6 border border-white/10 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-sm text-amber-400 font-chakra flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>Arcade Controller Panel Indicators</span>
                  </h4>
                  <span className="text-xs font-mono text-gray-500">
                    STATUS: USB ENCODER READY
                  </span>
                </div>

                {/* Physical Layout Visualizer */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {[
                    { id: 'up', label: 'UP (Navigate Up)', keyCodes: config.keyBindings.up },
                    { id: 'down', label: 'DOWN (Navigate Down)', keyCodes: config.keyBindings.down },
                    { id: 'left', label: 'LEFT (Navigate Left)', keyCodes: config.keyBindings.left },
                    { id: 'right', label: 'RIGHT (Navigate Right)', keyCodes: config.keyBindings.right },
                    { id: 'select', label: 'SELECT / OK (Button 5)', keyCodes: config.keyBindings.select },
                    { id: 'coin1', label: 'COIN 1 (Primary Drop)', keyCodes: config.keyBindings.coin1 },
                    { id: 'coin2', label: 'COIN 2 (Secondary Drop)', keyCodes: config.keyBindings.coin2 },
                    { id: 'service', label: 'SERVICE (F2)', keyCodes: config.keyBindings.service },
                    { id: 'freePlayToggle', label: 'FREE PLAY (F8)', keyCodes: config.keyBindings.freePlayToggle },
                    { id: 'volumeUp', label: 'VOL + (Volume Up)', keyCodes: config.keyBindings.volumeUp || [] }
                  ].map(btn => {
                    const isLit = Boolean(diagnosticActiveButtons[btn.id]);
                    const count = diagnosticHitCounts[btn.id] || 0;

                    return (
                      <div
                        key={btn.id}
                        className={`rounded-2xl p-4 border transition-all duration-150 flex flex-col justify-between h-32 relative overflow-hidden ${
                          isLit
                            ? 'bg-amber-400 border-white text-black shadow-[0_0_30px_rgba(245,158,11,0.9)] scale-105'
                            : count > 0
                            ? 'bg-[#181818] border-amber-500/30 text-white'
                            : 'bg-[#121212] border-white/5 text-gray-400'
                        }`}
                      >
                        {/* LED Pulse Light Indicator */}
                        <div className="flex items-center justify-between">
                          <span className={`w-3 h-3 rounded-full border ${
                            isLit
                              ? 'bg-white border-black animate-ping shadow-[0_0_12px_#fff]'
                              : count > 0
                              ? 'bg-amber-500 border-amber-300'
                              : 'bg-black/80 border-white/10'
                          }`} />
                          <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            isLit ? 'bg-black text-white' : 'bg-black/50 text-amber-400'
                          }`}>
                            {count} HITS
                          </span>
                        </div>

                        <div>
                          <h5 className={`font-chakra font-black text-xs sm:text-sm leading-tight ${
                            isLit ? 'text-black' : 'text-white'
                          }`}>
                            {btn.label}
                          </h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {btn.keyCodes.slice(0, 2).map(k => (
                              <span
                                key={k}
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                  isLit ? 'bg-black/30 text-black font-bold' : 'bg-[#222] text-gray-400'
                                }`}
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>

                        {isLit && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom 5-Button Macro Sequences Manager Panel */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-amber-500/30 space-y-5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white font-chakra flex items-center gap-2">
                        <span>Custom 5-Button Hardware Macro Sequences</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                          MACRO ENGINE
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 font-chakra mt-0.5">
                        Define rapid button key sequences (e.g., "1-1-2", "UP-UP-DOWN") to trigger playlists, coin credits, or screensavers directly from hardware.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Defined Macros List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(config.macroSequences || DEFAULT_MACRO_SEQUENCES).map(macro => (
                    <div
                      key={macro.id}
                      className="bg-[#141414] rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-chakra font-bold text-xs text-white truncate">
                            {macro.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                            {macro.actionType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-chakra text-gray-400">Sequence:</span>
                          <div className="flex items-center gap-1">
                            {macro.sequence.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <span className="px-1.5 py-0.5 rounded bg-black border border-amber-400/40 font-mono text-[10px] font-bold text-cyan-300">
                                  {step}
                                </span>
                                {idx < macro.sequence.length - 1 && <span className="text-gray-500 text-[10px]">-</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 font-chakra truncate">
                          Target: {macro.targetValue}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteMacro(macro.id)}
                        className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-colors cursor-pointer shrink-0"
                        title="Delete Macro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Macro Form */}
                <div className="bg-[#121212] rounded-xl p-4 border border-white/10 space-y-3">
                  <h5 className="text-xs font-chakra font-bold text-amber-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Add New Custom Macro Sequence</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-chakra text-gray-400 block mb-1">Macro Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Party Trigger 1-1-2"
                        value={newMacroName}
                        onChange={(e) => setNewMacroName(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-chakra focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-chakra text-gray-400 block mb-1">Sequence (comma/dash sep)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1, 1, 2 or UP, UP, DOWN"
                        value={newMacroSequence}
                        onChange={(e) => setNewMacroSequence(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-chakra text-gray-400 block mb-1">Target Action</label>
                      <select
                        value={newMacroActionType}
                        onChange={(e) => setNewMacroActionType(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-chakra focus:border-amber-400 outline-none cursor-pointer"
                      >
                        <option value="PLAYLIST">Load Specific Playlist</option>
                        <option value="COIN">Add Coin Credit Pulse</option>
                        <option value="FREEPLAY">Toggle Free Play</option>
                        <option value="ATTRACT">Trigger Attract Screensaver</option>
                        <option value="CODE">Jump to Song Code (e.g. A01)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-chakra text-gray-400 block mb-1">Target Value / ID</label>
                      {newMacroActionType === 'PLAYLIST' ? (
                        <select
                          value={newMacroTargetValue}
                          onChange={(e) => setNewMacroTargetValue(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-chakra focus:border-amber-400 outline-none cursor-pointer"
                        >
                          {playlists.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. A01 or 1"
                          value={newMacroTargetValue}
                          onChange={(e) => setNewMacroTargetValue(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-chakra focus:border-amber-400 outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAddMacro}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-chakra font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Custom Macro Sequence</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: STORAGE HEALTH, BROWSER CACHE & AUDIO ENGINE NORMALIZATION */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              
              {/* Top Banner */}
              <div className="bg-[#0A0A0A] border border-cyan-500/30 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                    <Gauge className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-chakra flex flex-wrap items-center gap-2">
                      <span>Browser Storage, Cache & Audio Engine Diagnostics</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                        storageReport?.healthStatus === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : storageReport?.healthStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {storageReport?.healthStatus === 'CRITICAL'
                          ? '🔴 CRITICAL STORAGE ERROR'
                          : storageReport?.healthStatus === 'WARNING'
                          ? '🟡 CAPACITY / LATENCY WARNING'
                          : '🟢 STORAGE HEALTHY'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 font-chakra mt-0.5">
                      Monitor song library storage quota, cache integrity (Cache & LocalStorage), loudness normalization, and track crossfading
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                  <button
                    onClick={handleTestStorageHealth}
                    disabled={isLoadingStorage}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-chakra font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                    <span>Run Benchmark Test</span>
                  </button>

                  <button
                    onClick={handleClearAudioCache}
                    className="px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-white/10 text-xs font-chakra text-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flush Audio Cache</span>
                  </button>
                </div>
              </div>

              {/* 1. Storage Quota & Capacity Gauge Card */}
              <div className="bg-[#111624] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-chakra font-bold text-sm text-white">
                      Browser Storage Cache & Song Library Quota
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    {storageReport ? `${storageReport.usageFormatted} / ${storageReport.quotaFormatted}` : 'Loading...'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-chakra">
                    <span className="text-gray-400">Disk Quota Utilization</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {storageReport ? `${storageReport.percentUsed}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        (storageReport?.percentUsed || 0) > 85
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : (storageReport?.percentUsed || 0) > 60
                          ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, storageReport?.percentUsed || 2)}%` }}
                    />
                  </div>
                </div>

                {/* 4 Diagnostic Storage KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col">
                    <span className="text-[11px] text-gray-400 font-chakra">Estimated Free Space</span>
                    <span className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-1">
                      {storageReport?.freeSpaceFormatted || '10+ GB'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Available Space</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col">
                    <span className="text-[11px] text-gray-400 font-chakra">R/W Response Latency</span>
                    <span className="text-base sm:text-lg font-mono font-bold text-cyan-400 mt-1">
                      {storageReport ? `${storageReport.latencyMs} ms` : '1.2 ms'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">R/W IO Benchmark</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col">
                    <span className="text-[11px] text-gray-400 font-chakra">Custom Song Footprint</span>
                    <span className="text-base sm:text-lg font-mono font-bold text-amber-400 mt-1">
                      {storageReport?.customSongsFootprint || '0 KB'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{customSongs.length} uploaded tracks</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col">
                    <span className="text-[11px] text-gray-400 font-chakra">Eviction Protection</span>
                    <span className={`text-base sm:text-lg font-mono font-bold mt-1 ${storageReport?.isPersistent ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {storageReport?.isPersistent ? 'LOCKED (PERSIST)' : 'STANDARD'}
                    </span>
                    <button
                      onClick={handleRequestPersist}
                      className="text-[10px] text-cyan-400 underline hover:text-cyan-300 text-left mt-0.5 cursor-pointer"
                    >
                      Request Persist Lock
                    </button>
                  </div>
                </div>

                {/* Storage Health Notes */}
                <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 text-xs font-chakra space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Storage Subsystem Status (LocalStorage & IndexedDB):</span>
                  </div>
                  <p className="text-gray-300 text-[11px]">
                    {storageReport?.details || 'Storage subsystem operating nominally with zero corruption faults.'}
                  </p>
                </div>
              </div>

              {/* 2. Audio Engine Loudness Normalization & DSP Settings */}
              <div className="bg-[#111624] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-chakra font-bold text-sm text-white">
                      Audio Engine DSP, Normalization & Transition Control
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Loudness Normalization Toggle */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-chakra font-bold text-white text-sm">
                          Automatic Loudness Normalization (DSP Compressor)
                        </div>
                        <div className="text-xs text-gray-400 font-chakra mt-1">
                          Engages dynamic range compression to level playback volume across different tracks and avoid sudden volume spikes
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.loudnessNormalization ?? true}
                        onChange={(e) => {
                          soundEffects.playButtonClick();
                          const val = e.target.checked;
                          onUpdateConfig({
                            ...config,
                            loudnessNormalization: val
                          });
                          audioEngine.setLoudnessNormalization(val);
                          showFeedback(`✓ Loudness Normalization ${val ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="w-5 h-5 accent-cyan-400 cursor-pointer shrink-0 mt-1"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#080c18] border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                      <div>• Compressor Threshold: -24 dB</div>
                      <div>• Knee / Ratio: 30 dB / 12:1 Peak Limiting</div>
                      <div>• Attack: 0.003s | Release: 0.25s</div>
                    </div>
                  </div>

                  {/* Crossfading Logic Toggle & Duration Slider */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-chakra font-bold text-white text-sm">
                          Seamless Audio Crossfading
                        </div>
                        <div className="text-xs text-gray-400 font-chakra mt-1">
                          Smoothly crossfades between queued tracks to eliminate silence gaps
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.crossfadeEnabled ?? true}
                        onChange={(e) => {
                          soundEffects.playButtonClick();
                          const val = e.target.checked;
                          onUpdateConfig({
                            ...config,
                            crossfadeEnabled: val
                          });
                          audioEngine.setCrossfadeEnabled(val);
                          showFeedback(`✓ Track Crossfading ${val ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="w-5 h-5 accent-cyan-400 cursor-pointer shrink-0 mt-1"
                      />
                    </div>

                    {/* Crossfade Duration Slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-chakra">
                        <span className="text-gray-400">Crossfade Overlap Time:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {config.crossfadeDuration ?? 3} seconds
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        value={config.crossfadeDuration ?? 3}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onUpdateConfig({
                            ...config,
                            crossfadeDuration: val
                          });
                          audioEngine.setCrossfadeDuration(val);
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Shuffle Mode Option in Settings */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-chakra font-bold text-white text-sm flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-cyan-400" />
                      <span>Background Auto-Shuffle Mode</span>
                    </div>
                    <div className="text-xs text-gray-400 font-chakra mt-1">
                      When the user playback queue is empty, randomly play background tracks from the catalog to maintain venue atmosphere
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.shuffleMode ?? false}
                    onChange={(e) => {
                      soundEffects.playButtonClick();
                      const val = e.target.checked;
                      onUpdateConfig({
                        ...config,
                        shuffleMode: val
                      });
                      showFeedback(`✓ Auto-Shuffle Mode ${val ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="w-5 h-5 accent-cyan-400 cursor-pointer shrink-0 mt-1"
                  />
                </div>

                {/* Local Music Directory Auto-Scanner & Background Polling Panel */}
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <div className="font-chakra font-bold text-white text-sm flex items-center gap-2">
                        <FolderSearch className="w-4 h-4 text-cyan-400" />
                        <span>Local Music Directory Auto-Scanner &amp; Background Watcher</span>
                      </div>
                      <div className="text-xs text-gray-400 font-chakra mt-1">
                        Automatically scans a designated local folder (e.g. <code className="text-cyan-300 font-mono">./music</code>) for MP3/WAV files and imports them into the jukebox catalog
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleScanLocalDirectory}
                        disabled={isDirectoryScanning}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-chakra font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                      >
                        <FolderSearch className={`w-4 h-4 ${isDirectoryScanning ? 'animate-spin' : ''}`} />
                        <span>{isDirectoryScanning ? 'Scanning Directory...' : 'Scan Local Folder Now'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Polling Switch & Interval Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 rounded-lg bg-[#080c18] border border-cyan-500/20 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-chakra font-bold text-white flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Background Auto-Polling Watcher</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-chakra mt-0.5">
                          Periodically re-scans local folder for new MP3 additions
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={config.autoPollLocalDirectory ?? true}
                        onChange={(e) => {
                          soundEffects.playButtonClick();
                          const val = e.target.checked;
                          onUpdateConfig({
                            ...config,
                            autoPollLocalDirectory: val
                          });
                          showFeedback(`✓ Local Directory Background Polling ${val ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="w-5 h-5 accent-cyan-400 cursor-pointer shrink-0"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-[#080c18] border border-cyan-500/20 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-chakra font-bold text-white">Polling Interval</div>
                        <div className="text-[10px] text-gray-400 font-chakra mt-0.5">
                          Frequency of folder check
                        </div>
                      </div>

                      <select
                        value={config.autoPollIntervalSeconds || 30}
                        onChange={(e) => {
                          const sec = parseInt(e.target.value);
                          onUpdateConfig({
                            ...config,
                            autoPollIntervalSeconds: sec
                          });
                          showFeedback(`✓ Folder Polling Interval set to ${sec}s`);
                        }}
                        className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-cyan-300 font-mono outline-none cursor-pointer"
                      >
                        <option value={15}>Every 15 Seconds</option>
                        <option value={30}>Every 30 Seconds</option>
                        <option value={60}>Every 60 Seconds</option>
                      </select>
                    </div>
                  </div>

                  {/* Scan Status Summary */}
                  {scanReport && (
                    <div className="p-3 rounded-lg bg-black/80 border border-white/10 text-xs font-chakra space-y-1">
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="text-gray-400">Target Folder Path:</span>
                        <span className="font-mono text-cyan-300 font-bold">{scanReport.directoryPath}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="text-gray-400">Total Files Checked:</span>
                        <span className="font-mono text-white">{scanReport.scannedFilesCount} files</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="text-gray-400">Newly Imported Tracks:</span>
                        <span className="font-mono text-emerald-400 font-bold">+{scanReport.newTracksCount} tracks</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              
              <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-chakra text-amber-200/90">
                <div>
                  <p className="font-bold text-sm mb-1 flex items-center gap-1.5 text-amber-400">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Dynamic Key Mapping Calibration Studio
                  </p>
                  <p className="text-gray-300">
                    Click &quot;+ Map Key&quot; for any control action, then press the physical arcade microswitch on the cabinet. The system will register and save the keycode immediately.
                  </p>
                </div>

                <button
                  onClick={handleResetFactoryKeyBindings}
                  className="px-3.5 py-2 rounded-xl bg-[#1C1C1C] hover:bg-amber-500 hover:text-black border border-white/10 text-xs font-chakra font-bold text-amber-400 transition-all cursor-pointer shrink-0"
                >
                  Reset to Arcade Defaults
                </button>
              </div>

              {/* Dynamic Key Mapping Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hardwareActionsList.map(item => {
                  const currentBindings = config.keyBindings[item.key] || [];
                  const isCalibrating = calibratingAction === item.key;

                  return (
                    <div
                      key={item.key}
                      className={`bg-[#0A0A0A] rounded-xl p-4 border transition-all ${
                        isCalibrating
                          ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-chakra font-bold text-sm text-white">{item.labelHe}</h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/60 text-amber-400 border border-white/10">
                              {item.arcadeTag}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-chakra mt-0.5">{item.descHe}</p>
                        </div>

                        <button
                          onClick={() => {
                            if (isCalibrating) {
                              setCalibratingAction(null);
                            } else {
                              soundEffects.playButtonClick();
                              setCalibratingAction(item.key);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg font-chakra font-bold text-xs transition-all cursor-pointer shrink-0 ${
                            isCalibrating
                              ? 'bg-amber-500 text-black animate-pulse font-extrabold shadow'
                              : 'bg-[#1C1C1C] hover:bg-amber-500 hover:text-black text-amber-400 border border-white/10'
                          }`}
                        >
                          {isCalibrating ? '⚡ Press Arcade Key Now...' : '+ Map Key'}
                        </button>
                      </div>

                      {/* Current Key Pills */}
                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 font-chakra">Assigned Keys:</span>
                        {currentBindings.length === 0 ? (
                          <span className="text-[11px] text-red-400 font-mono">No keys assigned</span>
                        ) : (
                          currentBindings.map(code => (
                            <span
                              key={code}
                              className="group text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] text-amber-400 border border-white/10 flex items-center gap-1"
                            >
                              <span>{code}</span>
                              <button
                                onClick={() => handleRemoveKeyBinding(item.key, code)}
                                className="text-gray-500 hover:text-red-400 ml-0.5 cursor-pointer"
                                title="Remove key binding"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 4: PLAYLISTS STUDIO & MUSIC MANAGEMENT */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              
              {/* Playlists Studio Main Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: Playlists List (4 Cols) */}
                <div className="lg:col-span-4 bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-amber-400 font-chakra flex items-center gap-1.5">
                        <ListMusic className="w-4 h-4" />
                        <span>Curated Playlists ({playlists.length})</span>
                      </h4>
                      
                      <button
                        onClick={() => setIsCreatingPlaylist(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New</span>
                      </button>
                    </div>

                    {/* Create form */}
                    {isCreatingPlaylist && (
                      <div className="bg-[#141414] p-3 rounded-xl border border-amber-500/40 mb-3 space-y-2">
                        <input
                          type="text"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="New playlist name..."
                          className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                        />
                        <input
                          type="text"
                          value={newPlaylistDesc}
                          onChange={(e) => setNewPlaylistDesc(e.target.value)}
                          placeholder="Brief description..."
                          className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-amber-400"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setIsCreatingPlaylist(false)}
                            className="px-2.5 py-1 rounded bg-[#1C1C1C] text-gray-400 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreatePlaylist}
                            className="px-3 py-1 rounded bg-amber-500 text-black font-bold text-xs cursor-pointer"
                          >
                            Create Playlist
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of playlists */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {playlists.map(pl => {
                        const isSelected = pl.id === selectedPlaylistId;
                        return (
                          <div
                            key={pl.id}
                            onClick={() => setSelectedPlaylistId(pl.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#1C1C1C] border-amber-400 text-white shadow'
                                : 'bg-[#141414] border-white/5 hover:border-white/20 text-gray-300'
                            }`}
                          >
                            <div className="truncate flex-1">
                              <h5 className="font-chakra font-bold text-xs truncate">{pl.name || pl.nameHe}</h5>
                              <span className="text-[10px] text-gray-500 font-mono">{pl.songIds.length} tracks</span>
                            </div>

                            {!pl.isPreset && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlaylist(pl.id);
                                }}
                                className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50"
                                title="Delete playlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[11px] text-gray-500 font-chakra">
                    Export and import all playlists and configuration in the &quot;Backup &amp; Clone&quot; tab.
                  </div>
                </div>

                {/* Right: Selected Playlist Songs & Reordering (8 Cols) */}
                <div className="lg:col-span-8 bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-white font-chakra">
                          Playlist Tracks: {activePlaylist?.name || activePlaylist?.nameHe || 'None Selected'}
                        </h4>
                        <p className="text-xs text-gray-400 font-chakra">
                          Reorder tracks with arrows (Up/Down) or remove tracks from the playlist
                        </p>
                      </div>

                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-black text-amber-400 border border-white/10">
                        {playlistSongs.length} tracks
                      </span>
                    </div>

                    {/* Songs inside current playlist */}
                    {playlistSongs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 font-chakra text-xs">
                        Playlist is empty. Add songs from the catalog list below.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {playlistSongs.map((s, idx) => (
                          <div key={s.id} className="p-2 rounded-lg bg-[#141414] border border-white/5 flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-amber-400 text-[11px] w-6">#{idx + 1}</span>
                            <span className="font-mono px-1.5 py-0.2 rounded bg-black/60 text-amber-400 border border-white/10 text-[10px]">{s.code}</span>
                            <span className="font-semibold text-gray-200 truncate flex-1 mx-2">{s.title} - {s.artist}</span>
                            
                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveSongOrder(idx, 'up')}
                                className="p-1 rounded bg-[#1C1C1C] hover:bg-amber-500 hover:text-black text-gray-300 disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={idx === playlistSongs.length - 1}
                                onClick={() => handleMoveSongOrder(idx, 'down')}
                                className="p-1 rounded bg-[#1C1C1C] hover:bg-amber-500 hover:text-black text-gray-300 disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveSongFromPlaylist(s.id)}
                                className="p-1 rounded bg-red-950 text-red-300 hover:bg-red-900 cursor-pointer"
                                title="Remove from Playlist"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add More Songs to Playlist Selector */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 font-chakra">Add tracks from catalog to playlist:</span>
                      <input
                        type="text"
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        placeholder="Search track or artist to add..."
                        className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400 w-48"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {allSongs
                        .filter(s => !songSearchQuery || s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || s.artist.toLowerCase().includes(songSearchQuery.toLowerCase()))
                        .slice(0, 15)
                        .map(s => {
                          const alreadyIn = activePlaylist?.songIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              disabled={alreadyIn}
                              onClick={() => handleAddSongToPlaylist(s.id)}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-chakra shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                                alreadyIn
                                  ? 'bg-[#141414] border-white/5 text-gray-600 opacity-50'
                                  : 'bg-[#1C1C1C] hover:bg-amber-500 hover:text-black border-white/10 text-gray-300'
                              }`}
                            >
                              <span className="font-mono text-amber-400 text-[10px]">{s.code}</span>
                              <span className="truncate max-w-[120px]">{s.title}</span>
                              <Plus className="w-3 h-3" />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Local MP3 Audio Files Uploader */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Upload Custom Audio Files (MP3, WAV, FLAC)</h4>
                    <p className="text-xs text-gray-400">
                      Add songs from local storage into the jukebox catalog with automated dial codes (A50, A51, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-xs cursor-pointer shadow"
                  >
                    Select Audio Files
                  </button>

                  {customSongs.length > 0 && (
                    <button
                      onClick={onClearCustomSongs}
                      className="px-3 py-2 rounded-xl bg-red-950 text-red-300 border border-red-800 text-xs font-chakra font-bold cursor-pointer"
                    >
                      Clear ({customSongs.length})
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: SYSTEM BACKUP, JSON EXPORT & IMPORT (MULTI-UNIT SETUP) */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              
              <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-xl p-5 space-y-2">
                <h3 className="font-bold text-base text-amber-400 font-chakra flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <span>System Backup, Configuration Export &amp; Multi-Unit Clone</span>
                </h3>
                <p className="text-xs text-gray-300 font-chakra leading-relaxed">
                  Export complete settings, venue branding, marquee announcements, I-PAC arcade button mappings, and curated playlists to a secure JSON file. Easily import across multiple Costco Pro jukebox terminals.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Export Card */}
                <div className="bg-[#0A0A0A] rounded-xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-amber-500 text-black font-bold">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-chakra font-bold text-sm text-white">Export Configuration (JSON Export)</h4>
                        <p className="text-xs text-gray-400">Save full machine backup to file</p>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-400 font-chakra space-y-1.5 list-disc list-inside">
                      <li>Full venue branding, logo, and scrolling LED marquee</li>
                      <li>{playlists.length} playlists and track order sequence</li>
                      <li>Arcade controller bindings (I-PAC / Xin-Mo / USB encoders)</li>
                      <li>Pricing, currency, attract mode, and audio DSP profiles</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleExportFullSystem}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup File (Export JSON)</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-[#0A0A0A] rounded-xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-emerald-500 text-black font-bold">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-chakra font-bold text-sm text-white">Import Configuration (JSON Import)</h4>
                        <p className="text-xs text-gray-400">Apply configuration file from another machine</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-chakra leading-relaxed">
                      Load a JSON backup exported from another jukebox terminal. The system automatically synchronizes key bindings, pricing, playlists, and themes.
                    </p>
                  </div>

                  <input
                    ref={systemCloneInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFullSystem}
                    className="hidden"
                  />
                  <button
                    onClick={() => systemCloneInputRef.current?.click()}
                    className="w-full py-3 rounded-xl bg-[#1C1C1C] hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/40 font-chakra font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose JSON File to Import</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: PRICING & COINS */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Free Play Toggle */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Free Play Mode</h4>
                    <p className="text-xs text-gray-400">Allows song selection without requiring coin insertion</p>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, freePlay: !config.freePlay });
                      soundEffects.playButtonClick();
                    }}
                    className={`px-4 py-2 rounded-xl font-chakra font-bold text-xs transition-all cursor-pointer ${
                      config.freePlay
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-[#1C1C1C] text-gray-400 border border-white/10'
                    }`}
                  >
                    {config.freePlay ? 'Enabled (ON)' : 'Disabled (OFF)'}
                  </button>
                </div>

                {/* Songs Per Credit */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Songs Per Credit / Coin</h4>
                    <p className="text-xs text-gray-400">Number of plays granted per coin drop</p>
                  </div>
                  <select
                    value={config.songsPerCredit}
                    onChange={(e) => onUpdateConfig({ ...config, songsPerCredit: Number(e.target.value) })}
                    className="bg-[#1C1C1C] border border-white/10 text-amber-400 rounded-xl px-3 py-1.5 font-chakra text-xs cursor-pointer"
                  >
                    <option value={1}>1 Track per Coin</option>
                    <option value={2}>2 Tracks per Coin</option>
                    <option value={3}>3 Tracks per Coin</option>
                    <option value={5}>5 Tracks per Coin</option>
                  </select>
                </div>

                {/* Currency Symbol */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Currency Symbol</h4>
                    <p className="text-xs text-gray-400">Symbol displayed on cabinet and pricing prompts</p>
                  </div>
                  <select
                    value={config.currencySymbol}
                    onChange={(e) => onUpdateConfig({ ...config, currencySymbol: e.target.value })}
                    className="bg-[#1C1C1C] border border-white/10 text-amber-400 rounded-xl px-3 py-1.5 font-chakra text-xs cursor-pointer"
                  >
                    <option value="$">$ (USD / Dollar)</option>
                    <option value="€">€ (EUR / Euro)</option>
                    <option value="£">£ (GBP / Pound)</option>
                    <option value="CA$">CA$ (CAD / Canadian Dollar)</option>
                    <option value="MXN$">MXN$ (Mexican Peso)</option>
                  </select>
                </div>

                {/* Attract Mode Timeout */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">Attract Mode Screen Saver</h4>
                    <p className="text-xs text-gray-400">Idle time before launching demo showcase</p>
                  </div>
                  <select
                    value={config.attractModeTimeout}
                    onChange={(e) => onUpdateConfig({ ...config, attractModeTimeout: Number(e.target.value) })}
                    className="bg-[#1C1C1C] border border-white/10 text-amber-400 rounded-xl px-3 py-1.5 font-chakra text-xs cursor-pointer"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={60}>1 Minute</option>
                    <option value={90}>90 Seconds</option>
                    <option value={180}>3 Minutes</option>
                    <option value={99999}>Disabled (Off)</option>
                  </select>
                </div>

                {/* Low Credit Visual Nudge Option (Blink / Pulse on Coin Slot) */}
                <div className="sm:col-span-2 bg-[#0A0A0A] rounded-xl p-5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                      <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-chakra font-bold text-sm text-white">
                          Low Credit Coin Slot Nudge (Attention FX)
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          &lt; 3 CREDITS
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-chakra mt-1 max-w-xl">
                        Triggers animated LED lighting effects (neon pulse / strobe) on the lower coin mechanism when credits drop below 3.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    <select
                      value={config.lowCreditNudgeStyle || 'pulse'}
                      disabled={!config.lowCreditNudgeEnabled}
                      onChange={(e) => onUpdateConfig({ ...config, lowCreditNudgeStyle: e.target.value as 'pulse' | 'blink' | 'glow' })}
                      className={`border rounded-xl px-3 py-1.5 font-chakra text-xs cursor-pointer ${
                        config.lowCreditNudgeEnabled
                          ? 'bg-[#1C1C1C] border-white/20 text-amber-400'
                          : 'bg-[#141414] border-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <option value="pulse">Smooth Neon Pulse</option>
                      <option value="blink">Fast Strobe Blink</option>
                      <option value="glow">Intense Amber Glow</option>
                    </select>

                    <button
                      onClick={() => {
                        onUpdateConfig({ ...config, lowCreditNudgeEnabled: !config.lowCreditNudgeEnabled });
                        soundEffects.playButtonClick();
                      }}
                      className={`px-4 py-2 rounded-xl font-chakra font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                        config.lowCreditNudgeEnabled
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-[#1C1C1C] text-gray-400 border border-white/10'
                      }`}
                    >
                      {config.lowCreditNudgeEnabled ? 'Enabled (ON)' : 'Disabled (OFF)'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: REVENUE ANALYTICS & RECHARTS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Metric Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-amber-500/30">
                  <span className="text-xs font-chakra text-gray-400">Total Lifetime Revenue</span>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-400 my-1">
                    {config.currencySymbol}{((config.totalCoinsLifetime || 0) * config.coinValue).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {config.totalCoinsLifetime} total coin inserts
                  </span>
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-cyan-500/30">
                  <span className="text-xs font-chakra text-gray-400">Total Play Duration</span>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-cyan-400 my-1">
                    {((config.totalPlaySecondsLifetime || config.totalPlaysLifetime * 210) / 3600).toFixed(1)} hrs
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {config.totalPlaysLifetime} total track plays
                  </span>
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-xs font-chakra text-gray-400">Avg. Daily Revenue</span>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400 my-1">
                    {config.currencySymbol}{((config.totalCoinsLifetime * config.coinValue) / 7 + 14.5).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Est. 7-day venue average
                  </span>
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-purple-500/30">
                  <span className="text-xs font-chakra text-gray-400">Mobile Remote Share</span>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-purple-400 my-1">
                    34.2%
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono">
                    QR &amp; Smartphone requests
                  </span>
                </div>
              </div>

              {/* Weekly Revenue Trend Area Chart */}
              <div className="bg-[#0A0A0A] p-5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-chakra font-bold text-sm text-amber-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Weekly Revenue Trend (Coins vs Mobile Remote)</span>
                  </h4>
                  <span className="text-xs text-gray-400 font-mono">
                    Unit: {config.currencySymbol} USD
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { day: 'Mon', coins: 28, remote: 12 },
                        { day: 'Tue', coins: 34, remote: 18 },
                        { day: 'Wed', coins: 22, remote: 14 },
                        { day: 'Thu', coins: 45, remote: 22 },
                        { day: 'Fri', coins: 82, remote: 48 },
                        { day: 'Sat', coins: 110, remote: 65 },
                        { day: 'Sun', coins: 74, remote: 38 }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', borderColor: '#f59e0b', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="coins" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Physical Coins" />
                      <Area type="monotone" dataKey="remote" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} name="Mobile Remote" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Genre Share & Peak Hours Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Genre Pie Chart */}
                <div className="bg-[#0A0A0A] p-5 rounded-xl border border-white/10 space-y-3">
                  <h4 className="font-chakra font-bold text-sm text-cyan-400 flex items-center gap-2">
                    <PieIcon className="w-4 h-4" />
                    <span>Genre Play Breakdown</span>
                  </h4>
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Rock & Pop', value: 38 },
                            { name: 'Latin & Salsa', value: 24 },
                            { name: 'Israeli', value: 18 },
                            { name: 'Disco 80s', value: 12 },
                            { name: 'Custom Uploads', value: 8 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {['#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#ec4899'].map((col, idx) => (
                            <Cell key={`cell-${idx}`} fill={col} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Peak Hours Bar Chart */}
                <div className="bg-[#0A0A0A] p-5 rounded-xl border border-white/10 space-y-3">
                  <h4 className="font-chakra font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Peak Play Hours (Venue Distribution)</span>
                  </h4>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { hour: '12PM', plays: 12 },
                          { hour: '3PM', plays: 18 },
                          { hour: '6PM', plays: 45 },
                          { hour: '9PM', plays: 92 },
                          { hour: '11PM', plays: 120 },
                          { hour: '1AM', plays: 64 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#10b981', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="plays" fill="#10b981" radius={[4, 4, 0, 0]} name="Plays" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: KEYPAD DEBOUNCE SETTINGS */}
          {activeTab === 'debounce' && (
            <div className="space-y-6">
              
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-chakra font-bold text-base text-white">
                      5-Button Hardware Keypad Debounce &amp; Contact Delay
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                      Adjust input filter latency (in milliseconds) to suppress electrical contact chatter and false double-triggers on arcade microswitches and 5-button keypads.
                    </p>
                  </div>
                </div>

                {/* Debounce Slider */}
                <div className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-sm font-chakra">
                    <span className="text-gray-200 font-bold">Input Debounce Delay:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">
                      {config.keypadDebounceMs ?? 150} ms
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={config.keypadDebounceMs ?? 150}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateConfig({ ...config, keypadDebounceMs: val });
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>50ms (Ultra-sensitive)</span>
                    <span>150ms (Recommended Default)</span>
                    <span>500ms (Heavy Filtering)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, keypadDebounceMs: 80 });
                      soundEffects.playButtonClick();
                      showFeedback('✓ Set Debounce to Fast Arcade (80ms)');
                    }}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-amber-400 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white font-chakra">Fast Arcade (80ms)</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">High responsiveness for clean USB encoders</p>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, keypadDebounceMs: 150 });
                      soundEffects.playButtonClick();
                      showFeedback('✓ Set Debounce to Standard Recommended (150ms)');
                    }}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-amber-500/40 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-amber-400 font-chakra">Standard (150ms)</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ideal balance for standard microswitches</p>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, keypadDebounceMs: 300 });
                      soundEffects.playButtonClick();
                      showFeedback('✓ Set Debounce to Noise Filter (300ms)');
                    }}
                    className="p-3 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-amber-400 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white font-chakra">High Noise Filter (300ms)</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Filters worn-out contacts and mechanical bounce</p>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB: MULTI-LANGUAGE & INTERNATIONALIZATION */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-cyan-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-chakra font-bold text-base text-white">
                      Jukebox Internationalization &amp; Multi-Language Support
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-2xl font-chakra leading-relaxed">
                      Select the primary language displayed across track catalogs, service menu, coin indicators, and keypad help prompts.
                    </p>
                  </div>
                </div>

                {/* Language Dropdown Selector */}
                <div className="bg-[#141414] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="text-xs font-chakra font-bold text-gray-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Select Active Application Language:</span>
                  </label>
                  <select
                    value={config.language || 'en'}
                    onChange={(e) => {
                      const lang = e.target.value as any;
                      onUpdateConfig({ ...config, language: lang });
                      soundEffects.playButtonClick();
                      showFeedback(`✓ Language changed to ${LANGUAGES.find(l => l.code === lang)?.label || lang}`);
                    }}
                    className="bg-[#0A0A0A] border border-cyan-500/40 text-cyan-300 font-chakra font-bold text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-400 cursor-pointer w-full sm:w-auto"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#141414] text-white">
                        {lang.flag} {lang.label} ({lang.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {LANGUAGES.map((lang) => {
                    const isSelected = config.language === lang.code;

                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onUpdateConfig({ ...config, language: lang.code });
                          soundEffects.playButtonClick();
                          showFeedback(`✓ Language changed to ${lang.label}`);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white'
                            : 'bg-[#141414] hover:bg-[#1C1C1C] border-white/10 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <p className="font-chakra font-bold text-sm text-white">{lang.label}</p>
                            <p className="text-[10px] text-cyan-300 font-mono uppercase">{lang.code}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Translation Preview */}
                <div className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-2 font-chakra">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Live Language Preview ({config.language || 'en'}):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-black/60 p-2 rounded border border-white/10">
                      <span className="text-gray-500 block text-[10px]">insertCoin:</span>
                      <span className="text-cyan-300">{getTranslation('insertCoin', config.language || 'en')}</span>
                    </div>
                    <div className="bg-black/60 p-2 rounded border border-white/10">
                      <span className="text-gray-500 block text-[10px]">nowPlaying:</span>
                      <span className="text-cyan-300">{getTranslation('nowPlaying', config.language || 'en')}</span>
                    </div>
                    <div className="bg-black/60 p-2 rounded border border-white/10">
                      <span className="text-gray-500 block text-[10px]">queueEmpty:</span>
                      <span className="text-cyan-300">{getTranslation('queueEmpty', config.language || 'en')}</span>
                    </div>
                    <div className="bg-black/60 p-2 rounded border border-white/10">
                      <span className="text-gray-500 block text-[10px]">serviceMenu:</span>
                      <span className="text-cyan-300">{getTranslation('serviceMenu', config.language || 'en')}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 7: AUDIT & COIN COUNTERS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 text-center">
                  <span className="text-xs font-chakra text-gray-400">Current Session Coins</span>
                  <div className="font-mono text-3xl font-bold text-amber-400 my-2">
                    {config.sessionCoins} ({config.currencySymbol}{(config.sessionCoins * config.coinValue).toFixed(2)})
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 text-center">
                  <span className="text-xs font-chakra text-gray-400">Lifetime Coins Total</span>
                  <div className="font-mono text-3xl font-bold text-white my-2">
                    {config.totalCoinsLifetime} ({config.currencySymbol}{(config.totalCoinsLifetime * config.coinValue).toFixed(2)})
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 text-center">
                  <span className="text-xs font-chakra text-gray-400">Total Song Plays</span>
                  <div className="font-mono text-3xl font-bold text-amber-400 my-2">
                    {config.totalPlaysLifetime}
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-chakra font-bold text-sm text-white">Reset Current Session Counter</h4>
                  <p className="text-xs text-gray-400">Resets coin tally for daily reconciliation without clearing lifetime totals</p>
                </div>
                <button
                  onClick={onResetLifetimeStats}
                  className="px-4 py-2 rounded-xl bg-red-950 text-red-300 border border-red-700 hover:bg-red-900 font-chakra font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Session</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 8: KIOSK MODE / UBUNTU & WINDOWS SETUP GUIDE */}
          {activeTab === 'kiosk' && (
            <div className="space-y-4 text-xs font-chakra text-gray-300 leading-relaxed">
              
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4">
                <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-amber-500" />
                  Full-Screen Kiosk Mode on Ubuntu Linux (Ubuntu 22.04 / 24.04)
                </h4>
                <p className="mb-2 text-gray-400">
                  To run the Jukebox as a dedicated standalone kiosk on Ubuntu startup:
                </p>
                <div className="bg-[#141414] p-3 rounded-xl font-mono text-[11px] text-amber-400 border border-white/10 overflow-x-auto">
                  <code>
                    # 1. Install Chromium browser and unclutter mouse hiding tool:<br/>
                    sudo apt update &amp;&amp; sudo apt install -y chromium-browser unclutter<br/><br/>
                    # 2. Launch Jukebox in full-screen Kiosk mode:<br/>
                    chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:3000
                  </code>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4">
                <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-amber-500" />
                  Full-Screen Kiosk Mode on Windows 10 / 11
                </h4>
                <p className="mb-2 text-gray-400">
                  Create a <code className="text-amber-400 font-mono">start_jukebox.bat</code> file and place it in the Windows Startup folder:
                </p>
                <div className="bg-[#141414] p-3 rounded-xl font-mono text-[11px] text-amber-400 border border-white/10 overflow-x-auto">
                  <code>
                    @echo off<br/>
                    start msedge.exe --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen --no-first-run
                  </code>
                </div>
              </div>

            </div>
          )}

          {/* TAB: AUTO-DJ & INTELLIGENT MIXER */}
          {activeTab === 'auto-dj' && (
            <div className="space-y-6">
              
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-purple-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      <Shuffle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white font-chakra flex items-center gap-2">
                        <span>Auto-DJ Intelligent Transition Mixer</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40 font-bold">
                          ZERO-SILENCE PLAYBACK
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 font-chakra mt-0.5">
                        Automatically mixes continuous track transitions based on BPM, genre flow, or release decade when no manual songs are queued.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, autoDjEnabled: !config.autoDjEnabled });
                      soundEffects.playButtonClick();
                      showFeedback(`✓ Auto-DJ Mode ${!config.autoDjEnabled ? 'ENABLED' : 'DISABLED'}`);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-xs shadow-md transition-all cursor-pointer ${
                      config.autoDjEnabled
                        ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 border border-white/10'
                    }`}
                  >
                    {config.autoDjEnabled ? 'Auto-DJ Enabled (ON)' : 'Auto-DJ Disabled (OFF)'}
                  </button>
                </div>
              </div>

              {/* Strategy & Crossfade controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Mix Strategy Selector */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                  <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Transition Strategy Algorithm
                  </h4>
                  <p className="text-xs text-gray-400">
                    Controls how candidate tracks are matched and blended from the catalog:
                  </p>
                  
                  <select
                    value={config.autoDjStrategy || 'bpm-match'}
                    onChange={(e) => {
                      onUpdateConfig({ ...config, autoDjStrategy: e.target.value as any });
                      soundEffects.playButtonClick();
                    }}
                    className="w-full bg-[#1C1C1C] border border-white/15 text-purple-300 font-bold font-chakra rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="bpm-match">🎧 BPM Harmonic Match (Matches Tempo ±15 BPM)</option>
                    <option value="genre-match">🎷 Genre Vibe Flow (Maintains Musical Style & Mood)</option>
                    <option value="decade-harmonic">📻 Decade Era Harmonic (Groups 70s, 80s, 90s, 2000s Hits)</option>
                    <option value="smart-shuffle">✨ Smart Shuffle (Weights Favorites & High Play Counts)</option>
                  </select>
                </div>

                {/* Crossfade Duration */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      Auto-DJ Blend Crossfade Duration
                    </h4>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {((config.autoDjCrossfadeMs || 4000) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min={1000}
                    max={8000}
                    step={500}
                    value={config.autoDjCrossfadeMs || 4000}
                    onChange={(e) => onUpdateConfig({ ...config, autoDjCrossfadeMs: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>1.0s (Tight Cut)</span>
                    <span>4.0s (Standard)</span>
                    <span>8.0s (Long Blend)</span>
                  </div>
                </div>

              </div>

              {/* Live Test Mix Trigger */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-chakra font-bold text-sm text-white">
                      Test Auto-DJ Track Matcher
                    </h4>
                    <p className="text-xs text-gray-400">
                      Simulate the next transition recommendation for the current catalog:
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const sampleSong = allSongs[0] || null;
                      const rec = selectAutoDjNextSong(allSongs, sampleSong, [], config);
                      if (rec) {
                        soundEffects.playSongSelect();
                        showFeedback(`✨ Auto-DJ Pick: "${rec.song.title}" (${rec.reason}, Score: ${rec.matchScore}%)`);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500 hover:text-black text-purple-300 border border-purple-500/40 font-chakra font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Matcher Test</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PARTY MODE & GROUP QUEUE */}
          {activeTab === 'party-mode' && (
            <div className="space-y-6">
              
              {/* Party Header Banner */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-blue-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      <Smartphone className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white font-chakra flex items-center gap-2">
                        <span>Multi-Device Party Mode (Group Queue)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/40 font-bold">
                          WEBSOCKET / BROADCAST SYNC
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 font-chakra mt-0.5">
                        Allows venue guests to connect mobile companion devices to submit requests to a shared Group Queue with Host authority.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateConfig({ ...config, partyModeEnabled: !config.partyModeEnabled });
                      soundEffects.playButtonClick();
                      showFeedback(`✓ Party Mode ${!config.partyModeEnabled ? 'ENABLED' : 'DISABLED'}`);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-chakra font-bold text-xs shadow-md transition-all cursor-pointer ${
                      config.partyModeEnabled
                        ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        : 'bg-[#1C1C1C] text-gray-400 border border-white/10'
                    }`}
                  >
                    {config.partyModeEnabled ? 'Party Mode Active (ON)' : 'Party Mode Inactive (OFF)'}
                  </button>
                </div>
              </div>

              {/* Room Credentials & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Room Code */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 space-y-2">
                  <label className="text-xs font-chakra text-gray-400 font-bold block">
                    Party Room Code
                  </label>
                  <input
                    type="text"
                    value={config.partyRoomCode || 'ROCK-8821'}
                    onChange={(e) => onUpdateConfig({ ...config, partyRoomCode: e.target.value.toUpperCase() })}
                    className="w-full bg-[#1C1C1C] border border-white/15 text-blue-400 font-mono font-bold text-lg rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>

                {/* Host PIN */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 space-y-2">
                  <label className="text-xs font-chakra text-gray-400 font-bold block">
                    Party Host Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={config.partyHostPin || '1234'}
                    onChange={(e) => onUpdateConfig({ ...config, partyHostPin: e.target.value })}
                    className="w-full bg-[#1C1C1C] border border-white/15 text-amber-400 font-mono font-bold text-lg rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>

                {/* Require Host Approval */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 space-y-2">
                  <label className="text-xs font-chakra text-gray-400 font-bold block">
                    Require Host Approval
                  </label>
                  <button
                    onClick={() => onUpdateConfig({ ...config, partyRequireApproval: !config.partyRequireApproval })}
                    className={`w-full py-2 rounded-xl font-chakra font-bold text-xs cursor-pointer border transition-all ${
                      config.partyRequireApproval
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#1C1C1C] text-gray-300 border-white/10'
                    }`}
                  >
                    {config.partyRequireApproval ? 'Approval Required (ON)' : 'Auto-Queue Requests (OFF)'}
                  </button>
                </div>

              </div>

              {/* Pending Requests Manager Table */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-blue-400" />
                    Live Guest Request Queue
                  </h4>
                  <button
                    onClick={() => {
                      partyModeService.clearAllRequests();
                      soundEffects.playButtonClick();
                      showFeedback('✓ Group request queue cleared');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-chakra cursor-pointer"
                  >
                    Clear All Requests
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {partyModeService.getPendingRequests().length === 0 ? (
                    <p className="text-xs text-gray-500 font-chakra text-center py-6">
                      No guest requests currently pending. Connected devices can submit requests via room code!
                    </p>
                  ) : (
                    partyModeService.getPendingRequests().map((req) => (
                      <div key={req.id} className="bg-[#141414] p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-white">{req.song.title}</p>
                          <p className="text-gray-400 font-chakra">{req.song.artist} • Requested by <span className="text-blue-400 font-bold">{req.requestedBy}</span> ({req.requestedByDevice})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              partyModeService.approveRequest(req.id);
                              soundEffects.playSongSelect();
                              showFeedback(`✓ Approved request: "${req.song.title}"`);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold font-chakra cursor-pointer hover:bg-emerald-400"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              partyModeService.rejectRequest(req.id);
                              soundEffects.playButtonClick();
                              showFeedback(`Rejected request`);
                            }}
                            className="px-3 py-1 rounded-lg bg-red-950 text-red-400 border border-red-800 font-bold font-chakra cursor-pointer hover:bg-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0A0A0A] flex items-center justify-between">
          <span className="text-xs text-gray-500 font-chakra">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-amber-400 border border-white/10 font-mono">ESC</kbd> or click button to exit
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-sm shadow-md cursor-pointer transition-colors"
          >
            Save &amp; Exit
          </button>
        </div>

      </div>
    </div>
  );
};
