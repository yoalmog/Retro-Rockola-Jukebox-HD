import React, { useState, useRef } from 'react';
import { RockolaConfig, MachineBranding, SkinType } from '../types/rockola';
import { THEMES, getTheme, generateCustomTheme, ThemeDefinition } from '../utils/themeStyles';
import { soundEffects } from '../services/soundEffects';
import { 
  Palette, Image, Sparkles, X, Check, Upload, Trash2, 
  Type, Sliders, Monitor, Eye, ShieldCheck, Crown, Code, Copy, Disc, Zap
} from 'lucide-react';

interface OwnerCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RockolaConfig;
  onUpdateConfig: (newConfig: RockolaConfig) => void;
}

export const OwnerCustomizationModal: React.FC<OwnerCustomizationModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const currentTheme = getTheme(config.skin, config.customTheme);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [branding, setBranding] = useState<MachineBranding>(config.branding || {
    title: 'ROCKOLA 24',
    subtitle: 'Legacy Hardware Interface',
    logoShape: 'circle',
    marqueeCustomText: '★ ROCKOLA DIGITAL JUKEBOX HD • 5-BUTTON LEGACY HARDWARE • UBUNTU 24.04 & WINDOWS ★',
    themePreset: config.skin,
    ownerName: 'JUKEBOX OPERATOR'
  });

  const [selectedSkin, setSelectedSkin] = useState<SkinType>(config.skin);

  // Skin Customizer Hex State
  const [primaryHex, setPrimaryHex] = useState(config.customSkinColors?.primaryHex || '#06b6d4');
  const [secondaryHex, setSecondaryHex] = useState(config.customSkinColors?.secondaryHex || '#a855f7');
  const [bgHex, setBgHex] = useState(config.customSkinColors?.bgHex || '#080b18');
  const [tickerHex, setTickerHex] = useState(config.customSkinColors?.tickerHex || '#22d3ee');
  const [customThemeName, setCustomThemeName] = useState(config.customSkinColors?.themeName || 'My Venue Custom Skin');
  const [showCssCode, setShowCssCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const generatedCustomTheme = generateCustomTheme(primaryHex, secondaryHex, bgHex, tickerHex, customThemeName);

  const activeThemeDef = selectedSkin === 'custom'
    ? generatedCustomTheme
    : (THEMES[selectedSkin] || currentTheme);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundEffects.playButtonClick();
        setBranding(prev => ({
          ...prev,
          customLogoUrl: dataUrl
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    soundEffects.playButtonClick();
    setBranding(prev => ({
      ...prev,
      customLogoUrl: undefined
    }));
  };

  const handleSelectTheme = (skinId: SkinType) => {
    soundEffects.playButtonClick();
    setSelectedSkin(skinId);
    setBranding(prev => ({
      ...prev,
      themePreset: skinId
    }));
  };

  const handleApplyPresetColors = (primary: string, secondary: string, bg: string, ticker: string, name: string) => {
    soundEffects.playButtonClick();
    setPrimaryHex(primary);
    setSecondaryHex(secondary);
    setBgHex(bg);
    setTickerHex(ticker);
    setCustomThemeName(name);
    setSelectedSkin('custom');
    setBranding(prev => ({ ...prev, themePreset: 'custom' }));
  };

  const handleCopyCssObject = () => {
    soundEffects.playButtonClick();
    const cssObjectString = JSON.stringify(generatedCustomTheme, null, 2);
    navigator.clipboard.writeText(cssObjectString);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAll = () => {
    soundEffects.playSongSelect();
    const finalCustomTheme = generateCustomTheme(primaryHex, secondaryHex, bgHex, tickerHex, customThemeName);
    onUpdateConfig({
      ...config,
      skin: selectedSkin,
      customSkinColors: {
        primaryHex,
        secondaryHex,
        bgHex,
        tickerHex,
        themeName: customThemeName
      },
      customTheme: finalCustomTheme,
      branding: {
        ...branding,
        themePreset: selectedSkin
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className={`${activeThemeDef.cardBg} border-2 ${activeThemeDef.headerBorder} rounded-2xl max-w-5xl w-full h-[90vh] max-h-[760px] shadow-2xl flex flex-col overflow-hidden relative text-gray-200`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${activeThemeDef.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeThemeDef.primaryAccent} text-black font-bold shadow-md`}>
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <span>VENUE BRANDING &amp; THEME STUDIO</span>
                <span className="text-xs px-2 py-0.5 rounded bg-black/40 text-amber-400 font-mono flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  PRO
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-chakra">
                Upload custom venue logo, customize marquee headlines, and switch commercial cabinet skins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-black/40 text-gray-400 hover:text-white border border-white/10 hover:border-amber-400 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          
          {/* Section 1: Ready-Made Themed Designs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select Cabinet Theme Style
              </h3>
              <span className="text-xs text-amber-400 font-mono">
                8 Preset Themes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(THEMES) as SkinType[]).map(key => {
                const themeItem = THEMES[key];
                const isSelected = selectedSkin === key;

                return (
                  <div
                    key={key}
                    onClick={() => handleSelectTheme(key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                      isSelected
                        ? `${themeItem.cardBg} ${themeItem.highlightBorder} shadow-lg ring-2 ring-amber-400/60 scale-[1.02]`
                        : 'bg-[#141414] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono shadow-sm bg-black/60 text-amber-400 border border-white/10">
                          {themeItem.badge}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-white leading-snug">
                        {themeItem.nameEn}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-chakra mt-1 line-clamp-2">
                        {themeItem.subtitleEn}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${themeItem.primaryAccent}`}></div>
                        <span className="text-[9px] text-gray-400 font-mono truncate">{themeItem.nameEn}</span>
                      </div>
                      <p className={`text-[10px] ${themeItem.fontFamilyClass} font-bold text-amber-300 truncate`}>
                        {themeItem.fontFamilyName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Custom Skin Studio & CSS Theme Generator */}
          <div className="bg-[#0A0D18] rounded-2xl p-5 border border-cyan-500/30 space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Palette className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-chakra flex items-center gap-2">
                    <span>Skin Customizer &amp; CSS Theme Generator</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                      LIVE HEX EDITOR
                    </span>
                  </h4>
                  <p className="text-xs text-gray-400 font-chakra mt-0.5">
                    Pick primary/secondary color hex codes to automatically generate and save a custom CSS theme object
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCssCode(!showCssCode)}
                  className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showCssCode ? 'Hide CSS Theme Object' : 'Inspect CSS Theme Object'}</span>
                </button>
              </div>
            </div>

            {/* Quick Color Palette Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 font-chakra uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Quick Preset Palettes
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#d946ef', bg: '#080414', ticker: '#22d3ee' },
                  { name: 'Obsidian Gold', primary: '#f59e0b', secondary: '#3b82f6', bg: '#0a0a0a', ticker: '#fbbf24' },
                  { name: 'Emerald Synth', primary: '#10b981', secondary: '#06b6d4', bg: '#02140e', ticker: '#34d399' },
                  { name: 'Ruby Amp', primary: '#ef4444', secondary: '#f59e0b', bg: '#140204', ticker: '#f87171' },
                  { name: 'Electric Violet', primary: '#a855f7', secondary: '#ec4899', bg: '#0b0412', ticker: '#c084fc' }
                ].map(p => (
                  <button
                    key={p.name}
                    onClick={() => handleApplyPresetColors(p.primary, p.secondary, p.bg, p.ticker, p.name)}
                    className="px-3 py-1.5 rounded-xl bg-[#12121e] border border-white/10 hover:border-cyan-400 text-xs font-chakra text-white flex items-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }}></span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.secondary }}></span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.bg }}></span>
                    </div>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Hex Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#070914] p-4 rounded-xl border border-white/10">
              {/* Primary Hex Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-chakra font-bold text-gray-300 flex items-center justify-between">
                  <span>Primary Color Hex</span>
                  <span className="font-mono text-cyan-400">{primaryHex}</span>
                </label>
                <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => {
                      setPrimaryHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={primaryHex}
                    onChange={(e) => {
                      setPrimaryHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                </div>
              </div>

              {/* Secondary Hex Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-chakra font-bold text-gray-300 flex items-center justify-between">
                  <span>Secondary Color Hex</span>
                  <span className="font-mono text-purple-400">{secondaryHex}</span>
                </label>
                <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => {
                      setSecondaryHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={secondaryHex}
                    onChange={(e) => {
                      setSecondaryHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                </div>
              </div>

              {/* Background Canvas Hex Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-chakra font-bold text-gray-300 flex items-center justify-between">
                  <span>Canvas / Card Bg Hex</span>
                  <span className="font-mono text-gray-400">{bgHex}</span>
                </label>
                <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={bgHex}
                    onChange={(e) => {
                      setBgHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={bgHex}
                    onChange={(e) => {
                      setBgHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                </div>
              </div>

              {/* Ticker / Highlight Hex Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-chakra font-bold text-gray-300 flex items-center justify-between">
                  <span>Ticker Highlight Hex</span>
                  <span className="font-mono text-emerald-400">{tickerHex}</span>
                </label>
                <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={tickerHex}
                    onChange={(e) => {
                      setTickerHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={tickerHex}
                    onChange={(e) => {
                      setTickerHex(e.target.value);
                      setSelectedSkin('custom');
                      setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom Theme Name Input */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-chakra text-gray-400 whitespace-nowrap">Custom Theme Title:</label>
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => {
                  setCustomThemeName(e.target.value);
                  setSelectedSkin('custom');
                  setBranding(prev => ({ ...prev, themePreset: 'custom' }));
                }}
                placeholder="e.g. Costco Cyber Red Bar Theme"
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-chakra outline-none focus:border-cyan-400"
              />
            </div>

            {/* Code Inspector Block */}
            {showCssCode && (
              <div className="bg-[#05060c] rounded-xl p-4 border border-cyan-500/40 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-cyan-300 border-b border-white/10 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-cyan-400" />
                    Generated CSS Theme Object (JSON Output)
                  </span>
                  <button
                    onClick={handleCopyCssObject}
                    className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 text-cyan-200 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode ? 'COPIED TO CLIPBOARD!' : 'Copy Object'}</span>
                  </button>
                </div>
                <pre className="text-gray-300 max-h-48 overflow-y-auto font-mono text-[11px] p-2 bg-black/80 rounded border border-white/5 scrollbar-thin scrollbar-thumb-zinc-700">
                  {JSON.stringify(generatedCustomTheme, null, 2)}
                </pre>
              </div>
            )}

            {/* Live Custom Skin UI Component Preview Card */}
            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: bgHex, borderColor: `${primaryHex}60` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-chakra uppercase tracking-wider flex items-center gap-1.5" style={{ color: primaryHex }}>
                  <Eye className="w-4 h-4" />
                  Live Generated UI Elements Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: `${primaryHex}20`, color: primaryHex, borderColor: `${primaryHex}50` }}>
                  {customThemeName}
                </span>
              </div>

              {/* Sample Jukebox Card */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between gap-4 shadow-lg" style={{ backgroundColor: `${bgHex}ee`, borderColor: `${secondaryHex}50` }}>
                <div className="flex items-center gap-3">
                  {/* Vinyl Record Center */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center animate-spin-slow shadow-md" style={{ background: `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})` }}>
                    <div className="w-3.5 h-3.5 bg-black rounded-full border border-white/40"></div>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm font-chakra text-white">Custom Skin Dynamic Vinyl</h5>
                    <p className="text-[11px] font-chakra" style={{ color: tickerHex }}>
                      Ticker Text: {branding.marqueeCustomText || 'Live Custom Theme Applied'}
                    </p>
                  </div>
                </div>

                <button
                  className="px-3.5 py-1.5 rounded-xl text-black font-chakra font-bold text-xs shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: primaryHex }}
                >
                  Action Button
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Logo & Machine Branding Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            
            {/* Logo Upload Box */}
            <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-400" />
                Custom Venue Logo Upload
              </h4>
              <p className="text-xs text-gray-400 font-chakra">
                Upload image file (PNG, JPG, SVG) to display on the jukebox header marquee
              </p>

              <div className="flex items-center gap-4 pt-1">
                {/* Logo Preview */}
                <div className="relative w-20 h-20 rounded-2xl bg-black/80 border-2 border-dashed border-amber-500/50 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                  {branding.customLogoUrl ? (
                    <img 
                      src={branding.customLogoUrl} 
                      alt="Custom Logo" 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className={`px-3.5 py-1.5 rounded-xl ${activeThemeDef.primaryAccent} text-black font-chakra font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Logo File...</span>
                  </button>

                  {branding.customLogoUrl && (
                    <button
                      onClick={handleRemoveLogo}
                      className="px-3.5 py-1 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-chakra text-xs flex items-center gap-1 cursor-pointer border border-red-800/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Custom Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Logo Shape */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-400 mb-1 font-chakra">
                  Logo Badge Shape:
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'circle' as const, label: 'Circle' },
                    { id: 'badge' as const, label: 'Badge / Crest' },
                    { id: 'square' as const, label: 'Rounded' },
                    { id: 'wide-banner' as const, label: 'Wide Banner' }
                  ].map(shape => (
                    <button
                      key={shape.id}
                      onClick={() => setBranding(b => ({ ...b, logoShape: shape.id }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-chakra transition-all cursor-pointer border ${
                        branding.logoShape === shape.id
                          ? 'bg-amber-500 text-black border-amber-300 font-bold'
                          : 'bg-[#1A1A1A] text-gray-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Text Titles & Ticker Banner */}
            <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                Marquee Headlines &amp; Ticker
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 font-chakra">
                  Primary Jukebox / Venue Title:
                </label>
                <input
                  type="text"
                  value={branding.title}
                  onChange={(e) => setBranding(b => ({ ...b, title: e.target.value }))}
                  placeholder="COSTCO PRO JUKEBOX / VENUE NAME"
                  className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 font-chakra">
                  Subtitle / Venue Tagline:
                </label>
                <input
                  type="text"
                  value={branding.subtitle}
                  onChange={(e) => setBranding(b => ({ ...b, subtitle: e.target.value }))}
                  placeholder="Rockola Edition • Commercial Hardware System"
                  className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 font-chakra">
                  LED Marquee Scrolling Text:
                </label>
                <input
                  type="text"
                  value={branding.marqueeCustomText || ''}
                  onChange={(e) => setBranding(b => ({ ...b, marqueeCustomText: e.target.value }))}
                  placeholder="Welcome to our venue • Happy Hour Specials All Night"
                  className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

          </div>

          {/* Section 3: Live Preview Banner */}
          <div className="p-4 rounded-2xl bg-[#090909] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-chakra flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Header Marquee Preview
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {activeThemeDef.nameEn}
              </span>
            </div>

            <div className={`p-3 rounded-xl ${activeThemeDef.headerBg} border ${activeThemeDef.headerBorder} flex items-center justify-between shadow-lg`}>
              <div className="flex items-center gap-3">
                {branding.customLogoUrl ? (
                  <img src={branding.customLogoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-lg bg-black/40 p-0.5" />
                ) : (
                  <div className={`w-9 h-9 ${activeThemeDef.primaryAccent} rounded-full flex items-center justify-center shadow`}>
                    <div className="w-3.5 h-3.5 bg-black rounded-full"></div>
                  </div>
                )}
                <div>
                  <div className="font-black text-lg text-white italic tracking-tighter leading-none">
                    {branding.title || 'ROCKOLA PRO JUKEBOX'}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold font-chakra mt-0.5">
                    {branding.subtitle || 'Rockola Edition'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 px-2 py-0.5 rounded bg-black/60 border border-white/10">
                  CREDITS: 03
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0A0A0A] flex items-center justify-between">
          <span className="text-xs text-gray-500 font-chakra">
            Modifications will be saved to machine memory and applied immediately
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1C1C1C] text-gray-300 font-chakra text-xs hover:bg-[#252525] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className={`px-6 py-2 rounded-xl ${activeThemeDef.primaryAccent} text-black font-chakra font-bold text-xs shadow-md cursor-pointer transition-all`}
            >
              Apply &amp; Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
