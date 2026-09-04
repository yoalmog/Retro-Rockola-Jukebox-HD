/**
 * Service for Browser Cache Usage, Storage Quota & Song Library Health Diagnostics
 */

import { Song } from '../types/rockola';

export interface StorageHealthReport {
  timestamp: number;
  quotaBytes: number;
  usedBytes: number;
  usagePercentage: number;
  availableBytes: number;
  isPersisted: boolean;
  indexedDbSupported: boolean;
  localStorageUsedBytes: number;
  localStorageAvailable: boolean;
  customSongsCount: number;
  customSongsBytes: number;
  catalogSongsCount: number;
  estimatedCatalogBytes: number;
  readWriteLatencyMs: number;
  healthStatus: 'HEALTHY' | 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  statusNotes: string[];
}

class StorageHealthService {
  /**
   * Retrieves comprehensive storage estimates & library health diagnostics
   */
  public async getStorageHealthReport(
    customSongs: Song[] = [],
    catalogSongsCount: number = 27
  ): Promise<StorageHealthReport> {
    let quotaBytes = 0;
    let usedBytes = 0;
    let isPersisted = false;

    // 1. Query browser storage estimate API
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaBytes = estimate.quota || 0;
        usedBytes = estimate.usage || 0;
      } catch (err) {
        console.warn('Storage estimate error:', err);
      }
    }

    // 2. Query persistence status
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {
        isPersisted = false;
      }
    }

    // 3. Compute LocalStorage usage
    let localStorageUsedBytes = 0;
    let localStorageAvailable = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorageAvailable = true;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const val = localStorage.getItem(key) || '';
            localStorageUsedBytes += (key.length + val.length) * 2; // UTF-16 ~ 2 bytes per char
          }
        }
      }
    } catch {
      localStorageAvailable = false;
    }

    // 4. Compute Custom Songs memory footprint
    let customSongsBytes = 0;
    customSongs.forEach((song) => {
      if (song.audioUrl) customSongsBytes += song.audioUrl.length * 2;
      if (song.coverArt) customSongsBytes += song.coverArt.length * 2;
      customSongsBytes += 500; // JSON metadata
    });

    const estimatedCatalogBytes = catalogSongsCount * 3.5 * 1024 * 1024; // ~3.5MB per track

    // 5. Test Storage R/W Latency & Integrity
    const latencyStart = performance.now();
    let isHealthyRW = true;
    try {
      const testKey = `__health_test_${Date.now()}`;
      const payload = 'ROCKOLA_STORAGE_INTEGRITY_CHECK_OK';
      localStorage.setItem(testKey, payload);
      const retrieved = localStorage.getItem(testKey);
      if (retrieved !== payload) isHealthyRW = false;
      localStorage.removeItem(testKey);
    } catch {
      isHealthyRW = false;
    }
    const readWriteLatencyMs = Math.max(0.1, +(performance.now() - latencyStart).toFixed(2));

    // Calculate usage percentage
    const usagePercentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
    const availableBytes = Math.max(0, quotaBytes - usedBytes);

    // Determine Health Status
    const statusNotes: string[] = [];
    let healthStatus: 'HEALTHY' | 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';

    if (!localStorageAvailable || !isHealthyRW) {
      healthStatus = 'CRITICAL';
      statusNotes.push('R/W integrity fault in browser LocalStorage subsystem');
    } else if (usagePercentage > 90) {
      healthStatus = 'WARNING';
      statusNotes.push('Browser storage quota nearly exhausted (>90%)');
    } else if (readWriteLatencyMs > 45) {
      healthStatus = 'WARNING';
      statusNotes.push(`High storage I/O latency observed (${readWriteLatencyMs}ms)`);
    } else {
      healthStatus = 'HEALTHY';
      statusNotes.push('Storage subsystem fast and operating nominally');
      statusNotes.push(`I/O benchmark: ${readWriteLatencyMs}ms latency`);
    }

    if (isPersisted) {
      statusNotes.push('Persistent Storage lock active (Eviction Protected)');
    }

    return {
      timestamp: Date.now(),
      quotaBytes,
      usedBytes,
      usagePercentage,
      availableBytes,
      isPersisted,
      indexedDbSupported: typeof window !== 'undefined' && 'indexedDB' in window,
      localStorageUsedBytes,
      localStorageAvailable,
      customSongsCount: customSongs.length,
      customSongsBytes,
      catalogSongsCount,
      estimatedCatalogBytes,
      readWriteLatencyMs,
      healthStatus,
      statusNotes
    };
  }

  /**
   * Formats raw bytes into human readable MB/GB
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Request persistent storage permission from browser
   */
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch (err) {
        console.warn('Persist storage request failed:', err);
        return false;
      }
    }
    return false;
  }
}

export const storageHealthService = new StorageHealthService();
