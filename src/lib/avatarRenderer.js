// ─── Avatar renderer: pure data + SVG generation ────────────────────
// Single source of truth shared by the Profile avatar editor, the Shop,
// and every avatar display surface.
//
// Layer stack (bottom → top): Shape → Style → Avatar → Face,
// with two independent color channels: shapeColor & styleColor.

// helper: lighten/darken hex
export function adjust(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const INK = '#1a1a2e';

export const DEFAULT_AVATAR_CONFIG = {
  shape: 'hexagon',
  avatar: 'none',
  style: 'none',
  face: 'smile',
  shapeColor: '#4338ca',
  styleColor: '#fbbf24',
};

// ─── Layer 1 · Shapes (base silhouette) ──────────────────────────────

export const AVATAR_SHAPES = [
  { id: 'circle',    label: 'Circle',    icon: '●',  path: (c) => `<circle cx="50" cy="50" r="48" fill="${c}" />` },
  { id: 'hexagon',   label: 'Hexagon',   icon: '⬡',  path: (c) => `<polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="${c}" />` },
  { id: 'square',    label: 'Square',    icon: '■',  path: (c) => `<rect x="6" y="6" width="88" height="88" rx="12" fill="${c}" />` },
  { id: 'triangle',  label: 'Triangle',  icon: '▲',  path: (c) => `<polygon points="50,4 96,90 4,90" fill="${c}" />` },
  { id: 'wave',      label: 'Wave',      icon: '〰', path: (c) => `<path d="M0,70 Q25,40 50,70 T100,70 L100,100 L0,100 Z" fill="${c}" /><path d="M0,80 Q25,55 50,80 T100,80 L100,100 L0,100 Z" fill="${adjust(c,-20)}" opacity="0.6" />` },
  { id: 'sunburst',  label: 'Sunburst',  icon: '☀',  path: (c) => {
    const rays = Array.from({length:12}, (_,i) => {
      const a = (i*30-90)*Math.PI/180;
      return `<line x1="50" y1="50" x2="${50+48*Math.cos(a)}" y2="${50+48*Math.sin(a)}" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.3" />`;
    }).join('');
    return `<circle cx="50" cy="50" r="22" fill="${c}" />${rays}`;
  }},
  { id: 'petal',     label: 'Petal',     icon: '✿',  path: (c) => {
    const petals = Array.from({length:6}, (_,i) => {
      const a = i*60*Math.PI/180;
      const cx = 50+18*Math.cos(a), cy = 50+18*Math.sin(a);
      return `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="20" fill="${c}" transform="rotate(${i*60},${cx},${cy})" opacity="0.7" />`;
    }).join('');
    return `${petals}<circle cx="50" cy="50" r="12" fill="${adjust(c,30)}" />`;
  }},
  { id: 'ring',      label: 'Ring',      icon: '○',  path: (c) => `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="10" /><circle cx="50" cy="50" r="20" fill="${c}" opacity="0.4" />` },
  { id: 'cross',     label: 'Cross',     icon: '✚',  path: (c) => `<rect x="20" y="4" width="60" height="92" rx="8" fill="${c}" opacity="0.7" /><rect x="4" y="20" width="92" height="60" rx="8" fill="${c}" opacity="0.7" />` },
  { id: 'drop',      label: 'Drop',      icon: '💧', path: (c) => `<path d="M50,4 Q80,50 80,70 Q80,90 50,90 Q20,90 20,70 Q20,50 50,4" fill="${c}" />` },
  { id: 'star',      label: 'Star',      icon: '★',  premium: true, path: (c) => `<polygon points="50,4 61,38 97,38 68,59 79,95 50,74 21,95 32,59 3,38 39,38" fill="${c}" />` },
  { id: 'diamond',   label: 'Diamond',   icon: '◆',  premium: true, path: (c) => `<polygon points="50,4 96,50 50,96 4,50" fill="${c}" />` },
  { id: 'shield',    label: 'Shield',    icon: '🛡',  premium: true, path: (c) => `<path d="M50,4 L96,20 L96,50 Q96,80 50,96 Q4,80 4,50 L4,20 Z" fill="${c}" />` },
  { id: 'gear',      label: 'Gear',      icon: '⚙',  premium: true, path: (c) => {
    const outer = Array.from({length:8}, (_,i) => {
      const a = i*45*Math.PI/180;
      const x1=50+40*Math.cos(a), y1=50+40*Math.sin(a);
      const x2=50+48*Math.cos(a-0.15), y2=50+48*Math.sin(a-0.15);
      const x3=50+48*Math.cos(a+0.15), y3=50+48*Math.sin(a+0.15);
      return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${c}" />`;
    }).join('');
    return `${outer}<circle cx="50" cy="50" r="20" fill="${c}" /><circle cx="50" cy="50" r="10" fill="${adjust(c,-40)}" />`;
  }},
  { id: 'moon',      label: 'Crescent',  icon: '🌙',  premium: true, path: (c) => `<path d="M60,4 Q90,25 90,50 Q90,75 60,96 Q80,75 80,50 Q80,25 60,4" fill="${c}" /><circle cx="50" cy="50" r="44" fill="${c}" opacity="0.3" />` },
];

// ─── Layer 3 · Avatars (creature outline overlays) ───────────────────
// Drawn over Style but under Face, so expressions always read clearly.
// Filled with the chosen Style color. Signature: path(styleColor, styleColor).

export const AVATAR_OUTLINES = [
  { id: 'none',   label: 'None',    icon: '—',  path: () => '' },
  { id: 'bear',   label: 'Bear',    icon: '🐻',  path: (t) =>
    `<circle cx="23" cy="19" r="11" fill="${t}" /><circle cx="77" cy="19" r="11" fill="${t}" /><circle cx="23" cy="19" r="5" fill="#ffffff" opacity="0.22" /><circle cx="77" cy="19" r="5" fill="#ffffff" opacity="0.22" /><ellipse cx="50" cy="67" rx="13" ry="9" fill="#ffffff" opacity="0.15" /><path d="M44,60 Q50,56 56,60 Q54,66 50,66 Q46,66 44,60 Z" fill="${t}" />` },
  { id: 'panda',  label: 'Panda',   icon: '🐼',  path: (t) =>
    `<circle cx="21" cy="18" r="10" fill="${t}" /><circle cx="79" cy="18" r="10" fill="${t}" /><ellipse cx="35" cy="42" rx="8" ry="11" transform="rotate(-18 35 42)" fill="${t}" opacity="0.5" /><ellipse cx="65" cy="42" rx="8" ry="11" transform="rotate(18 65 42)" fill="${t}" opacity="0.5" />` },
  { id: 'fox',    label: 'Fox',     icon: '🦊',  path: (t) =>
    `<path d="M14,34 L20,4 L46,20 Z" fill="${t}" /><path d="M86,34 L80,4 L54,20 Z" fill="${t}" /><path d="M23,25 L26,12 L36,19 Z" fill="#ffffff" opacity="0.3" /><path d="M77,25 L74,12 L64,19 Z" fill="#ffffff" opacity="0.3" /><path d="M8,62 L18,58 L12,68" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" /><path d="M92,62 L82,58 L88,68" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />` },
  { id: 'bunny',  label: 'Bunny',   icon: '🐰',  path: (t) =>
    `<ellipse cx="35" cy="14" rx="8" ry="19" transform="rotate(-10 35 14)" fill="${t}" /><ellipse cx="65" cy="14" rx="8" ry="19" transform="rotate(10 65 14)" fill="${t}" /><ellipse cx="35" cy="15" rx="3.5" ry="12" transform="rotate(-10 35 15)" fill="#ffffff" opacity="0.3" /><ellipse cx="65" cy="15" rx="3.5" ry="12" transform="rotate(10 65 15)" fill="#ffffff" opacity="0.3" />` },
  { id: 'wolf',   label: 'Wolf',    icon: '🐺',  path: (t) =>
    `<path d="M16,30 L13,6 L38,17 Z" fill="${t}" /><path d="M84,30 L87,6 L62,17 Z" fill="${t}" /><path d="M6,58 L16,55 L10,64 L20,61 L14,70" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" /><path d="M94,58 L84,55 L90,64 L80,61 L86,70" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />` },
  { id: 'dragon', label: 'Dragon',  icon: '🐲',  path: (t) =>
    `<path d="M28,18 Q22,4 34,2 Q31,10 37,17 Z" fill="${t}" opacity="0.9" /><path d="M72,18 Q78,4 66,2 Q69,10 63,17 Z" fill="${t}" opacity="0.9" /><path d="M4,38 L13,34 L7,45" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" /><path d="M96,38 L87,34 L93,45" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" /><path d="M8,52 L16,49 L11,57" stroke="${t}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" /><path d="M92,52 L84,49 L89,57" stroke="${t}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />` },
  { id: 'cat',    label: 'Cat',     icon: '🐱',  premium: true, path: (t) =>
    `<path d="M20,32 L27,8 L43,22 Z" fill="${t}" /><path d="M80,32 L73,8 L57,22 Z" fill="${t}" /><path d="M27,25 L30,14 L37,20 Z" fill="#ffffff" opacity="0.28" /><path d="M73,25 L70,14 L63,20 Z" fill="#ffffff" opacity="0.28" /><line x1="16" y1="50" x2="4" y2="46" stroke="${t}" stroke-width="2" stroke-linecap="round" opacity="0.65" /><line x1="16" y1="57" x2="5" y2="58" stroke="${t}" stroke-width="2" stroke-linecap="round" opacity="0.65" /><line x1="84" y1="50" x2="96" y2="46" stroke="${t}" stroke-width="2" stroke-linecap="round" opacity="0.65" /><line x1="84" y1="57" x2="95" y2="58" stroke="${t}" stroke-width="2" stroke-linecap="round" opacity="0.65" /><polygon points="46,55 54,55 50,61" fill="${t}" opacity="0.85" />` },
  { id: 'dog',    label: 'Dog',     icon: '🐶',  premium: true, path: (t) =>
    `<path d="M24,24 Q8,30 10,52 Q18,60 30,50 Q32,34 24,24 Z" fill="${t}" opacity="0.95" /><path d="M76,24 Q92,30 90,52 Q82,60 70,50 Q68,34 76,24 Z" fill="${t}" opacity="0.95" /><ellipse cx="50" cy="66" rx="15" ry="10" fill="#ffffff" opacity="0.16" /><ellipse cx="50" cy="60" rx="5.5" ry="4" fill="${t}" />` },
  { id: 'owl',    label: 'Owl',     icon: '🦉',  premium: true, path: (t, s) =>
    `<path d="M22,22 L15,7 L31,13 Z" fill="${t}" /><path d="M78,22 L85,7 L69,13 Z" fill="${t}" /><path d="M17,32 Q33,17 50,27 Q67,17 83,32" stroke="${t}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8" /><polygon points="45,50 55,50 50,60" fill="${s}" opacity="0.9" />` },
  { id: 'ninja',  label: 'Ninja',   icon: '🥷',  premium: true, path: (t) =>
    `<rect x="12" y="27" width="76" height="9" rx="4.5" fill="${t}" opacity="0.95" /><circle cx="50" cy="31.5" r="3.5" fill="#ffffff" opacity="0.75" /><path d="M86,29 L99,22 L92,33 Z" fill="${t}" opacity="0.85" /><path d="M87,35 L97,41 L85,41 Z" fill="${t}" opacity="0.65" />` },
  { id: 'robot',  label: 'Robot',   icon: '🤖',  premium: true, path: (t, s) =>
    `<line x1="50" y1="14" x2="50" y2="5" stroke="${t}" stroke-width="3" stroke-linecap="round" /><circle cx="50" cy="4.5" r="3" fill="${s}" opacity="0.95" /><rect x="10" y="42" width="7" height="12" rx="3" fill="${t}" opacity="0.6" /><rect x="83" y="42" width="7" height="12" rx="3" fill="${t}" opacity="0.6" /><circle cx="38" cy="22" r="1.8" fill="${t}" opacity="0.55" /><circle cx="50" cy="20" r="1.8" fill="${t}" opacity="0.55" /><circle cx="62" cy="22" r="1.8" fill="${t}" opacity="0.55" />` },
];

// ─── Layer 2 · Styles (accessories — goggles & eyewear live here now) ─

export const AVATAR_STYLES = [
  { id: 'none',       label: 'None',        icon: '—',  path: () => '' },
  { id: 'glasses',    label: 'Glasses',     icon: '👓',  path: (c) => `<rect x="20" y="36" width="26" height="18" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.8" /><rect x="54" y="36" width="26" height="18" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.8" /><line x1="46" y1="44" x2="54" y2="44" stroke="${c}" stroke-width="2.5" opacity="0.8" />` },
  { id: 'specs',      label: 'Scholar Specs', icon: '🤓',  path: (c) => `<rect x="22" y="33" width="24" height="17" rx="5" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.85" /><rect x="54" y="33" width="24" height="17" rx="5" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.85" /><line x1="46" y1="40" x2="54" y2="40" stroke="${c}" stroke-width="2.5" opacity="0.85" /><circle cx="34" cy="41" r="2.5" fill="${c}" opacity="0.35" /><circle cx="66" cy="41" r="2.5" fill="${c}" opacity="0.35" />` },
  { id: 'shades',     label: 'Midnight Shades', icon: '🕶',  premium: true, path: (c) =>
    `<path d="M18,34 L82,34 L82,40 L78,40 L74,52 Q72,57 66,56 L58,53 Q50,50 42,53 L34,56 Q28,57 26,52 L22,40 L18,40 Z" fill="${c}" opacity="0.9" /><circle cx="38" cy="43" r="3" fill="#ffffff" opacity="0.45" /><circle cx="64" cy="43" r="3" fill="#ffffff" opacity="0.25" /><line x1="14" y1="34" x2="20" y2="36" stroke="${c}" stroke-width="2.5" opacity="0.9" /><line x1="86" y1="34" x2="80" y2="36" stroke="${c}" stroke-width="2.5" opacity="0.9" />` },
  { id: 'monocle',    label: 'Monocle of Wisdom', icon: '🧐',  premium: true, path: (c) =>
    `<circle cx="63" cy="42" r="11" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.85" /><circle cx="63" cy="42" r="7.5" fill="#ffffff" opacity="0.12" /><line x1="71" y1="49" x2="79" y2="60" stroke="${c}" stroke-width="2.2" opacity="0.7" /><circle cx="63" cy="31.5" r="1.8" fill="${c}" opacity="0.7" />` },
  { id: 'visor',      label: 'Cyber Visor', icon: '🤖',  premium: true, path: (c) =>
    `<rect x="16" y="32" width="68" height="15" rx="7.5" fill="${c}" opacity="0.32" /><rect x="16" y="32" width="68" height="15" rx="7.5" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.85" /><rect x="10" y="35" width="7" height="9" rx="3" fill="${c}" opacity="0.6" /><rect x="83" y="35" width="7" height="9" rx="3" fill="${c}" opacity="0.6" /><line x1="26" y1="39.5" x2="40" y2="39.5" stroke="${c}" stroke-width="2" opacity="0.7" stroke-linecap="round" />` },
  { id: 'headband',   label: 'Headband',    icon: '🎀',  path: (c) => `<path d="M15,34 Q50,22 85,34 L82,42 Q50,32 18,42 Z" fill="${c}" opacity="0.8" /><ellipse cx="35" cy="30" rx="5" ry="4" fill="${c}" opacity="0.4" />` },
  { id: 'scarf',      label: 'Scarf',       icon: '🧣',  path: (c) => `<path d="M20,50 Q50,44 80,50 L78,60 Q50,56 22,60 Z" fill="${c}" opacity="0.7" /><path d="M70,55 Q80,70 75,85 Q70,80 65,70 Z" fill="${c}" opacity="0.5" />` },
  { id: 'headphones', label: 'Headphones',  icon: '🎧',  path: (c) => `<path d="M20,40 Q20,20 50,18 Q80,20 80,40" fill="none" stroke="${c}" stroke-width="4" opacity="0.7" /><rect x="14" y="36" width="12" height="20" rx="6" fill="${c}" opacity="0.8" /><rect x="74" y="36" width="12" height="20" rx="6" fill="${c}" opacity="0.8" />` },
  { id: 'wings',      label: 'Wings',       icon: '🕊',  path: (c) => `<path d="M50,50 Q30,20 10,30 Q25,40 30,50 Q20,55 5,50 Q20,65 50,50" fill="${c}" opacity="0.6" /><path d="M50,50 Q70,20 90,30 Q75,40 70,50 Q80,55 95,50 Q80,65 50,50" fill="${c}" opacity="0.6" />` },
  { id: 'mask',       label: 'Mystery Veil', icon: '🎭',  path: (c) => `<path d="M30,44 Q50,36 70,44 L66,60 Q50,56 34,60 Z" fill="${c}" opacity="0.6" /><circle cx="36" cy="48" r="3" fill="${c}" opacity="0.4" /><circle cx="64" cy="48" r="3" fill="${c}" opacity="0.4" />` },
  { id: 'sparkle',    label: 'Sparkles',    icon: '✨',  path: (c) => `<text x="18" y="22" font-size="14" fill="${c}" opacity="0.8">✦</text><text x="72" y="18" font-size="10" fill="${c}" opacity="0.6">✦</text><text x="78" y="36" font-size="8" fill="${c}" opacity="0.5">✦</text>` },
  { id: 'stars',      label: 'Stars',       icon: '⭐',  path: (c) => {
    const stars = [[20,20,4],[80,15,3],[15,70,3],[85,75,4],[50,85,3]];
    return stars.map(([x,y,r]) => {
      const pts = Array.from({length:5}, (_,i) => {
        const a = (i*72-90)*Math.PI/180;
        return `${x+r*Math.cos(a)},${y+r*Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${c}" opacity="0.7" />`;
    }).join('');
  }},
  { id: 'halo',       label: 'Halo of Ascension', icon: '😇',  premium: true, path: (c) =>
    `<ellipse cx="50" cy="12" rx="24" ry="8" fill="none" stroke="${c}" stroke-width="3" opacity="0.85" /><ellipse cx="50" cy="12" rx="17" ry="5" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4" /><circle cx="50" cy="4" r="2" fill="${c}" opacity="0.6" />` },
  { id: 'flame',      label: 'Flame',       icon: '🔥',  path: (c) => `<path d="M50,20 Q65,40 60,55 Q55,65 50,60 Q45,65 40,55 Q35,40 50,20" fill="${c}" opacity="0.8" /><path d="M50,30 Q58,45 55,55 Q52,60 50,55 Q48,60 45,55 Q42,45 50,30" fill="${adjust(c,40)}" opacity="0.6" />` },
  { id: 'aura',       label: 'Aura',        icon: '🌈',  path: (c) => `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="2" opacity="0.3" /><circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="2" opacity="0.2" /><circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="2" opacity="0.15" />` },
  { id: 'tattoo',     label: 'Sigil',       icon: '💠',  path: (c) => `<path d="M50,30 Q60,40 50,50 Q40,60 30,50 Q20,40 30,30 Q40,20 50,30" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" /><path d="M50,40 Q55,45 50,50 Q45,55 40,50 Q35,45 40,40 Q45,35 50,40" fill="${c}" opacity="0.4" />` },
];

// ─── Layer 4 · Faces (pure expressions — no eyewear) ─────────────────
// Goggles/shades/monocles/visors moved to the Style layer above.

export const AVATAR_FACES = [
  { id: 'none',     label: 'No Face',   icon: '·',  path: () => '' },
  { id: 'smile',    label: 'Serene Smile', icon: '😊',  path: () => `<circle cx="34" cy="42" r="4" fill="${INK}" opacity="0.8" /><circle cx="66" cy="42" r="4" fill="${INK}" opacity="0.8" /><path d="M30,56 Q50,70 70,56" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />` },
  { id: 'happy',    label: 'Radiant Joy', icon: '😄',  premium: true, path: () =>
    `<circle cx="34" cy="40" r="5" fill="${INK}" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="${INK}" opacity="0.8" /><circle cx="36" cy="38" r="1.8" fill="#ffffff" opacity="0.7" /><circle cx="68" cy="38" r="1.8" fill="#ffffff" opacity="0.7" /><path d="M28,52 Q50,74 72,52 Z" fill="${INK}" opacity="0.85" /><path d="M34,54 L66,54" stroke="#ffffff" stroke-width="2.5" opacity="0.55" />` },
  { id: 'love',     label: 'Heartstruck', icon: '😍',  premium: true, path: () =>
    `<path d="M36,32 Q30,24 34,20 Q38,16 42,20 Q46,24 40,32 Z" fill="#ff4d6d" opacity="0.75" /><path d="M64,32 Q58,24 62,20 Q66,16 70,20 Q74,24 68,32 Z" fill="#ff4d6d" opacity="0.75" /><path d="M28,54 Q50,76 72,54" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />` },
  { id: 'laughing', label: 'Laughing',  icon: '😂',  path: () => `<path d="M28,36 Q34,30 40,36" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M60,36 Q66,30 72,36" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M24,52 Q50,80 76,52" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><circle cx="38" cy="62" r="3" fill="${INK}" opacity="0.2" /><circle cx="62" cy="62" r="3" fill="${INK}" opacity="0.2" />` },
  { id: 'curious',  label: 'Curious',   icon: '🧐',  path: () => `<path d="M58,29 Q66,23 74,28" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" opacity="0.8" /><circle cx="34" cy="41" r="4.5" fill="${INK}" opacity="0.8" /><circle cx="66" cy="42" r="4.5" fill="${INK}" opacity="0.8" /><circle cx="50" cy="58" r="4" fill="${INK}" opacity="0.65" />` },
  { id: 'bright',   label: 'Bright-Eyed', icon: '🤓',  path: () =>
    `<circle cx="34" cy="40" r="6" fill="${INK}" opacity="0.8" /><circle cx="66" cy="40" r="6" fill="${INK}" opacity="0.8" /><circle cx="36" cy="38" r="2" fill="#ffffff" opacity="0.65" /><circle cx="68" cy="38" r="2" fill="#ffffff" opacity="0.65" /><path d="M30,52 Q50,70 70,52 Z" fill="${INK}" opacity="0.8" /><line x1="36" y1="55" x2="64" y2="55" stroke="#ffffff" stroke-width="2" opacity="0.5" />` },
  { id: 'cool',     label: 'Cool',      icon: '😎',  path: () =>
    `<path d="M26,38 Q34,33 42,38" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.85" /><path d="M58,38 Q66,33 74,38" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.85" /><circle cx="36" cy="44" r="2.2" fill="${INK}" opacity="0.7" /><circle cx="64" cy="44" r="2.2" fill="${INK}" opacity="0.7" /><path d="M34,56 Q52,63 66,53" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'mischief', label: 'Mischief',  icon: '😈',  path: () => `<path d="M22,30 Q28,18 34,26" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M78,30 Q72,18 66,26" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><circle cx="34" cy="42" r="5" fill="${INK}" opacity="0.8" /><circle cx="66" cy="42" r="5" fill="${INK}" opacity="0.8" /><path d="M32,54 Q50,68 68,54" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'zen',      label: 'Zen Master', icon: '😌',  premium: true, path: () =>
    `<path d="M26,42 Q34,48 42,42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M58,42 Q66,48 74,42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M38,58 Q50,66 62,58" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><circle cx="22" cy="56" r="2" fill="${INK}" opacity="0.25" /><circle cx="78" cy="56" r="2" fill="${INK}" opacity="0.25" />` },
  { id: 'sad',      label: 'Wistful',   icon: '😢',  path: () => `<circle cx="34" cy="40" r="5" fill="${INK}" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="${INK}" opacity="0.8" /><path d="M32,60 Q50,50 68,60" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M28,52 Q34,46 40,52" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.5" />` },
  { id: 'angry',    label: 'Storm Fury', icon: '😠',  premium: true, path: () =>
    `<line x1="26" y1="34" x2="42" y2="42" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity="0.85" /><line x1="74" y1="34" x2="58" y2="42" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity="0.85" /><circle cx="34" cy="46" r="5" fill="${INK}" opacity="0.85" /><circle cx="66" cy="46" r="5" fill="${INK}" opacity="0.85" /><path d="M34,58 Q50,64 66,58" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.85" />` },
  { id: 'kissy',    label: 'Blown Kiss', icon: '😘',  path: () => `<circle cx="34" cy="40" r="5" fill="${INK}" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="${INK}" opacity="0.8" /><path d="M38,50 Q50,62 62,50" fill="none" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" opacity="0.7" /><path d="M66,34 Q70,28 76,32" fill="none" stroke="#ff4d6d" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'cute',     label: 'Doe-Eyed',  icon: '🥺',  path: () => `<circle cx="34" cy="42" r="7" fill="${INK}" opacity="0.85" /><circle cx="66" cy="42" r="7" fill="${INK}" opacity="0.85" /><circle cx="36" cy="44" r="3" fill="#ffffff" opacity="0.6" /><circle cx="64" cy="44" r="3" fill="#ffffff" opacity="0.6" /><path d="M30,54 Q50,62 70,54" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'android',  label: 'Android',   icon: '🤖',  path: () =>
    `<rect x="28" y="36" width="12" height="12" rx="3" fill="${INK}" opacity="0.85" /><rect x="60" y="36" width="12" height="12" rx="3" fill="${INK}" opacity="0.85" /><circle cx="34" cy="42" r="2" fill="#7ef9ff" opacity="0.9" /><circle cx="66" cy="42" r="2" fill="#7ef9ff" opacity="0.9" /><rect x="40" y="56" width="20" height="5" rx="2.5" fill="${INK}" opacity="0.7" />` },
  { id: 'clown',    label: 'Jester',    icon: '🤡',  path: () => `<circle cx="50" cy="46" r="16" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.5" /><circle cx="38" cy="42" r="5" fill="${INK}" opacity="0.8" /><circle cx="62" cy="42" r="5" fill="${INK}" opacity="0.8" /><circle cx="50" cy="54" r="5" fill="#ff4d6d" opacity="0.6" /><path d="M30,38 Q24,30 30,26 Q36,22 40,30" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="0.5" /><path d="M70,38 Q76,30 70,26 Q64,22 60,30" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />` },
  { id: 'ghost',    label: 'Phantom Wisp', icon: '👻',  premium: true, path: () =>
    `<path d="M30,36 Q30,18 50,18 Q70,18 70,36 L70,66 Q64,60 58,66 Q52,72 46,66 Q40,60 34,66 L30,66 Z" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.55" /><circle cx="38" cy="34" r="5" fill="${INK}" opacity="0.8" /><circle cx="62" cy="34" r="5" fill="${INK}" opacity="0.8" /><ellipse cx="50" cy="46" rx="4" ry="6" fill="${INK}" opacity="0.45" />` },
  { id: 'alien',    label: 'Starborn',  icon: '👽',  path: () => `<ellipse cx="34" cy="38" rx="8" ry="10" fill="${INK}" opacity="0.8" /><ellipse cx="66" cy="38" rx="8" ry="10" fill="${INK}" opacity="0.8" /><circle cx="34" cy="38" r="4" fill="#ffffff" opacity="0.5" /><circle cx="66" cy="38" r="4" fill="#ffffff" opacity="0.5" /><path d="M30,56 Q50,60 70,56" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.6" />` },
];

// ─── Color channels (two independent options) ────────────────────────

export const SHAPE_COLORS = [
  { name: 'Indigo',   hex: '#4338ca' },
  { name: 'Violet',   hex: '#7c3aed' },
  { name: 'Ocean',    hex: '#0ea5e9' },
  { name: 'Teal',     hex: '#0d9488' },
  { name: 'Forest',   hex: '#059669' },
  { name: 'Lime',     hex: '#65a30d' },
  { name: 'Amber',    hex: '#d97706' },
  { name: 'Rose',     hex: '#e11d48' },
  { name: 'Pink',     hex: '#db2777' },
  { name: 'Crimson',  hex: '#be123c' },
  { name: 'Slate',    hex: '#475569' },
  { name: 'Midnight', hex: '#1e1b4b' },
];

export const STYLE_COLORS = [
  { name: 'Gold',      hex: '#f59e0b' },
  { name: 'Champagne', hex: '#fcd34d' },
  { name: 'Silver',    hex: '#94a3b8' },
  { name: 'Rose Gold', hex: '#fb7185' },
  { name: 'Cyan',      hex: '#22d3ee' },
  { name: 'Mint',      hex: '#6ee7b7' },
  { name: 'Lavender',  hex: '#a78bfa' },
  { name: 'Blush',     hex: '#f9a8d4' },
  { name: 'Ivory',     hex: '#e7e5e4' },
  { name: 'Emerald',   hex: '#10b981' },
  { name: 'Sky',       hex: '#7dd3fc' },
  { name: 'Coral',     hex: '#fda4af' },
];

// ─── Config normalization & legacy migration ─────────────────────────
// Legacy schema: { bg, inner, accent, face, palette:{bg,inner,accent,key} }
// Current schema: { shape, avatar, style, face, shapeColor, styleColor }

export function normalizeAvatarConfig(raw) {
  let parsed = null;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== 'object') parsed = {};

  const cfg = {
    shape:      parsed.shape      || parsed.bg          || DEFAULT_AVATAR_CONFIG.shape,
    avatar:     parsed.avatar     || 'none',
    style:      parsed.style      || parsed.accent      || DEFAULT_AVATAR_CONFIG.style,
    face:       parsed.face       || DEFAULT_AVATAR_CONFIG.face,
    shapeColor: parsed.shapeColor || parsed.palette?.bg || DEFAULT_AVATAR_CONFIG.shapeColor,
    styleColor: parsed.styleColor || parsed.palette?.accent || DEFAULT_AVATAR_CONFIG.styleColor,
  };

  // Validate ids against the master lists — unknown values fall back safely.
  if (!AVATAR_SHAPES.find((s) => s.id === cfg.shape))     cfg.shape = 'circle';
  if (!AVATAR_OUTLINES.find((o) => o.id === cfg.avatar))  cfg.avatar = 'none';
  if (!AVATAR_STYLES.find((s) => s.id === cfg.style))     cfg.style = 'none';
  if (!AVATAR_FACES.find((f) => f.id === cfg.face))       cfg.face = 'smile';
  if (!/^#[0-9a-fA-F]{6}$/.test(cfg.shapeColor || ''))    cfg.shapeColor = DEFAULT_AVATAR_CONFIG.shapeColor;
  if (!/^#[0-9a-fA-F]{6}$/.test(cfg.styleColor || ''))    cfg.styleColor = DEFAULT_AVATAR_CONFIG.styleColor;

  return cfg;
}

/** Legacy-shaped palette {bg, inner, accent} derived from a config —
 *  used for banner gradients and the save-success dialog. */
export function getLegacyPalette(cfg) {
  const c = normalizeAvatarConfig(cfg);
  return {
    bg: c.shapeColor,
    inner: adjust(c.shapeColor, 35),
    accent: c.styleColor,
  };
}

// ─── Render pipeline ─────────────────────────────────────────────────

export function renderAvatarSvg(config, size = 128) {
  const cfg  = normalizeAvatarConfig(config);
  const shDef = AVATAR_SHAPES.find((p) => p.id === cfg.shape)  || AVATAR_SHAPES[0];
  const stDef = AVATAR_STYLES.find((p) => p.id === cfg.style)  || AVATAR_STYLES[0];
  const avDef = AVATAR_OUTLINES.find((p) => p.id === cfg.avatar) || AVATAR_OUTLINES[0];
  const faDef = AVATAR_FACES.find((p) => p.id === cfg.face)    || AVATAR_FACES[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs>
      <clipPath id="clip"><circle cx="50" cy="50" r="50" /></clipPath>
    </defs>
    <rect width="100" height="100" rx="50" fill="#1a1a2e" />
    <g clip-path="url(#clip)">
      ${shDef.path(cfg.shapeColor)}
      ${stDef.path(cfg.styleColor)}
      ${avDef.path(cfg.styleColor, cfg.styleColor)}
      ${faDef.path()}
    </g>
  </svg>`;
  return svg;
}

export function avatarSvgToDataUri(svgStr) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}
