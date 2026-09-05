import React, { useState, useMemo, useRef } from 'react';
import { Shuffle, Lock, Plus, Shapes, Sparkles, Smile, Palette, Paw } from '@/components/ui/icons';
import GlassTabs from '@/components/ui/GlassTabs';
import {
  AVATAR_SHAPES,
  AVATAR_OUTLINES,
  AVATAR_STYLES,
  AVATAR_FACES,
  SHAPE_COLORS,
  STYLE_COLORS,
  BG_COLORS,
  normalizeAvatarConfig,
  renderAvatarSvg,
  avatarSvgToDataUri,
} from '@/lib/avatarRenderer';

// Tab order mirrors the render stack, bottom → top: Shape · Style · Avatar · Face
const TABS = [
  { id: 'shape',  label: 'Shape',  icon: Shapes },
  { id: 'style',  label: 'Style',  icon: Sparkles },
  { id: 'avatar', label: 'Avatar', icon: Paw },
  { id: 'face',   label: 'Face',   icon: Smile },
];

const LIST_FOR = {
  shape: AVATAR_SHAPES,
  style: AVATAR_STYLES,
  avatar: AVATAR_OUTLINES,
  face: AVATAR_FACES,
};

export default function AvatarCreator({
  value,
  onChange,
  size = 128,
  ownedItems,
  onLockedAttempt,
  colorDuos = [],
}) {
  const [tab, setTab] = useState('shape');

  const config = useMemo(() => normalizeAvatarConfig(value), [value]);
  const ownedSet = useMemo(() => new Set(ownedItems || []), [ownedItems]);

  const isLocked = (entry) => !!entry?.premium && !ownedSet.has(entry.id);
  const previewUri = avatarSvgToDataUri(renderAvatarSvg(config, size));

  const emit = (next) => {
    onChange?.(next, avatarSvgToDataUri(renderAvatarSvg(next, size)));
  };

  const handleChange = (key, val) => {
    emit({ ...config, [key]: val });
  };

  const handleSelectEntry = (entry) => {
    if (isLocked(entry)) {
      onLockedAttempt?.(entry.label);
      return;
    }
    handleChange(tab, entry.id);
  };

  const handleDuoSelect = (duo) => {
    if (isLocked(duo)) {
      onLockedAttempt?.(duo.name);
      return;
    }
    emit({
      ...config,
      shapeColor: duo.apply.shapeColor,
      styleColor: duo.apply.styleColor,
    });
  };

  const randomize = () => {
    const pick = (list) => {
      const pool = list.filter((e) => !isLocked(e));
      return pool[Math.floor(Math.random() * pool.length)].id;
    };
    emit({
      shape: pick(AVATAR_SHAPES),
      style: pick(AVATAR_STYLES),
      avatar: pick(AVATAR_OUTLINES),
      face: pick(AVATAR_FACES),
      shapeColor: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)].hex,
      styleColor: STYLE_COLORS[Math.floor(Math.random() * STYLE_COLORS.length)].hex,
      bgColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)].hex,
    });
  };

  const list = LIST_FOR[tab] || AVATAR_SHAPES;
  const isColorTab = tab === 'color';

  return (
    <div className="space-y-4 w-full">
      {/* Preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-border/50 shadow-lg">
            <img src={previewUri} alt="Avatar preview" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={randomize}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            title="Randomize"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Glassmorphism segmented navigation */}
      <GlassTabs options={[...TABS, { id: 'color', label: 'Color', icon: Palette }]} value={tab} onChange={setTab} size="sm" />

      {/* Options */}
      {isColorTab ? (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scroll">
          <ColorRow
            title="Backdrop"
            subtitle="The canvas beneath it all"
            colors={BG_COLORS}
            activeHex={config.bgColor}
            onSelect={(hex) => handleChange('bgColor', hex)}
          />
          <ColorRow
            title="Shape Hue"
            subtitle="Fill of your shape"
            colors={SHAPE_COLORS}
            activeHex={config.shapeColor}
            onSelect={(hex) => handleChange('shapeColor', hex)}
          />
          <ColorRow
            title="Style Accent"
            subtitle="For crowns, eyewear & flair"
            colors={STYLE_COLORS}
            activeHex={config.styleColor}
            onSelect={(hex) => handleChange('styleColor', hex)}
          />
          {colorDuos.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Royal Duos</p>
                <p className="text-[9px] text-muted-foreground/70">Curated pairs from the Shop</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {colorDuos.map((duo) => {
                  const locked = isLocked(duo);
                  const active = config.shapeColor === duo.apply.shapeColor && config.styleColor === duo.apply.styleColor;
                  return (
                    <button
                      key={duo.id}
                      type="button"
                      onClick={() => handleDuoSelect(duo)}
                      title={locked ? `${duo.name} — unlock in the Shop` : duo.name}
                      className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                        active ? 'ring-2 ring-accent bg-accent/10 scale-105' : 'hover:bg-secondary/50'
                      } ${locked ? 'opacity-60' : ''}`}
                    >
                      <span
                        className="w-10 h-10 rounded-md ring-2 ring-white/20 shadow-inner"
                        style={{ background: `linear-gradient(135deg, ${duo.apply.shapeColor} 50%, ${duo.apply.styleColor} 50%)` }}
                      />
                      {locked && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 border border-border/60 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">{duo.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 custom-scroll">
          {list.map((item) => {
            const locked = isLocked(item);
            const isActive = config[tab] === item.id;
            const tileUri = avatarSvgToDataUri(renderAvatarSvg({ ...config, [tab]: item.id }, 40));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectEntry(item)}
                title={locked ? `${item.label} — unlock in the Shop` : item.label}
                className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                  isActive ? 'ring-2 ring-accent bg-accent/10 scale-105' : 'hover:bg-secondary/50'
                } ${locked ? 'opacity-55' : ''}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-border/30">
                  <img src={tileUri} alt={item.label} className="w-full h-full object-cover" />
                </div>
                {locked && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 border border-border/60 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Color channel row ────────────────────────────────────────────────
function ColorRow({ title, subtitle, colors, activeHex, onSelect }) {
  const inputRef = useRef(null);
  const isCustom = !!activeHex && !colors.some((c) => c.hex === activeHex);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-[9px] text-muted-foreground/70">{isCustom ? 'Custom - ' + activeHex : subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const active = activeHex === c.hex;
          return (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => onSelect(c.hex)}
              className={'w-8 h-8 rounded-md transition-transform ring-2 ring-white/20 ' + (active ? 'ring-accent scale-110 shadow-md' : 'hover:scale-105')}
              style={{ background: c.hex }}
            />
          );
        })}
        <button
          type="button"
          title="Pick a custom color"
          onClick={() => inputRef.current?.click()}
          className={'relative w-8 h-8 rounded-md transition-transform ring-2 ' + (isCustom ? 'ring-accent scale-110 shadow-md' : 'ring-white/20 hover:scale-105')}
          style={{ background: 'conic-gradient(#f87171, #fbbf24, #4ade80, #22d3ee, #818cf8, #e879f9, #f87171)' }}
        >
          <Plus className="absolute inset-0 m-auto w-3.5 h-3.5 text-white/90 drop-shadow" />
        </button>
        <input
          ref={inputRef}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(activeHex || '') ? activeHex : '#ffffff'}
          onChange={(e) => onSelect(e.target.value)}
          className="sr-only"
          aria-label={'Custom ' + title}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
