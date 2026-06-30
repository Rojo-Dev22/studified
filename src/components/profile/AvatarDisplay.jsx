import React from 'react';
import { renderAvatarSvg, avatarSvgToDataUri, COLOR_PALETTES } from './AvatarCreator';

const DEFAULT_AVATAR_CONFIG = {
  bg: 'hexagon', inner: 'geometric', accent: 'halo', face: 'none',
  palette: { name: 'Indigo', bg: '#4338ca', inner: '#6366f1', accent: '#818cf8', key: 'indigo' }
};

function parseAvatarConfig(raw) {
  if (!raw) return DEFAULT_AVATAR_CONFIG;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed.palette?.key) {
      const found = COLOR_PALETTES.find(p => p.key === parsed.palette.key);
      if (found) parsed.palette = found;
    }
    return parsed;
  } catch {
    return DEFAULT_AVATAR_CONFIG;
  }
}

export function getAvatarDataUri(avatarRaw, size = 128) {
  const c = parseAvatarConfig(avatarRaw);
  return avatarSvgToDataUri(renderAvatarSvg(c.bg, c.inner, c.accent, c.face || 'none', c.palette, size));
}

export function getAvatarPalette(avatarRaw) {
  const c = parseAvatarConfig(avatarRaw);
  return c.palette || DEFAULT_AVATAR_CONFIG.palette;
}

export function getBannerGradient(avatarRaw) {
  const pal = getAvatarPalette(avatarRaw);
  return `from-[${pal.bg}]/40 via-[${pal.inner}]/30 to-[${pal.accent}]/20`;
}

export default function AvatarDisplay({ avatar, size = 40, className = '' }) {
  const uri = getAvatarDataUri(avatar, size);
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={uri} alt="Avatar" className="w-full h-full object-cover" />
    </div>
  );
}