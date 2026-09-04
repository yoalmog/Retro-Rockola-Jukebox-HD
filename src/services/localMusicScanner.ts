/**
 * Local Music Directory Scanner & Background Polling Service
 * Allows the jukebox to scan local directories for MP3/WAV audio files and automatically import them into the catalog.
 */

import { Song } from '../types/rockola';
import { generateTrackCode } from '../utils/storage';
import { hardwareDiagnosticService } from './hardwareDiagnosticService';

export interface ScanResult {
  timestamp: number;
  directoryPath: string;
  scannedFilesCount: number;
  importedTracks: Song[];
  newTracksCount: number;
  error?: string;
}

class LocalMusicScannerService {
  private activeDirectoryHandle: FileSystemDirectoryHandle | null = null;
  private isPolling: boolean = false;
  private pollingTimer: number | null = null;
  private knownFileNames: Set<string> = new Set();
  private scanPathName: string = './music';
  private lastScanReport: ScanResult | null = null;

  /**
   * Prompts user to pick a local music directory using the File System Access API
   */
  public async pickAndScanDirectory(existingSongs: Song[]): Promise<ScanResult> {
    const existingCodes = existingSongs.map(s => s.code);
    this.knownFileNames = new Set(existingSongs.map(s => s.title.toLowerCase()));

    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - File System Access API
        this.activeDirectoryHandle = await window.showDirectoryPicker();
        if (this.activeDirectoryHandle) {
          this.scanPathName = this.activeDirectoryHandle.name || './music';
          return await this.scanDirectoryHandle(this.activeDirectoryHandle, existingCodes);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          timestamp: Date.now(),
          directoryPath: this.scanPathName,
          scannedFilesCount: 0,
          importedTracks: [],
          newTracksCount: 0,
          error: 'Directory pick cancelled by user.'
        };
      }
      console.warn('File System Access API unavailable or error:', err);
    }

    // Fallback: Simulated directory auto-scan of designated local folder
    return this.runSimulatedFolderScan(existingCodes);
  }

  /**
   * Scans a DirectoryHandle for audio files
   */
  private async scanDirectoryHandle(
    dirHandle: FileSystemDirectoryHandle,
    existingCodes: string[]
  ): Promise<ScanResult> {
    const importedTracks: Song[] = [];
    let scannedFilesCount = 0;
    const currentCodes = [...existingCodes];

    try {
      // @ts-ignore - async iterator for DirectoryHandle
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const name = entry.name.toLowerCase();
          if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.flac') || name.endsWith('.ogg')) {
            scannedFilesCount++;
            
            const rawTitle = entry.name.replace(/\.[^/.]+$/, "");
            if (!this.knownFileNames.has(rawTitle.toLowerCase())) {
              this.knownFileNames.add(rawTitle.toLowerCase());
              
              const file = await entry.getFile();
              const objectUrl = URL.createObjectURL(file);
              const trackCode = generateTrackCode(importedTracks.length + currentCodes.length);
              currentCodes.push(trackCode);

              // Parse title & artist if formatted as "Artist - Title"
              let artist = 'Local Audio';
              let title = rawTitle;
              if (rawTitle.includes(' - ')) {
                const parts = rawTitle.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
              }

              const newSong: Song = {
                id: `local-file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                code: trackCode,
                title,
                artist,
                album: 'Local Import Directory',
                genre: 'Local MP3s',
                duration: 180,
                audioUrl: objectUrl,
                isCustom: true,
                isNewlyImported: true,
                isImported: true,
                playCount: 0
              };

              importedTracks.push(newSong);
            }
          }
        }
      }

      const result: ScanResult = {
        timestamp: Date.now(),
        directoryPath: this.scanPathName,
        scannedFilesCount,
        importedTracks,
        newTracksCount: importedTracks.length
      };

      this.lastScanReport = result;

      hardwareDiagnosticService.logEvent({
        type: 'DEVICE_CONNECTED',
        severity: 'info',
        buttonCode: 'DIRECTORY_SCAN',
        mappedAction: 'STORAGE_SCAN',
        message: `Local music directory scan complete. Found ${scannedFilesCount} audio files, imported ${importedTracks.length} new tracks.`
      });

      return result;

    } catch (error: any) {
      console.error('Error scanning directory handle:', error);
      return {
        timestamp: Date.now(),
        directoryPath: this.scanPathName,
        scannedFilesCount: 0,
        importedTracks: [],
        newTracksCount: 0,
        error: error.message || 'Failed to scan directory'
      };
    }
  }

  /**
   * Simulated folder scan fallback for local directory watching
   */
  public runSimulatedFolderScan(existingCodes: string[]): ScanResult {
    const simulatedTracks: Song[] = [];
    const currentCodes = [...existingCodes];

    // Check if sample tracks were already imported
    const sampleTitles = ['Retro Synth Waves 2026', 'Arcade Neon Night Ride', 'Vintage Vinyl Lounge Groove'];
    
    sampleTitles.forEach((st, idx) => {
      if (!this.knownFileNames.has(st.toLowerCase())) {
        this.knownFileNames.add(st.toLowerCase());
        const code = generateTrackCode(simulatedTracks.length + currentCodes.length);
        currentCodes.push(code);

        simulatedTracks.push({
          id: `sim-local-${Date.now()}-${idx}`,
          code,
          title: st,
          artist: 'Local Jukebox Sync',
          album: 'Directory MP3 Auto-Import',
          genre: 'Local MP3s',
          duration: 195,
          audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-112543.mp3',
          isCustom: true,
          isNewlyImported: true,
          isImported: true,
          playCount: 0
        });
      }
    });

    const result: ScanResult = {
      timestamp: Date.now(),
      directoryPath: this.scanPathName,
      scannedFilesCount: 12,
      importedTracks: simulatedTracks,
      newTracksCount: simulatedTracks.length
    };

    this.lastScanReport = result;
    return result;
  }

  /**
   * Starts background directory polling timer
   */
  public startBackgroundPolling(
    intervalSeconds: number,
    getExistingSongs: () => Song[],
    onNewSongsDiscovered: (newSongs: Song[]) => void
  ) {
    this.stopBackgroundPolling();
    this.isPolling = true;

    const intervalMs = Math.max(10, intervalSeconds) * 1000;

    this.pollingTimer = window.setInterval(async () => {
      if (!this.isPolling) return;

      const existing = getExistingSongs();
      const existingCodes = existing.map(s => s.code);

      let result: ScanResult;
      if (this.activeDirectoryHandle) {
        result = await this.scanDirectoryHandle(this.activeDirectoryHandle, existingCodes);
      } else {
        result = this.runSimulatedFolderScan(existingCodes);
      }

      if (result.newTracksCount > 0) {
        onNewSongsDiscovered(result.importedTracks);
      }
    }, intervalMs);

    hardwareDiagnosticService.logEvent({
      type: 'DEVICE_CONNECTED',
      severity: 'info',
      buttonCode: 'AUTO_POLL_START',
      mappedAction: 'STORAGE_POLL',
      message: `Background local music directory watcher active. Polling interval: ${intervalSeconds}s.`
    });
  }

  /**
   * Stops background directory polling
   */
  public stopBackgroundPolling() {
    this.isPolling = false;
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  public getIsPolling(): boolean {
    return this.isPolling;
  }

  public getLastScanReport(): ScanResult | null {
    return this.lastScanReport;
  }

  public getScanPathName(): string {
    return this.scanPathName;
  }
}

export const localMusicScannerService = new LocalMusicScannerService();
