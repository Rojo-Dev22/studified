// ─── Shop catalog: exclusive unlocks purchasable with coins ─────────
// Categories: background · profile (Shape/Avatar/Style/Face/Color) · title · booster
// Purchases are added to the user's `owned_items`; avatar pieces merge
// their `apply` payload into the user's saved avatar config.
// NOTE: avatar piece ids reference the master lists in lib/avatarRenderer.js,
// where each entry also carries its `premium` flag used for editor locks.

export const SHOP_CATEGORIES = [
  { id: 'background', label: 'Backgrounds', desc: 'Cinematic banner backdrops for your profile', currency: 'gamecoin' },
  { id: 'profile',    label: 'Profile',     desc: 'Haute couture for your avatar — five ateliers, one signature look', currency: 'acoin' },
  { id: 'title',      label: 'Titles',      desc: 'Exclusive titles reserved for the distinguished', currency: 'acoin' },
  { id: 'booster',    label: 'Boosters',    desc: 'Limited-edition XP amplifiers — spend it while it burns', currency: 'gamecoin' },
];

// Sub-menu inside the Profile category (rendered as a second GlassTabs row)
export const PROFILE_SUBCATEGORIES = [
  { id: 'shape',  label: 'Shape',  desc: 'Sculpt the silhouette that carries your presence' },
  { id: 'avatar', label: 'Avatar', desc: 'Spirit guides & alter egos to wear over your form' },
  { id: 'style',  label: 'Style',  desc: 'Accessories, eyewear and finishing flourishes' },
  { id: 'face',   label: 'Face',   desc: 'Expressions of character' },
  { id: 'color',  label: 'Color',  desc: 'Curated duos — one hue for the shape, one for the style' },
];

export const SHOP_ITEMS = [
  // ── Backgrounds (GameCoin) ───────────────────────────────────────
  { id: 'bg-ocean',   type: 'background', name: 'Ocean Waves',     desc: 'Deep ocean blues for your banner', price: 200, currency: 'gamecoin', colors: ['#0ea5e9', '#22d3ee', '#a5f3fc'] },
  { id: 'bg-sunset',  type: 'background', name: 'Desert Sunset',   desc: 'Warm amber and rose horizons', price: 200, currency: 'gamecoin', colors: ['#f59e0b', '#f43f5e', '#fda4af'] },
  { id: 'bg-forest',  type: 'background', name: 'Emerald Forest',  desc: 'Rich greens and teal depths', price: 250, currency: 'gamecoin', colors: ['#059669', '#10b981', '#6ee7b7'] },
  { id: 'bg-galaxy',  type: 'background', name: 'Midnight Galaxy', desc: 'Violet nebula across the banner', price: 300, currency: 'gamecoin', colors: ['#7c3aed', '#4338ca', '#a78bfa'] },
  { id: 'bg-mono',    type: 'background', name: 'Graphite',        desc: 'Sleek monochrome gradient', price: 150, currency: 'gamecoin', colors: ['#374151', '#6b7280', '#9ca3af'] },

  // ── Profile · Shape (GameCoin) ───────────────────────────────────
  { id: 'av-shape-star',    type: 'profile_shape', name: 'Astral Star',    desc: 'A five-pointed sigil for those who aim beyond the horizon', price: 350, currency: 'gamecoin', apply: { shape: 'star' } },
  { id: 'av-shape-diamond', type: 'profile_shape', name: 'Royal Diamond',  desc: 'Cut with precision, worn with intent',                      price: 400, currency: 'gamecoin', apply: { shape: 'diamond' } },
  { id: 'av-shape-shield',  type: 'profile_shape', name: 'Aegis Crest',    desc: 'A heraldic shield for the unyielding',                      price: 450, currency: 'gamecoin', apply: { shape: 'shield' } },
  { id: 'av-shape-gear',    type: 'profile_shape', name: 'Chrono Cog',     desc: 'Precision-machined elegance in motion',                     price: 500, currency: 'gamecoin', apply: { shape: 'gear' } },
  { id: 'av-shape-moon',    type: 'profile_shape', name: 'Crescent Moon',  desc: 'Bask in the quiet luxury of nightfall',                     price: 600, currency: 'gamecoin', apply: { shape: 'moon' } },

  // ── Profile · Avatar outlines (ACoin) ────────────────────────────
  { id: 'av-avatar-cat',   type: 'profile_avatar', name: 'Midnight Cat',    desc: 'Silent whiskers, impeccable taste',            price: 220, currency: 'acoin', apply: { avatar: 'cat' } },
  { id: 'av-avatar-dog',   type: 'profile_avatar', name: 'Loyal Hound',     desc: 'Ears up, standards higher',                    price: 220, currency: 'acoin', apply: { avatar: 'dog' } },
  { id: 'av-avatar-owl',   type: 'profile_avatar', name: 'Sage Owl',        desc: 'Wisdom, perched elegantly overhead',           price: 300, currency: 'acoin', apply: { avatar: 'owl' } },
  { id: 'av-avatar-ninja', type: 'profile_avatar', name: 'Shadow Ninja',    desc: 'A headband that whispers, never shouts',       price: 380, currency: 'acoin', apply: { avatar: 'ninja' } },
  { id: 'av-avatar-robot', type: 'profile_avatar', name: 'Mecha Sovereign', desc: 'Chrome antennae for the digitally divine',     price: 450, currency: 'acoin', apply: { avatar: 'robot' } },

  // ── Profile · Style / accessories (ACoin) ────────────────────────
  { id: 'av-style-crown',   type: 'profile_style', name: 'Regal Crown',        desc: 'Because some heads were made to be crowned',      price: 320, currency: 'acoin', apply: { style: 'crown' } },
  { id: 'av-style-halo',    type: 'profile_style', name: 'Halo of Ascension',  desc: 'Hand-polished sainthood, subtle gleam included',  price: 360, currency: 'acoin', apply: { style: 'halo' } },
  { id: 'av-style-monocle', type: 'profile_style', name: 'Monocle of Wisdom',  desc: 'See the world one refined eye at a time',         price: 280, currency: 'acoin', apply: { style: 'monocle' } },
  { id: 'av-style-shades',  type: 'profile_style', name: 'Midnight Shades',    desc: 'Effortless mystique, tinted to perfection',       price: 300, currency: 'acoin', apply: { style: 'shades' } },
  { id: 'av-style-visor',   type: 'profile_style', name: 'Cyber Visor',        desc: 'Heads-up display for a head above the rest',      price: 420, currency: 'acoin', apply: { style: 'visor' } },

  // ── Profile · Face expressions (ACoin) ───────────────────────────
  { id: 'av-face-happy', type: 'profile_face', name: 'Radiant Joy',  desc: 'A smile with standing-room only',          price: 240, currency: 'acoin', apply: { face: 'happy' } },
  { id: 'av-face-love',  type: 'profile_face', name: 'Heartstruck',  desc: 'Wear your heart on both eyes',             price: 260, currency: 'acoin', apply: { face: 'love' } },
  { id: 'av-face-zen',   type: 'profile_face', name: 'Zen Master',   desc: 'Unbothered. Moisturized. In his lane.',    price: 340, currency: 'acoin', apply: { face: 'zen' } },
  { id: 'av-face-angry', type: 'profile_face', name: 'Storm Fury',   desc: 'For days when the forecast is vengeance',  price: 300, currency: 'acoin', apply: { face: 'angry' } },
  { id: 'av-face-ghost', type: 'profile_face', name: 'Phantom Wisp', desc: 'Hauntingly handsome, translucently chic',  price: 380, currency: 'acoin', apply: { face: 'ghost' } },

  // ── Profile · Color duos (ACoin) — shape hue + style accent ─────
  { id: 'av-color-monarch',  type: 'profile_color', name: 'Monarch’s Court',  desc: 'Deep royal purple beneath a gilded crown of gold', price: 320, currency: 'acoin', apply: { shapeColor: '#312e81', styleColor: '#fbbf24' } },
  { id: 'av-color-amethyst', type: 'profile_color', name: 'Royal Amethyst',   desc: 'Violet regency with a lavender flourish',          price: 380, currency: 'acoin', apply: { shapeColor: '#5b21b6', styleColor: '#c4b5fd' } },
  { id: 'av-color-heirloom', type: 'profile_color', name: 'Emerald Heirloom', desc: 'Old money green, new money shine',                 price: 440, currency: 'acoin', apply: { shapeColor: '#065f46', styleColor: '#6ee7b7' } },
  { id: 'av-color-dynasty',  type: 'profile_color', name: 'Crimson Dynasty',  desc: 'Blood-red legacy with a rose-gold seal',           price: 520, currency: 'acoin', apply: { shapeColor: '#7f1d1d', styleColor: '#fda4af' } },
  { id: 'av-color-arctic',   type: 'profile_color', name: 'Arctic Nobility',  desc: 'Glacial poise crowned with polar silver',          price: 640, currency: 'acoin', apply: { shapeColor: '#0c4a6e', styleColor: '#bae6fd' } },

  // ── Titles (ACoin) ───────────────────────────────────────────────
  { id: 'title-scholar', type: 'title', name: 'Scholar',  desc: 'Show off your dedication', price: 300, currency: 'acoin', title: 'Scholar' },
  { id: 'title-legend',  type: 'title', name: 'Legend',   desc: 'An elite title for elites', price: 600, currency: 'acoin', title: 'Legend' },
  { id: 'title-champ',   type: 'title', name: 'Champion', desc: 'For the champions of learning', price: 500, currency: 'acoin', title: 'Champion' },
  { id: 'title-guru',    type: 'title', name: 'Guru',     desc: 'Trusted as a true guru', price: 450, currency: 'acoin', title: 'Guru' },

  // ── Boosters (timed XP multipliers) ──────────────────────────────
  { id: 'boost-fuel',    type: 'booster', name: 'Focus Fuel',     desc: 'Double XP for a power hour',          price: 150, currency: 'gamecoin', boost: { multiplier: 2, durationHours: 1 } },
  { id: 'boost-aura',    type: 'booster', name: "Scholar's Aura", desc: 'Double XP across a long session',     price: 400, currency: 'gamecoin', boost: { multiplier: 2, durationHours: 3 } },
  { id: 'boost-amplify', type: 'booster', name: 'Grand Amplifier',desc: 'Triple XP for sixty fierce minutes',  price: 500, currency: 'acoin',    boost: { multiplier: 3, durationHours: 1 } },
  { id: 'boost-ascend',  type: 'booster', name: 'Ascendance',     desc: 'Triple XP for a full day of glory',   price: 900, currency: 'acoin',    boost: { multiplier: 3, durationHours: 24 } },
];

/** Is a booster currently active for this user? */
export function getActiveBooster(user, now = Date.now()) {
  const id = user?.equipped?.booster;
  const expires = user?.booster_expires || 0;
  if (!id || now >= expires) return null;
  return SHOP_ITEMS.find((it) => it.id === id && it.type === 'booster') || null;
}

// Default (always owned, free) items shown as unlocked by every user
export const DEFAULT_OWNED_IDS = ['bg-ocean'];
