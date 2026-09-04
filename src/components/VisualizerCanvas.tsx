import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { SkinType } from '../types/rockola';
import { getTheme } from '../utils/themeStyles';

interface VisualizerCanvasProps {
  skin: SkinType;
  isPlaying: boolean;
  mode?: 'bars' | 'wave' | 'vu-meters' | 'bubbles';
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  skin,
  isPlaying,
  mode = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'wave' | 'vu-meters' | 'bubbles'>(mode);

  useEffect(() => {
    setVisualMode(mode);
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const freqData = new Uint8Array(64);
    const timeData = new Uint8Array(128);

    // Particles for bubbler / sparks
    const bubbles = Array.from({ length: 24 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.005 + Math.random() * 0.015,
      size: 2 + Math.random() * 4,
      hue: Math.random() * 60 + 20
    }));

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      audioEngine.getFrequencyData(freqData);
      audioEngine.getTimeDomainData(timeData);

      if (visualMode === 'bars') {
        renderBars(ctx, width, height, freqData, skin);
      } else if (visualMode === 'wave') {
        renderWave(ctx, width, height, timeData, skin);
      } else if (visualMode === 'vu-meters') {
        renderVUMeters(ctx, width, height, freqData, skin);
      } else if (visualMode === 'bubbles') {
        renderBubbles(ctx, width, height, freqData, bubbles, skin);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [visualMode, skin, isPlaying]);

  return (
    <div className="w-full h-full relative group">
      <canvas
        ref={canvasRef}
        width={360}
        height={80}
        className="w-full h-full rounded-lg bg-black/50 border border-slate-700/50 shadow-inner"
      />
      {/* Mode quick toggle button */}
      <button
        onClick={() => {
          const modes: ('bars' | 'wave' | 'vu-meters' | 'bubbles')[] = ['bars', 'vu-meters', 'wave', 'bubbles'];
          const nextIdx = (modes.indexOf(visualMode) + 1) % modes.length;
          setVisualMode(modes[nextIdx]);
        }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-amber-300 border border-amber-500/30 hover:bg-black font-arcade cursor-pointer"
        title="Change Visualizer Mode"
      >
        {visualMode.toUpperCase()}
      </button>
    </div>
  );
};

// Render Functions
function getThemeColors(skin: SkinType): { start: string; mid: string; peak: string } {
  const theme = getTheme(skin);
  if (skin === 'rockolas-peru' || skin === 'classic-wood' || skin === 'wild-west') {
    return { start: '#059669', mid: '#f59e0b', peak: '#ef4444' };
  } else if (skin === 'neon-arcade') {
    return { start: '#06b6d4', mid: '#ec4899', peak: '#a855f7' };
  } else if (skin === 'salsa-latino') {
    return { start: '#10b981', mid: '#f59e0b', peak: '#f97316' };
  } else if (skin === 'heavy-rock') {
    return { start: '#dc2626', mid: '#f97316', peak: '#facc15' };
  } else if (skin === 'vintage-vinyl') {
    return { start: '#d97706', mid: '#f59e0b', peak: '#fef08a' };
  } else if (theme.customColors?.primaryHex) {
    return {
      start: theme.customColors.primaryHex,
      mid: theme.customColors.secondaryHex || '#3b82f6',
      peak: '#ffffff'
    };
  } else {
    return { start: '#2563eb', mid: '#06b6d4', peak: '#38bdf8' };
  }
}

function renderBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  skin: SkinType
) {
  const barCount = 32;
  const barWidth = (width / barCount) - 2;
  const colors = getThemeColors(skin);

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * freqData.length);
    const value = freqData[dataIndex] || 0;
    const percent = value / 255;
    const barHeight = Math.max(3, percent * (height - 8));
    const x = i * (barWidth + 2) + 1;
    const y = height - barHeight - 4;

    // Gradient colors matching active theme
    let gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, colors.start);
    gradient.addColorStop(0.6, colors.mid);
    gradient.addColorStop(1.0, colors.peak);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Peak floating LED cap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, Math.max(2, y - 2), barWidth, 1.5);
  }
}

function renderWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeData: Uint8Array,
  skin: SkinType
) {
  ctx.beginPath();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = skin === 'neon-arcade' ? '#06b6d4' : '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.shadowColor = ctx.strokeStyle;

  const sliceWidth = width / timeData.length;
  let x = 0;

  for (let i = 0; i < timeData.length; i++) {
    const v = timeData[i] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

function renderVUMeters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  skin: SkinType
) {
  // Dual Left / Right Analog Needle Meters
  const meterWidth = width / 2 - 4;
  const avgLeft = freqData.slice(0, 16).reduce((a, b) => a + b, 0) / (16 * 255);
  const avgRight = freqData.slice(16, 32).reduce((a, b) => a + b, 0) / (16 * 255);

  [avgLeft, avgRight].forEach((val, idx) => {
    const startX = idx * (meterWidth + 8) + 2;
    const centerX = startX + meterWidth / 2;
    const centerY = height - 4;
    const radius = height * 0.85;

    // Dial background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Scale ticks
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.15, Math.PI * 1.6, false);
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.6, Math.PI * 1.85, false);
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Needle Angle
    const angle = Math.PI * 1.15 + val * (Math.PI * 0.7);
    const needleX = centerX + Math.cos(angle) * radius;
    const needleY = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    // Pivot cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Channel label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Orbitron, sans-serif';
    ctx.fillText(idx === 0 ? 'L' : 'R', startX + 6, height - 8);
  });
}

function renderBubbles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  bubbles: { x: number; y: number; speed: number; size: number; hue: number }[],
  skin: SkinType
) {
  const energy = freqData.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);

  bubbles.forEach((b) => {
    b.y -= b.speed * (1 + energy * 2);
    if (b.y < 0) {
      b.y = 1;
      b.x = Math.random();
    }

    const bx = b.x * width;
    const by = b.y * height;
    const bsize = b.size * (1 + energy * 0.8);

    ctx.beginPath();
    ctx.arc(bx, by, bsize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${b.hue + energy * 40}, 90%, 60%, 0.7)`;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
}
