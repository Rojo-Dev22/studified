// ─── Shop catalog: exclusive unlocks purchasable with coins ─────────
// Categories:
//   background — profile banner backgrounds
//   palette    — exclusive avatar palette combos
//   title      — exclusive profile titles
// Each item costs either GameCoin or ACoin. Purchases are added to the
// user's `owned_items` and can be equipped in `equipped`.

export const SHOP_CATEGORIES = [
  { id: 'background', label: 'Backgrounds', desc: 'Exclusive profile banner backgrounds', currency: 'gamecoin' },
  { id: 'palette', label: 'Profile Combos', desc: 'Avatar palette combos to stand out', currency: 'acoin' },
  { id: 'title', label: 'Titles', desc: 'Exclusive profile titles', currency: 'acoin' },
];

export const SHOP_ITEMS = [
  // ── Backgrounds (GameCoin) ───────────────────────────────────────
  { id: 'bg-ocean',   type: 'background', name: 'Ocean Waves',   desc: 'Deep ocean blues for your banner', price: 200, currency: 'gamecoin', colors: ['#0ea5e9', '#22d3ee', '#a5f3fc'] },
  { id: 'bg-sunset',  type: 'background', name: 'Desert Sunset', desc: 'Warm amber and rose horizons', price: 200, currency: 'gamecoin', colors: ['#f59e0b', '#f43f5e', '#fda4af'] },
  { id: 'bg-forest',  type: 'background', name: 'Emerald Forest', desc: 'Rich greens and teal depths', price: 250, currency: 'gamecoin', colors: ['#059669', '#10b981', '#6ee7b7'] },
  { id: 'bg-galaxy',  type: 'background', name: 'Midnight Galaxy', desc: 'Violet nebula across the banner', price: 300, currency: 'gamecoin', colors: ['#7c3aed', '#4338ca', '#a78bfa'] },
  { id: 'bg-mono',    type: 'background', name: 'Graphite',      desc: 'Sleek monochrome gradient', price: 150, currency: 'gamecoin', colors: ['#374151', '#6b7280', '#9ca3af'] },

  // ── Palette Combos (ACoin) ───────────────────────────────────────
  { id: 'pal-gold',   type: 'palette', name: 'Golden Elite', desc: 'Luxurious gold palette', price: 150, currency: 'acoin', palette: { name: 'Golden', bg: '#d97706', inner: '#f59e0b', accent: '#fcd34d', key: 'shop-golden' } },
  { id: 'pal-neon',   type: 'palette', name: 'Neon Pulse',  desc: 'Electric cyan & lime combo', price: 150, currency: 'acoin', palette: { name: 'Neon', bg: '#06b6d4', inner: '#22d3ee', accent: '#a3e635', key: 'shop-neon' } },
  { id: 'pal-royal',  type: 'palette', name: 'Royal Violet', desc: 'Deep royal violet palette', price: 150, currency: 'acoin', palette: { name: 'Royal', bg: '#5b21b6', inner: '#7c3aed', accent: '#c4b5fd', key: 'shop-royal' } },
  { id: 'pal-ember',  type: 'palette', name: 'Ember',       desc: 'Fiery crimson palette', price: 150, currency: 'acoin', palette: { name: 'Ember', bg: '#b91c1c', inner: '#ef4444', accent: '#fca5a5', key: 'shop-ember' } },

  // ── Titles (ACoin) ───────────────────────────────────────────────
  { id: 'title-scholar', type: 'title', name: 'Scholar',    desc: 'Show off your dedication', price: 300, currency: 'acoin', title: 'Scholar' },
  { id: 'title-legend',  type: 'title', name: 'Legend',     desc: 'An elite title for elites', price: 600, currency: 'acoin', title: 'Legend' },
  { id: 'title-champ',   type: 'title', name: 'Champion',   desc: 'For the champions of learning', price: 500, currency: 'acoin', title: 'Champion' },
  { id: 'title-guru',    type: 'title', name: 'Guru',       desc: 'Trusted as a true guru', price: 450, currency: 'acoin', title: 'Guru' },
];

// Default (always owned, free) items shown as unlocked by every user
export const DEFAULT_OWNED_IDS = ['bg-ocean'];
