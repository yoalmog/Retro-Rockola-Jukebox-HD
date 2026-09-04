/**
 * Audio Engine for Retro Rockola Jukebox
 * Features:
 * - Dual-channel HTML5 Audio Crossfading (smooth linear/exponential track transitions)
 * - DynamicsCompressor Loudness Normalization (levels volume across disparate tracks)
 * - Real-time Web Audio AnalyserNode (frequency and oscilloscope time-domain data)
 * - Procedural Multi-Track Synthesis fallback for vintage offline rockola playback
 */

import { Song } from '../types/rockola';

export interface AudioEngineCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (err: Error) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onCrossfadeStart?: (fromSongId: string, toSongId: string) => void;
}

interface AudioChannel {
  id: 'A' | 'B';
  element: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  song: Song | null;
  isPlaying: boolean;
}

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private normalizationGain: GainNode | null = null;

  // Dual-channel crossfader state
  private channelA: AudioChannel | null = null;
  private channelB: AudioChannel | null = null;
  private activeChannelId: 'A' | 'B' = 'A';
  private isCrossfading: boolean = false;

  // Stereo Width & Panning Balance Nodes
  private pannerNode: StereoPannerNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private gainLL: GainNode | null = null;
  private gainLR: GainNode | null = null;
  private gainRL: GainNode | null = null;
  private gainRR: GainNode | null = null;

  // Settings
  private volume: number = 0.85;
  private loudnessNormalizationEnabled: boolean = true;
  private crossfadeEnabled: boolean = true;
  private crossfadeDuration: number = 3.0; // seconds
  private stereoBalance: number = 0; // -100 (Left) to +100 (Right)
  private stereoWidth: number = 100; // 0% (Mono) to 200% (Wide)

  // System Health & Audio Diagnostics
  private underrunCount: number = 0;

  // Video playback support
  private videoElement: HTMLVideoElement | null = null;
  private isVideoTrack: boolean = false;

  // Procedural synth state
  private isSynthesizing: boolean = false;
  private synthIntervalId: number | null = null;
  private synthDuration: number = 180;
  private currentProgressTime: number = 0;

  private isPlaying: boolean = false;
  private currentSong: Song | null = null;
  private callbacks: AudioEngineCallbacks = {};
  private timerInterval: number | null = null;

  public init(callbacks?: AudioEngineCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public attachVideoElement(videoEl: HTMLVideoElement | null) {
    this.videoElement = videoEl;
    if (this.videoElement) {
      this.videoElement.volume = this.volume;
      if (this.isVideoTrack && this.currentSong) {
        const vUrl = this.currentSong.videoUrl || this.currentSong.audioUrl;
        if (vUrl && this.videoElement.src !== vUrl) {
          this.videoElement.src = vUrl;
        }
        if (this.isPlaying) {
          this.videoElement.play().catch(err => {
            console.warn('Video auto-play notice on attach:', err);
          });
        }
      }
    }
  }

  public getIsVideoTrack(): boolean {
    return this.isVideoTrack;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // 1. Analyser Node for Spectrum & Oscilloscope
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.82;

        // 2. Dynamics Compressor for Loudness Normalization
        this.compressorNode = this.audioCtx.createDynamicsCompressor();
        this.compressorNode.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
        this.compressorNode.knee.setValueAtTime(30, this.audioCtx.currentTime);
        this.compressorNode.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressorNode.release.setValueAtTime(0.25, this.audioCtx.currentTime);

        // 3. Normalization makeup gain stage
        this.normalizationGain = this.audioCtx.createGain();
        this.normalizationGain.gain.setValueAtTime(
          this.loudnessNormalizationEnabled ? 1.25 : 1.0,
          this.audioCtx.currentTime
        );

        // 3.5 Stereo Width Processing Matrix (Splitter -> 4 Gains -> Merger)
        try {
          this.splitterNode = this.audioCtx.createChannelSplitter(2);
          this.mergerNode = this.audioCtx.createChannelMerger(2);
          this.gainLL = this.audioCtx.createGain();
          this.gainLR = this.audioCtx.createGain();
          this.gainRL = this.audioCtx.createGain();
          this.gainRR = this.audioCtx.createGain();

          this.splitterNode.connect(this.gainLL, 0);
          this.splitterNode.connect(this.gainLR, 0);
          this.splitterNode.connect(this.gainRL, 1);
          this.splitterNode.connect(this.gainRR, 1);

          this.gainLL.connect(this.mergerNode, 0, 0);
          this.gainLR.connect(this.mergerNode, 0, 1);
          this.gainRL.connect(this.mergerNode, 0, 0);
          this.gainRR.connect(this.mergerNode, 0, 1);
        } catch (err) {
          console.warn('Stereo width matrix creation warning:', err);
        }

        // 3.6 Stereo Panner Node for Channel Balance (-1.0 to +1.0)
        if (typeof this.audioCtx.createStereoPanner === 'function') {
          try {
            this.pannerNode = this.audioCtx.createStereoPanner();
            this.pannerNode.pan.setValueAtTime(this.stereoBalance / 100, this.audioCtx.currentTime);
          } catch (err) {
            console.warn('Stereo panner setup warning:', err);
          }
        }

        // 4. Master Volume Gain
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

        // Chain: Compressor -> Normalization Gain -> Width Splitter/Merger -> Panner -> Master Gain -> Analyser -> Output
        this.compressorNode.connect(this.normalizationGain);
        
        if (this.splitterNode && this.mergerNode) {
          this.normalizationGain.connect(this.splitterNode);
          if (this.pannerNode) {
            this.mergerNode.connect(this.pannerNode);
            this.pannerNode.connect(this.masterGain);
          } else {
            this.mergerNode.connect(this.masterGain);
          }
        } else if (this.pannerNode) {
          this.normalizationGain.connect(this.pannerNode);
          this.pannerNode.connect(this.masterGain);
        } else {
          this.normalizationGain.connect(this.masterGain);
        }

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        // Apply initial matrix gain values
        this.applyStereoWidthMatrix(this.stereoWidth);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private setupChannels() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (!this.channelA) {
      const audioA = new Audio();
      audioA.crossOrigin = 'anonymous';
      audioA.preload = 'auto';

      let gainNodeA: GainNode | null = null;
      let sourceNodeA: MediaElementAudioSourceNode | null = null;

      try {
        gainNodeA = ctx.createGain();
        gainNodeA.gain.setValueAtTime(1.0, ctx.currentTime);
        if (this.compressorNode) {
          gainNodeA.connect(this.compressorNode);
        }

        sourceNodeA = ctx.createMediaElementSource(audioA);
        sourceNodeA.connect(gainNodeA);
      } catch (e) {
        console.warn('Channel A media source setup warning:', e);
      }

      this.channelA = {
        id: 'A',
        element: audioA,
        sourceNode: sourceNodeA,
        gainNode: gainNodeA,
        song: null,
        isPlaying: false
      };

      this.bindAudioEvents(this.channelA);
    }

    if (!this.channelB) {
      const audioB = new Audio();
      audioB.crossOrigin = 'anonymous';
      audioB.preload = 'auto';

      let gainNodeB: GainNode | null = null;
      let sourceNodeB: MediaElementAudioSourceNode | null = null;

      try {
        gainNodeB = ctx.createGain();
        gainNodeB.gain.setValueAtTime(0.0, ctx.currentTime);
        if (this.compressorNode) {
          gainNodeB.connect(this.compressorNode);
        }

        sourceNodeB = ctx.createMediaElementSource(audioB);
        sourceNodeB.connect(gainNodeB);
      } catch (e) {
        console.warn('Channel B media source setup warning:', e);
      }

      this.channelB = {
        id: 'B',
        element: audioB,
        sourceNode: sourceNodeB,
        gainNode: gainNodeB,
        song: null,
        isPlaying: false
      };

      this.bindAudioEvents(this.channelB);
    }
  }

  private bindAudioEvents(channel: AudioChannel) {
    const audio = channel.element;

    audio.addEventListener('timeupdate', () => {
      if (this.activeChannelId === channel.id && !this.isSynthesizing) {
        const current = audio.currentTime;
        const dur = audio.duration || channel.song?.duration || 180;
        this.callbacks.onTimeUpdate?.(current, dur);
      }
    });

    audio.addEventListener('ended', () => {
      channel.isPlaying = false;
      if (this.activeChannelId === channel.id && !this.isCrossfading) {
        this.isPlaying = false;
        this.callbacks.onPlayStateChange?.(false);
        this.callbacks.onEnded?.();
      }
    });

    audio.addEventListener('waiting', () => {
      this.underrunCount++;
    });

    audio.addEventListener('stalled', () => {
      this.underrunCount++;
    });

    audio.addEventListener('error', (e) => {
      this.underrunCount++;
      console.warn(`Channel ${channel.id} audio error, falling back to synthesis:`, e);
      if (this.activeChannelId === channel.id && channel.song) {
        this.playSynthesizedTrack(channel.song);
      }
    });
  }

  // ============================================
  // VOLUME, BALANCE & STEREO WIDTH CONTROLS
  // ============================================

  public setBalance(pan: number) {
    this.stereoBalance = Math.max(-100, Math.min(100, pan));
    const ctx = this.getAudioContext();
    if (this.pannerNode && ctx) {
      try {
        this.pannerNode.pan.setTargetAtTime(this.stereoBalance / 100, ctx.currentTime, 0.05);
      } catch (e) {
        console.warn('Set balance error:', e);
      }
    }
  }

  public getBalance(): number {
    return this.stereoBalance;
  }

  public setStereoWidth(widthPercent: number) {
    this.stereoWidth = Math.max(0, Math.min(200, widthPercent));
    this.applyStereoWidthMatrix(this.stereoWidth);
  }

  public getStereoWidth(): number {
    return this.stereoWidth;
  }

  private applyStereoWidthMatrix(widthPercent: number) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.gainLL || !this.gainLR || !this.gainRL || !this.gainRR) return;

    const w = widthPercent / 100; // 0 to 2
    const directGain = 0.5 * (1 + w);
    const crossGain = 0.5 * (1 - w);

    const t = ctx.currentTime;
    this.gainLL.gain.setValueAtTime(directGain, t);
    this.gainRR.gain.setValueAtTime(directGain, t);
    this.gainLR.gain.setValueAtTime(crossGain, t);
    this.gainRL.gain.setValueAtTime(crossGain, t);
  }

  public getSystemHealthMetrics() {
    const ctx = this.audioCtx;
    return {
      underrunCount: this.underrunCount,
      contextState: ctx ? ctx.state : 'uninitialized',
      sampleRate: ctx ? ctx.sampleRate : 48000,
      baseLatencyMs: ctx && 'baseLatency' in ctx ? Math.round((ctx as any).baseLatency * 1000 * 10) / 10 : 5.3,
      outputLatencyMs: ctx && 'outputLatency' in ctx ? Math.round((ctx as any).outputLatency * 1000 * 10) / 10 : 12.5,
      activeChannel: this.activeChannelId,
      isPlaying: this.isPlaying,
      isSynthesizing: this.isSynthesizing
    };
  }

  public resetUnderrunCount() {
    this.underrunCount = 0;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    const ctx = this.getAudioContext();
    if (this.masterGain && ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    }
    if (this.channelA?.element) this.channelA.element.volume = this.volume;
    if (this.channelB?.element) this.channelB.element.volume = this.volume;
    if (this.videoElement) this.videoElement.volume = this.volume;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setLoudnessNormalization(enabled: boolean) {
    this.loudnessNormalizationEnabled = enabled;
    const ctx = this.getAudioContext();
    if (this.normalizationGain && ctx) {
      this.normalizationGain.gain.setTargetAtTime(
        enabled ? 1.25 : 1.0,
        ctx.currentTime,
        0.1
      );
    }
  }

  public getLoudnessNormalization(): boolean {
    return this.loudnessNormalizationEnabled;
  }

  public setCrossfadeEnabled(enabled: boolean) {
    this.crossfadeEnabled = enabled;
  }

  public setCrossfadeDuration(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(10, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  // ============================================
  // PLAYBACK & CROSSFADE LOGIC
  // ============================================

  public playSong(song: Song) {
    this.setupChannels();
    this.currentSong = song;

    const isVideo = song.mediaType === 'video' || Boolean(song.videoUrl);
    if (isVideo) {
      this.isVideoTrack = true;
      this.stopAudioElements();
      if (this.synthIntervalId) {
        clearInterval(this.synthIntervalId);
        this.synthIntervalId = null;
      }
      this.isSynthesizing = false;
      this.isPlaying = true;
      this.callbacks.onPlayStateChange?.(true);

      if (this.videoElement) {
        const vUrl = song.videoUrl || song.audioUrl;
        if (this.videoElement.src !== vUrl) {
          this.videoElement.src = vUrl;
        }
        this.videoElement.currentTime = 0;
        this.videoElement.volume = this.volume;
        this.videoElement.play().catch(err => {
          console.warn('Video auto-play notice:', err);
        });
      }
      return;
    }

    // Standard audio track
    this.isVideoTrack = false;
    if (this.videoElement) {
      this.videoElement.pause();
    }

    const isCustom = song.audioUrl && (
      song.audioUrl.startsWith('http') ||
      song.audioUrl.startsWith('blob:') ||
      song.audioUrl.startsWith('data:')
    );

    if (isCustom) {
      if (this.isPlaying && this.crossfadeEnabled && this.crossfadeDuration > 0) {
        this.crossfadeToSong(song);
      } else {
        this.playDirectSong(song);
      }
    } else {
      this.stop();
      this.isPlaying = true;
      this.callbacks.onPlayStateChange?.(true);
      this.playSynthesizedTrack(song);
    }
  }

  private playDirectSong(song: Song) {
    this.stopAudioElements();
    this.isSynthesizing = false;

    const activeChannel = this.activeChannelId === 'A' ? this.channelA : this.channelB;
    if (!activeChannel) return;

    activeChannel.song = song;
    activeChannel.element.src = song.audioUrl;
    activeChannel.element.currentTime = 0;
    activeChannel.element.volume = this.volume;

    const ctx = this.getAudioContext();
    if (activeChannel.gainNode && ctx) {
      activeChannel.gainNode.gain.cancelScheduledValues(ctx.currentTime);
      activeChannel.gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
    }

    this.isPlaying = true;
    activeChannel.isPlaying = true;
    this.callbacks.onPlayStateChange?.(true);

    activeChannel.element.play().catch((err) => {
      console.warn('Direct audio playback notice:', err);
    });
  }

  public crossfadeToSong(nextSong: Song, customDuration?: number) {
    this.setupChannels();
    const duration = customDuration ?? this.crossfadeDuration;
    const ctx = this.getAudioContext();

    const currentChannel = this.activeChannelId === 'A' ? this.channelA : this.channelB;
    const nextChannel = this.activeChannelId === 'A' ? this.channelB : this.channelA;

    if (!currentChannel || !nextChannel || !ctx) {
      this.playDirectSong(nextSong);
      return;
    }

    this.isCrossfading = true;
    this.callbacks.onCrossfadeStart?.(currentChannel.song?.id || '', nextSong.id);

    // Prepare incoming channel
    nextChannel.song = nextSong;
    nextChannel.element.src = nextSong.audioUrl;
    nextChannel.element.currentTime = 0;
    nextChannel.element.volume = this.volume;

    const now = ctx.currentTime;

    // Reset scheduled gain values
    if (currentChannel.gainNode) {
      currentChannel.gainNode.gain.cancelScheduledValues(now);
      currentChannel.gainNode.gain.setValueAtTime(currentChannel.gainNode.gain.value || 1.0, now);
      currentChannel.gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
    }

    if (nextChannel.gainNode) {
      nextChannel.gainNode.gain.cancelScheduledValues(now);
      nextChannel.gainNode.gain.setValueAtTime(0.001, now);
      nextChannel.gainNode.gain.linearRampToValueAtTime(1.0, now + duration);
    }

    nextChannel.element.play().catch((err) => {
      console.warn('Crossfade incoming track play notice:', err);
    });

    // Flip active channel ID
    this.activeChannelId = nextChannel.id;
    this.isPlaying = true;
    nextChannel.isPlaying = true;
    this.callbacks.onPlayStateChange?.(true);

    // Schedule cleanup after crossfade finishes
    setTimeout(() => {
      currentChannel.element.pause();
      currentChannel.element.currentTime = 0;
      currentChannel.isPlaying = false;
      this.isCrossfading = false;
    }, duration * 1000 + 100);
  }

  private stopAudioElements() {
    if (this.channelA?.element) {
      this.channelA.element.pause();
      this.channelA.element.currentTime = 0;
      this.channelA.isPlaying = false;
    }
    if (this.channelB?.element) {
      this.channelB.element.pause();
      this.channelB.element.currentTime = 0;
      this.channelB.isPlaying = false;
    }
    this.isCrossfading = false;
  }

  public pause() {
    this.isPlaying = false;
    this.callbacks.onPlayStateChange?.(false);

    if (this.isVideoTrack && this.videoElement) {
      this.videoElement.pause();
    }

    if (this.channelA?.element && this.channelA.isPlaying) {
      this.channelA.element.pause();
    }
    if (this.channelB?.element && this.channelB.isPlaying) {
      this.channelB.element.pause();
    }

    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  public resume() {
    if (this.isVideoTrack && this.videoElement) {
      this.isPlaying = true;
      this.callbacks.onPlayStateChange?.(true);
      this.videoElement.play().catch(() => {});
      return;
    }

    const activeChannel = this.activeChannelId === 'A' ? this.channelA : this.channelB;

    if (activeChannel && activeChannel.element.src && !this.isSynthesizing) {
      this.isPlaying = true;
      activeChannel.isPlaying = true;
      this.callbacks.onPlayStateChange?.(true);
      activeChannel.element.play().catch(() => {});
    } else if (this.isSynthesizing && this.currentSong) {
      this.isPlaying = true;
      this.callbacks.onPlayStateChange?.(true);
      this.startProceduralMusicLoop(this.currentSong.genre);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.isSynthesizing = false;
    this.callbacks.onPlayStateChange?.(false);

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
    }

    this.stopAudioElements();

    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.currentProgressTime = 0;
  }

  public seek(seconds: number) {
    if (this.isVideoTrack && this.videoElement) {
      this.videoElement.currentTime = seconds;
    }
    const activeChannel = this.activeChannelId === 'A' ? this.channelA : this.channelB;
    if (activeChannel && activeChannel.element) {
      activeChannel.element.currentTime = seconds;
    }
    this.currentProgressTime = seconds;
    this.callbacks.onTimeUpdate?.(this.currentProgressTime, this.synthDuration);
  }

  // ============================================
  // PROCEDURAL SYNTHESIS ENGINE
  // ============================================

  private playSynthesizedTrack(song: Song) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.analyser) return;

    this.isSynthesizing = true;
    this.synthDuration = song.duration || 180;
    this.currentProgressTime = 0;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.isSynthesizing) return;
      this.currentProgressTime += 0.25;
      this.callbacks.onTimeUpdate?.(this.currentProgressTime, this.synthDuration);

      if (this.currentProgressTime >= this.synthDuration) {
        this.stop();
        this.callbacks.onEnded?.();
      }
    }, 250);

    this.startProceduralMusicLoop(song.genre);
  }

  private startProceduralMusicLoop(genre: string) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.analyser) return;

    let step = 0;
    let bpm = 124;
    let scale: number[] = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];

    if (genre === 'rock') {
      bpm = 128;
      scale = [146.83, 164.81, 174.61, 196.0, 220.0, 261.63, 293.66];
    } else if (genre === 'israeli') {
      bpm = 118;
      scale = [220, 233.08, 277.18, 293.66, 329.63, 349.23, 415.3];
    } else if (genre === 'latin') {
      bpm = 104;
      scale = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
    } else if (genre === 'retro80s') {
      bpm = 132;
      scale = [130.81, 164.81, 196.0, 220.0, 261.63, 329.63, 392.0];
    } else if (genre === 'disco') {
      bpm = 120;
      scale = [174.61, 220.0, 261.63, 293.66, 349.23, 440.0, 523.25];
    }

    const intervalMs = (60 / bpm / 4) * 1000;

    if (this.synthIntervalId) clearInterval(this.synthIntervalId);

    this.synthIntervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.isSynthesizing) return;

      const beat = step % 16;

      // Bass drum on 1, 5, 9, 13
      if (beat % 4 === 0) {
        this.triggerSynthKick(ctx);
      }

      // Snare on 4, 12
      if (beat === 4 || beat === 12) {
        this.triggerSynthSnare(ctx);
      }

      // Melodic notes
      if (beat % 2 === 0) {
        const noteFreq = scale[(step + (beat % 3)) % scale.length];
        this.triggerSynthLead(ctx, noteFreq);
      }

      step++;
    }, intervalMs);
  }

  private triggerSynthKick(ctx: AudioContext) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.7 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      if (this.compressorNode) {
        osc.connect(gain);
        gain.connect(this.compressorNode);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext closed or inactive
    }
  }

  private triggerSynthSnare(ctx: AudioContext) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      if (this.compressorNode) {
        osc.connect(gain);
        gain.connect(this.compressorNode);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.11);
    } catch {
      // safe catch
    }
  }

  private triggerSynthLead(ctx: AudioContext, freq: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.18 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      if (this.compressorNode) {
        osc.connect(gain);
        gain.connect(this.compressorNode);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // safe catch
    }
  }

  // ============================================
  // REAL-TIME VISUALIZER DATA HOOKS
  // ============================================

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.sin(Date.now() * 0.003 + i * 0.2) * 6 + 8);
      }
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngineService();
export const audioEngineService = audioEngine;
