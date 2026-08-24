import React from 'react';
import {
  renderAvatarSvg,
  avatarSvgToDataUri,
  normalizeAvatarConfig,
  getLegacyPalette,
  DEFAULT_AVATAR_CONFIG,
} from '../../lib/avatarRenderer';

/** Data-URI for an avatar (accepts raw JSON string, object, or empty). */
export function getAvatarDataUri(avatarRaw, size = 128) {
  const cfg = normalizeAvatarConfig(avatarRaw || DEFAULT_AVATAR_CONFIG);
  return avatarSvgToDataUri(renderAvatarSvg(cfg, size));
}

/** Legacy-shaped palette {bg, inner, accent} for gradients & dialogs. */
export function getAvatarPalette(avatarRaw) {
  return getLegacyPalette(avatarRaw || DEFAULT_AVATAR_CONFIG);
}

export function getBannerGradient(avatarRaw) {
  const pal = getAvatarPalette(avatarRaw);
  return `linear-gradient(135deg, ${pal.bg}40, ${pal.inner}30, ${pal.accent}20)`;
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
