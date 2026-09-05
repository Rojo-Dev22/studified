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
  { id: 'bga-bloom',    type: 'background', name: 'Bloom Pop',     desc: 'Playful pastels gently pulsing',          price: 500, currency: 'gamecoin', colors: ['#db2777', '#f472b6', '#fbcfe8'], animated: true, anim: 'pop' },
  { id: 'bga-ember',    type: 'background', name: 'Ember Flow',    desc: 'Warm currents of fire and gold',          price: 550, currency: 'gamecoin', colors: ['#b45309', '#ea580c', '#fbbf24'], animated: true, anim: 'ember' },
  { id: 'bga-frost',    type: 'background', name: 'Frost Sheen',   desc: 'Glacial gradients with a glinting sheen', price: 600, currency: 'gamecoin', colors: ['#0c4a6e', '#0284c7', '#bae6fd'], animated: true, anim: 'shimmer' },
  { id: 'bga-aurora',   type: 'background', name: 'Aurora Veil',   desc: 'Northern lights drifting overhead',       price: 650, currency: 'gamecoin', colors: ['#4338ca', '#7c3aed', '#22d3ee'], animated: true, anim: 'aurora' },
  { id: 'bga-stargaze', type: 'background', name: 'Stargazer',     desc: 'A midnight sky twinkling with stars',     price: 700, currency: 'gamecoin', colors: ['#172554', '#4338ca', '#93c5fd'], animated: true, anim: 'stars' },
  { id: 'bga-nebula',   type: 'background', name: 'Nebula Drift',  desc: 'Slow-motion galaxy clouds and stardust',  price: 750, currency: 'gamecoin', colors: ['#1e1b4b', '#6d28d9', '#c084fc'], animated: true, anim: 'nebula' },
  { id: 'bg-candy',   type: 'background', name: 'Cotton Candy',   desc: 'Sugar-spun skies in pastel swirls',     price: 350, currency: 'gamecoin', colors: ['#f472b6', '#c084fc', '#a5f3fc'] },
  { id: 'bg-lava',    type: 'background', name: 'Molten Lava',    desc: 'Magma veins across a scorched banner',  price: 400, currency: 'gamecoin', colors: ['#7f1d1d', '#ea580c', '#fbbf24'] },
  { id: 'bg-arctic',  type: 'background', name: 'Arctic Frost',   desc: 'Polar blues with a crystalline finish', price: 350, currency: 'gamecoin', colors: ['#0ea5e9', '#7dd3fc', '#f0f9ff'] },
  { id: 'bg-royal',   type: 'background', name: 'Royal Velvet',   desc: 'Deep velvet purples fit for a throne',  price: 450, currency: 'gamecoin', colors: ['#4c1d95', '#7c3aed', '#c4b5fd'] },
  { id: 'bg-matcha',  type: 'background', name: 'Matcha Cafe',    desc: 'Calming greens for slow mornings',      price: 350, currency: 'gamecoin', colors: ['#3f6212', '#65a30d', '#bef264'] },
  { id: 'bga-volcano', type: 'background', name: 'Volcano Wake',  desc: 'Erupting embers over molten rock',       price: 750, currency: 'gamecoin', colors: ['#450a0a', '#dc2626', '#f97316'], animated: true, anim: 'ember' },
  { id: 'bga-lagoon',  type: 'background', name: 'Lagoon Dreams', desc: 'Teal curtains dancing over still water', price: 800, currency: 'gamecoin', colors: ['#134e4a', '#0d9488', '#5eead4'], animated: true, anim: 'aurora' },
  { id: 'bga-orchid',  type: 'background', name: 'Orchid Pulse',  desc: 'Radiant blooms popping in rhythm',       price: 700, currency: 'gamecoin', colors: ['#701a75', '#d946ef', '#f5d0fe'], animated: true, anim: 'pop' },
  { id: 'bga-cosmos',  type: 'background', name: 'Cosmic Voyage', desc: 'Drift through clouds of deep space',     price: 850, currency: 'gamecoin', colors: ['#020617', '#4338ca', '#818cf8'], animated: true, anim: 'nebula' },
  // ── Profile · Shape (GameCoin) ───────────────────────────────────
  { id: 'av-shape-star',    type: 'profile_shape', name: 'Astral Star',    desc: 'A five-pointed sigil for those who aim beyond the horizon', price: 350, currency: 'gamecoin', apply: { shape: 'star' } },
  { id: 'av-shape-diamond', type: 'profile_shape', name: 'Royal Diamond',  desc: 'Cut with precision, worn with intent',                      price: 400, currency: 'gamecoin', apply: { shape: 'diamond' } },
  { id: 'av-shape-shield',  type: 'profile_shape', name: 'Aegis Crest',    desc: 'A heraldic shield for the unyielding',                      price: 450, currency: 'gamecoin', apply: { shape: 'shield' } },
  { id: 'av-shape-gear',    type: 'profile_shape', name: 'Chrono Cog',     desc: 'Precision-machined elegance in motion',                     price: 500, currency: 'gamecoin', apply: { shape: 'gear' } },
  { id: 'av-shape-moon',    type: 'profile_shape', name: 'Crescent Moon',  desc: 'Bask in the quiet luxury of nightfall',                     price: 600, currency: 'gamecoin', apply: { shape: 'moon' } },
  { id: 'av-shape-flower',  type: 'profile_shape', name: 'Bloom',          desc: 'Petal-perfect and always in season',          price: 260, currency: 'gamecoin', apply: { shape: 'flower' } },
  { id: 'av-shape-heart',   type: 'profile_shape', name: 'Sweetheart',     desc: 'Wear your favorite shape on your sleeve',     price: 300, currency: 'gamecoin', apply: { shape: 'heart' } },
  { id: 'av-shape-bolt',    type: 'profile_shape', name: 'Thunderbolt',    desc: 'Fast ideas, faster silhouettes',              price: 280, currency: 'gamecoin', apply: { shape: 'bolt' } },
  { id: 'av-shape-leaf',    type: 'profile_shape', name: 'Verdant Leaf',   desc: 'Naturally refined, endlessly growing',        price: 240, currency: 'gamecoin', apply: { shape: 'leaf' } },
  { id: 'av-shape-burst',   type: 'profile_shape', name: 'Stardust Burst', desc: 'Twelve points of pure spectacle',             price: 320, currency: 'gamecoin', apply: { shape: 'burst' } },
  { id: 'av-shape-capsule', type: 'profile_shape', name: 'Capsule',        desc: 'Smooth, rounded and ahead of the curve',      price: 220, currency: 'gamecoin', apply: { shape: 'capsule' } },
  { id: 'av-shape-arch',    type: 'profile_shape', name: 'Archway',        desc: 'A grand entrance for a grand mind',           price: 240, currency: 'gamecoin', apply: { shape: 'arch' } },
  { id: 'av-shape-gem',     type: 'profile_shape', name: 'Royal Gem',      desc: 'Faceted like the crown jewels',               price: 340, currency: 'gamecoin', apply: { shape: 'gem' } },
  { id: 'av-shape-cloud',   type: 'profile_shape', name: 'Daydream',       desc: 'Head permanently in the clouds',              price: 260, currency: 'gamecoin', apply: { shape: 'cloud' } },
  { id: 'av-shape-splat',   type: 'profile_shape', name: 'Paint Splat',    desc: 'Artistic chaos, beautifully contained',       price: 300, currency: 'gamecoin', apply: { shape: 'splat' } },
  // ── Profile · Avatar outlines (ACoin) ────────────────────────────
  { id: 'av-avatar-cat',   type: 'profile_avatar', name: 'Midnight Cat',    desc: 'Silent whiskers, impeccable taste',            price: 220, currency: 'acoin', apply: { avatar: 'cat' } },
  { id: 'av-avatar-dog',   type: 'profile_avatar', name: 'Loyal Hound',     desc: 'Ears up, standards higher',                    price: 220, currency: 'acoin', apply: { avatar: 'dog' } },
  { id: 'av-avatar-owl',   type: 'profile_avatar', name: 'Sage Owl',        desc: 'Wisdom, perched elegantly overhead',           price: 300, currency: 'acoin', apply: { avatar: 'owl' } },
  { id: 'av-avatar-ninja', type: 'profile_avatar', name: 'Shadow Ninja',    desc: 'A headband that whispers, never shouts',       price: 380, currency: 'acoin', apply: { avatar: 'ninja' } },
  { id: 'av-avatar-robot', type: 'profile_avatar', name: 'Mecha Sovereign', desc: 'Chrome antennae for the digitally divine',     price: 450, currency: 'acoin', apply: { avatar: 'robot' } },
  { id: 'av-avatar-hedgehog', type: 'profile_avatar', name: 'Prickle Pal',         desc: 'Small friend, big spiky heart',          price: 300, currency: 'acoin', apply: { avatar: 'hedgehog' } },
  { id: 'av-avatar-frog',    type: 'profile_avatar', name: 'Pond Hopper',         desc: 'Small leaps, giant vibes',               price: 260, currency: 'acoin', apply: { avatar: 'frog' } },
  { id: 'av-avatar-hare',    type: 'profile_avatar', name: 'Swift Hare',          desc: 'Soft steps and quicker wits',            price: 280, currency: 'acoin', apply: { avatar: 'hare' } },
  { id: 'av-avatar-deer',    type: 'profile_avatar', name: 'Forest Stag',         desc: 'Crowned by the woodland itself',         price: 340, currency: 'acoin', apply: { avatar: 'deer' } },
  { id: 'av-avatar-koala',   type: 'profile_avatar', name: 'Eucalyptus Pal',      desc: 'Professional hugger, part-time napper',  price: 300, currency: 'acoin', apply: { avatar: 'koala' } },
  { id: 'av-avatar-bee',     type: 'profile_avatar', name: 'Honeybee',            desc: 'Busy by nature, sweet by choice',        price: 260, currency: 'acoin', apply: { avatar: 'bee' } },
  { id: 'av-avatar-penguin', type: 'profile_avatar', name: 'Tuxedo Waddler',      desc: 'Formally dressed for any occasion',      price: 320, currency: 'acoin', apply: { avatar: 'penguin' } },
  { id: 'av-avatar-lion',    type: 'profile_avatar', name: 'Pride Leader',        desc: 'A mane that commands the room',          price: 380, currency: 'acoin', apply: { avatar: 'lion' } },
  { id: 'av-avatar-octo',    type: 'profile_avatar', name: 'Deepcurrent Octo',    desc: 'Eight arms, endless multitasking',       price: 340, currency: 'acoin', apply: { avatar: 'octo' } },
  { id: 'av-avatar-vampire', type: 'profile_avatar', name: 'Midnight Aristocrat', desc: 'Immortal style, impeccable collar',      price: 400, currency: 'acoin', apply: { avatar: 'vampire' } },
  // ── Profile · Style / accessories (ACoin) ────────────────────────
  { id: 'av-style-crown',   type: 'profile_style', name: 'Regal Crown',        desc: 'Because some heads were made to be crowned',      price: 320, currency: 'acoin', apply: { style: 'crown' } },
  { id: 'av-style-halo',    type: 'profile_style', name: 'Halo of Ascension',  desc: 'Hand-polished sainthood, subtle gleam included',  price: 360, currency: 'acoin', apply: { style: 'halo' } },
  { id: 'av-style-monocle', type: 'profile_style', name: 'Monocle of Wisdom',  desc: 'See the world one refined eye at a time',         price: 280, currency: 'acoin', apply: { style: 'monocle' } },
  { id: 'av-style-shades',  type: 'profile_style', name: 'Midnight Shades',    desc: 'Effortless mystique, tinted to perfection',       price: 300, currency: 'acoin', apply: { style: 'shades' } },
  { id: 'av-style-visor',   type: 'profile_style', name: 'Cyber Visor',        desc: 'Heads-up display for a head above the rest',      price: 420, currency: 'acoin', apply: { style: 'visor' } },
  { id: 'av-style-tiara',       type: 'profile_style', name: 'Crystal Tiara',    desc: 'Delicate sparkle, serious presence',   price: 360, currency: 'acoin', apply: { style: 'tiara' } },
  { id: 'av-style-tophat',      type: 'profile_style', name: 'Grand Top Hat',    desc: 'Nothing says sophistication louder',   price: 380, currency: 'acoin', apply: { style: 'tophat' } },
  { id: 'av-style-beanie',      type: 'profile_style', name: 'Cozy Beanie',      desc: 'Warm head, warmer takes',              price: 240, currency: 'acoin', apply: { style: 'beanie' } },
  { id: 'av-style-flowercrown', type: 'profile_style', name: 'Flower Crown',     desc: 'Springtime royalty, all year round',   price: 280, currency: 'acoin', apply: { style: 'flowercrown' } },
  { id: 'av-style-eyepatch',    type: 'profile_style', name: 'Corsair Eyepatch', desc: 'Half the view, twice the adventure',   price: 300, currency: 'acoin', apply: { style: 'eyepatch' } },
  { id: 'av-style-earrings',    type: 'profile_style', name: 'Starlit Drops',    desc: 'A little sparkle by the ears',         price: 220, currency: 'acoin', apply: { style: 'earrings' } },
  { id: 'av-style-necklace',    type: 'profile_style', name: 'Pearl Strand',     desc: 'Classic elegance, one bead at a time', price: 260, currency: 'acoin', apply: { style: 'necklace' } },
  { id: 'av-style-starclip',    type: 'profile_style', name: 'Comet Clips',      desc: 'Stellar accents pinned in place',      price: 240, currency: 'acoin', apply: { style: 'starclip' } },
  { id: 'av-style-antenna',     type: 'profile_style', name: 'Alien Antenna',    desc: 'Stay connected to the mothership',     price: 260, currency: 'acoin', apply: { style: 'antenna' } },
  { id: 'av-style-horns',       type: 'profile_style', name: 'Doom Horns',       desc: 'Adorably menacing headgear',           price: 380, currency: 'acoin', apply: { style: 'horns' } },
  // ── Profile · Face expressions (ACoin) ───────────────────────────
  { id: 'av-face-happy', type: 'profile_face', name: 'Radiant Joy',  desc: 'A smile with standing-room only',          price: 240, currency: 'acoin', apply: { face: 'happy' } },
  { id: 'av-face-love',  type: 'profile_face', name: 'Heartstruck',  desc: 'Wear your heart on both eyes',             price: 260, currency: 'acoin', apply: { face: 'love' } },
  { id: 'av-face-zen',   type: 'profile_face', name: 'Zen Master',   desc: 'Unbothered. Moisturized. In his lane.',    price: 340, currency: 'acoin', apply: { face: 'zen' } },
  { id: 'av-face-angry', type: 'profile_face', name: 'Storm Fury',   desc: 'For days when the forecast is vengeance',  price: 300, currency: 'acoin', apply: { face: 'angry' } },
  { id: 'av-face-ghost', type: 'profile_face', name: 'Phantom Wisp', desc: 'Hauntingly handsome, translucently chic',  price: 380, currency: 'acoin', apply: { face: 'ghost' } },
  { id: 'av-face-wink',   type: 'profile_face', name: 'Quick Wink',     desc: 'In on every joke, especially yours',  price: 220, currency: 'acoin', apply: { face: 'wink' } },
  { id: 'av-face-cry',    type: 'profile_face', name: 'Waterworks',     desc: 'Moved to tears by chapter twelve',    price: 260, currency: 'acoin', apply: { face: 'cry' } },
  { id: 'av-face-grin',   type: 'profile_face', name: 'Big Grin',       desc: 'Cannot contain the excitement',       price: 300, currency: 'acoin', apply: { face: 'grin' } },
  { id: 'av-face-sleepy', type: 'profile_face', name: 'Dreamy Doze',    desc: 'Studying in dream mode',              price: 240, currency: 'acoin', apply: { face: 'sleepy' } },
  { id: 'av-face-dizzy',  type: 'profile_face', name: 'Dizzy Genius',   desc: 'So smart it spins',                   price: 260, currency: 'acoin', apply: { face: 'dizzy' } },
  { id: 'av-face-smirk',  type: 'profile_face', name: 'Sly Smirk',      desc: 'You know exactly what you did',       price: 240, currency: 'acoin', apply: { face: 'smirk' } },
  { id: 'av-face-shock',  type: 'profile_face', name: 'Shocked Sensei', desc: 'Wait — that was on the exam?',        price: 260, currency: 'acoin', apply: { face: 'shock' } },
  { id: 'av-face-blush',  type: 'profile_face', name: 'Sweet Blush',    desc: 'Compliments land every time',         price: 220, currency: 'acoin', apply: { face: 'blush' } },
  { id: 'av-face-fierce', type: 'profile_face', name: 'Fierce Focus',   desc: 'Locking in, no distractions',         price: 280, currency: 'acoin', apply: { face: 'fierce' } },
  { id: 'av-face-stellar',type: 'profile_face', name: 'Starstruck',     desc: 'Eyes full of constellations',         price: 320, currency: 'acoin', apply: { face: 'stellar' } },
  // ── Profile · Color duos (ACoin) — shape hue + style accent ─────
  { id: 'av-color-monarch',  type: 'profile_color', name: 'Monarch’s Court',  desc: 'Deep royal purple beneath a gilded crown of gold', price: 320, currency: 'acoin', apply: { shapeColor: '#312e81', styleColor: '#fbbf24' } },
  { id: 'av-color-amethyst', type: 'profile_color', name: 'Royal Amethyst',   desc: 'Violet regency with a lavender flourish',          price: 380, currency: 'acoin', apply: { shapeColor: '#5b21b6', styleColor: '#c4b5fd' } },
  { id: 'av-color-heirloom', type: 'profile_color', name: 'Emerald Heirloom', desc: 'Old money green, new money shine',                 price: 440, currency: 'acoin', apply: { shapeColor: '#065f46', styleColor: '#6ee7b7' } },
  { id: 'av-color-dynasty',  type: 'profile_color', name: 'Crimson Dynasty',  desc: 'Blood-red legacy with a rose-gold seal',           price: 520, currency: 'acoin', apply: { shapeColor: '#7f1d1d', styleColor: '#fda4af' } },
  { id: 'av-color-arctic',   type: 'profile_color', name: 'Arctic Nobility',  desc: 'Glacial poise crowned with polar silver',          price: 640, currency: 'acoin', apply: { shapeColor: '#0c4a6e', styleColor: '#bae6fd' } },
  { id: 'av-color-solar',    type: 'profile_color', name: 'Solar Regalia',   desc: 'Burnt sienna under a gilded sun',       price: 420, currency: 'acoin', apply: { shapeColor: '#9a3412', styleColor: '#fde68a' } },
  { id: 'av-color-jade',     type: 'profile_color', name: 'Jade Empire',     desc: 'Deep jade with pale celadon trim',      price: 460, currency: 'acoin', apply: { shapeColor: '#14532d', styleColor: '#a7f3d0' } },
  { id: 'av-color-sapphire', type: 'profile_color', name: 'Sapphire Throne', desc: 'Midnight blue with icy diamond trim',   price: 480, currency: 'acoin', apply: { shapeColor: '#1e3a8a', styleColor: '#bfdbfe' } },
  { id: 'av-color-rose',     type: 'profile_color', name: 'Rosé Royalty',    desc: 'Wine-dark elegance, blush-gold finish', price: 440, currency: 'acoin', apply: { shapeColor: '#9f1239', styleColor: '#fecdd3' } },
  { id: 'av-color-onyx',     type: 'profile_color', name: 'Onyx Opulence',   desc: 'Near-black luxury with silver trim',    price: 520, currency: 'acoin', apply: { shapeColor: '#1c1917', styleColor: '#94a3b8' } },
  { id: 'av-color-umber',    type: 'profile_color', name: 'Umber Duke',      desc: 'Rich cacao beneath warm champagne',     price: 480, currency: 'acoin', apply: { shapeColor: '#451a03', styleColor: '#fcd34d' } },
  { id: 'av-color-lagoon',   type: 'profile_color', name: 'Lagoon Lord',     desc: 'Abyssal teal with seafoam shimmer',     price: 480, currency: 'acoin', apply: { shapeColor: '#134e4a', styleColor: '#5eead4' } },
  { id: 'av-color-amethystine', type: 'profile_color', name: 'Amethyst Duke',   desc: 'Royal velvet with lilac lace',          price: 500, currency: 'acoin', apply: { shapeColor: '#4c1d95', styleColor: '#e9d5ff' } },
  { id: 'av-color-copper',   type: 'profile_color', name: 'Copper Crown',    desc: 'Hammered copper with apricot gleam',    price: 520, currency: 'acoin', apply: { shapeColor: '#7c2d12', styleColor: '#fdba74' } },
  { id: 'av-color-midnight', type: 'profile_color', name: 'Midnight Rose',   desc: 'Dark plum kissed by rose quartz',       price: 560, currency: 'acoin', apply: { shapeColor: '#4a044e', styleColor: '#f9a8d4' } },
  // ── Titles (ACoin) ───────────────────────────────────────────────
  { id: 'title-scholar', type: 'title', name: 'Scholar',  desc: 'Show off your dedication', price: 300, currency: 'acoin', title: 'Scholar' },
  { id: 'title-legend',  type: 'title', name: 'Legend',   desc: 'An elite title for elites', price: 600, currency: 'acoin', title: 'Legend' },
  { id: 'title-champ',   type: 'title', name: 'Champion', desc: 'For the champions of learning', price: 500, currency: 'acoin', title: 'Champion' },
  { id: 'title-guru',    type: 'title', name: 'Guru',     desc: 'Trusted as a true guru', price: 450, currency: 'acoin', title: 'Guru' },
  { id: 'title-ace',        type: 'title', name: 'Ace',          desc: 'First in everything you try',            price: 200, currency: 'acoin', title: 'Ace' },
  { id: 'title-bookworm',   type: 'title', name: 'Bookworm',     desc: 'Happiest between two covers',            price: 200, currency: 'acoin', title: 'Bookworm' },
  { id: 'title-nightowl',   type: 'title', name: 'Night Owl',    desc: 'Owns the after-hours grind',             price: 250, currency: 'acoin', title: 'Night Owl' },
  { id: 'title-prodigy',    type: 'title', name: 'Prodigy',      desc: 'Talent that shows up early',             price: 350, currency: 'acoin', title: 'Prodigy' },
  { id: 'title-wordsmith',  type: 'title', name: 'Word Wizard',  desc: 'Casts spells with vocabulary',           price: 300, currency: 'acoin', title: 'Word Wizard' },
  { id: 'title-mathlete',   type: 'title', name: 'Mathlete',     desc: 'Numbers fear no one, least of all you',  price: 300, currency: 'acoin', title: 'Mathlete' },
  { id: 'title-mastermind', type: 'title', name: 'Mastermind',   desc: 'Every plan has your fingerprint',        price: 550, currency: 'acoin', title: 'Mastermind' },
  { id: 'title-trailblazer',type: 'title', name: 'Trailblazer',  desc: 'Goes first so others can follow',        price: 400, currency: 'acoin', title: 'Trailblazer' },
  { id: 'title-virtuoso',   type: 'title', name: 'Virtuoso',     desc: 'Effortless mastery on display',          price: 650, currency: 'acoin', title: 'Virtuoso' },
  { id: 'title-sensei',     type: 'title', name: 'Sensei',       desc: 'Teacher of teachers',                    price: 700, currency: 'acoin', title: 'Sensei' },
  // ── Boosters (timed XP multipliers) ──────────────────────────────
  { id: 'boost-fuel',    type: 'booster', name: 'Focus Fuel',     desc: 'Double XP for a power hour',          price: 150, currency: 'gamecoin', boost: { multiplier: 2, durationHours: 1 } },
  { id: 'boost-aura',    type: 'booster', name: "Scholar's Aura", desc: 'Double XP across a long session',     price: 400, currency: 'gamecoin', boost: { multiplier: 2, durationHours: 3 } },
  { id: 'boost-amplify', type: 'booster', name: 'Grand Amplifier',desc: 'Triple XP for sixty fierce minutes',  price: 500, currency: 'acoin',    boost: { multiplier: 3, durationHours: 1 } },
  { id: 'boost-ascend',  type: 'booster', name: 'Ascendance',     desc: 'Triple XP for a full day of glory',   price: 900, currency: 'acoin',    boost: { multiplier: 3, durationHours: 24 } },
  { id: 'boost-spark',    type: 'booster', name: 'Spark Surge',     desc: 'A gentle 1.5x nudge for two hours',    price: 250, currency: 'gamecoin', boost: { multiplier: 1.5, durationHours: 2 } },
  { id: 'boost-tide',     type: 'booster', name: 'Study Tide',      desc: '1.5x XP across a four-hour tide',      price: 400, currency: 'gamecoin', boost: { multiplier: 1.5, durationHours: 4 } },
  { id: 'boost-blitz',    type: 'booster', name: 'Blitz Rush',      desc: 'Double XP in thirty frantic minutes',  price: 120, currency: 'gamecoin', boost: { multiplier: 2, durationHours: .5 } },
  { id: 'boost-marathon', type: 'booster', name: 'Marathon Mind',   desc: 'Double XP for a six-hour marathon',    price: 650, currency: 'gamecoin', boost: { multiplier: 2, durationHours: 6 } },
  { id: 'boost-eclipse',  type: 'booster', name: 'Eclipse Empower', desc: '2.5x XP while the shadow lasts',       price: 550, currency: 'gamecoin', boost: { multiplier: 2.5, durationHours: 2 } },
  { id: 'boost-nova',     type: 'booster', name: 'Nova Burst',      desc: 'Triple XP, thirty explosive minutes',  price: 300, currency: 'gamecoin', boost: { multiplier: 3, durationHours: .5 } },
  { id: 'boost-titan',    type: 'booster', name: 'Titan Focus',     desc: 'Quadruple XP for one mighty hour',     price: 700, currency: 'acoin', boost: { multiplier: 4, durationHours: 1 } },
  { id: 'boost-quasar',   type: 'booster', name: 'Quasar Drive',    desc: 'Quadruple XP across two hours',        price: 1100, currency: 'acoin', boost: { multiplier: 4, durationHours: 2 } },
  { id: 'boost-galaxy',   type: 'booster', name: 'Galaxy Grind',    desc: 'Quintuple XP in a half-hour sprint',   price: 800, currency: 'acoin', boost: { multiplier: 5, durationHours: .5 } },
  { id: 'boost-eternal',  type: 'booster', name: 'Eternal Engine',  desc: 'Triple XP for twelve straight hours',  price: 1500, currency: 'acoin', boost: { multiplier: 3, durationHours: 12 } },];

/** Is a booster currently active for this user? */
export function getActiveBooster(user, now = Date.now()) {
  const id = user?.equipped?.booster;
  const expires = user?.booster_expires || 0;
  if (!id || now >= expires) return null;
  return SHOP_ITEMS.find((it) => it.id === id && it.type === 'booster') || null;
}

// Default (always owned, free) items shown as unlocked by every user
export const DEFAULT_OWNED_IDS = ['bg-ocean'];
