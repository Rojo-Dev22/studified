import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Check, GameCoinIcon, ACoinIcon, ShoppingBag, Image, User, Crown, Zap,
  Rocket, Shapes, Sparkles, Smile, Palette, Paw,
} from '@/components/ui/icons';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import CoinWallet from '../components/ui/CoinWallet';
import GlassTabs from '../components/ui/GlassTabs';
import { Button } from '../components/ui/button';
import { db } from '@/lib/db';
import { spendCoins } from '@/lib/coins';
import { SHOP_CATEGORIES, SHOP_ITEMS, PROFILE_SUBCATEGORIES } from '@/lib/shopItems';
import { normalizeAvatarConfig, renderAvatarSvg, avatarSvgToDataUri } from '@/lib/avatarRenderer';

const CURRENCY_META = {
  gamecoin: { icon: GameCoinIcon, label: 'GameCoin', color: 'text-amber-300' },
  acoin: { icon: ACoinIcon, label: 'ACoin', color: 'text-emerald-300' },
};

const MAIN_TABS = [
  { id: 'background', label: 'Backgrounds', icon: Image },
  { id: 'profile',    label: 'Profile',     icon: User },
  { id: 'title',      label: 'Titles',      icon: Crown },
  { id: 'booster',    label: 'Boosters',    icon: Zap },
];

const SUB_TABS = [
  { id: 'shape',  label: 'Shape',  icon: Shapes },
  { id: 'avatar', label: 'Avatar', icon: Paw },
  { id: 'style',  label: 'Style',  icon: Sparkles },
  { id: 'face',   label: 'Face',   icon: Smile },
  { id: 'color',  label: 'Color',  icon: Palette },
];

/** Merge an avatar piece payload into the user's saved avatar config. */
function mergeAvatarApply(rawAvatar, apply) {
  const cfg = normalizeAvatarConfig(rawAvatar);
  return JSON.stringify({ ...cfg, ...apply });
}

export default function Shop() {
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState('background');
  const [activeSub, setActiveSub] = useState('shape');
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const ownedIds = new Set([...(user?.owned_items || []), ...['bg-ocean']]);
  const equipped = user?.equipped || {};
  const baseConfig = normalizeAvatarConfig(user?.avatar);

  const isProfileCat = activeCat === 'profile';
  const items = SHOP_ITEMS.filter((it) =>
    isProfileCat ? it.type === `profile_${activeSub}` : it.type === activeCat
  );
  const category = SHOP_CATEGORIES.find((c) => c.id === activeCat);
  const subCategory = PROFILE_SUBCATEGORIES.find((c) => c.id === activeSub);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const equippedKeyFor = (item) =>
    item.type.startsWith('profile_') ? item.type.replace('profile_', '') : item.type;

  const applyPurchaseUpdates = async (item, nextOwned) => {
    const eq = { ...(user?.equipped || {}) };
    const updates = { owned_items: nextOwned };
    if (item.type.startsWith('profile_')) {
      updates.avatar = mergeAvatarApply(user?.avatar, item.apply);
      eq[equippedKeyFor(item)] = item.id;
    } else if (item.type === 'booster') {
      eq.booster = item.id;
      updates.booster_expires = Date.now() + item.boost.durationHours * 3600 * 1000;
    } else {
      eq[item.type] = item.id;
    }
    updates.equipped = eq;
    await db.auth.updateMe(updates);
  };

  const handleBuy = async (item) => {
    setBusy(item.id);
    try {
      const ok = await spendCoins(db, user, item.currency, item.price);
      if (!ok) {
        flash(`Not enough ${CURRENCY_META[item.currency].label}!`);
        return;
      }
      const nextOwned = Array.from(new Set([...(user?.owned_items || []), item.id]));
      // Auto-equip on first purchase
      await applyPurchaseUpdates(item, nextOwned);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      flash(`${item.name} unlocked & equipped! 🎉`);
    } catch (e) {
      console.error('Purchase failed:', e);
      flash('Purchase failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleEquip = async (item) => {
    setBusy(item.id);
    try {
      await applyPurchaseUpdates(item, Array.from(new Set([...(user?.owned_items || []), item.id])));
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      flash(item.type === 'booster' ? `${item.name} activated! ⚡` : `${item.name} equipped! ✨`);
    } catch (e) {
      console.error('Equip failed:', e);
    } finally {
      setBusy(null);
    }
  };

  const isBoosterActive = (item) =>
    equipped.booster === item.id && (user?.booster_expires || 0) > Date.now();

  const boosterMinutesLeft = (item) =>
    Math.max(0, Math.ceil(((user?.booster_expires || 0) - Date.now()) / 60000));

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={3} grid={true} />
      {/* Shop shows both currencies — stacked so they never overlap */}
      <CoinWallet types={['gamecoin', 'acoin']} />

      <div className="relative z-10 p-5 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-foreground">Shop</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Spend your GameCoin and ACoin on backgrounds, avatar couture, titles, and limited-edition boosters.
          </p>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}

        {/* Main category menu — glassmorphism segmented control */}
        <GlassTabs options={MAIN_TABS} value={activeCat} onChange={setActiveCat} className="mb-3" />

        {/* Profile sub-menu */}
        {isProfileCat && (
          <GlassTabs options={SUB_TABS} value={activeSub} onChange={setActiveSub} size="sm" className="mb-3" />
        )}

        <p className="text-xs text-muted-foreground mb-4">
          {isProfileCat ? subCategory?.desc : category?.desc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const isOwned = ownedIds.has(item.id);
            const isEquipped = equipped[equippedKeyFor(item)] === item.id;
            const cur = CURRENCY_META[item.currency];
            const CurIcon = cur.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hover={true} className={`h-full ${isEquipped ? 'ring-2 ring-emerald-400/60' : ''}`}>
                  <div className="p-4 flex flex-col h-full">
                    {/* Preview */}
                    <div className="h-24 rounded-lg mb-3 overflow-hidden relative border border-border/60">
                      <ItemPreview item={item} baseConfig={baseConfig} />
                      {isEquipped && (
                        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> {item.type === 'booster' ? 'Active' : 'Equipped'}
                        </span>
                      )}
                      {item.type === 'booster' && isOwned && !isEquipped && (
                        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded-md">
                          Expired
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                      {item.boost && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.boost.multiplier}× XP · {item.boost.durationHours}h
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">{item.desc}</p>

                    <div className="mt-auto">
                      {item.type === 'booster' && isBoosterActive(item) ? (
                        <Button size="sm" className="w-full h-8 text-xs" variant="secondary" disabled>
                          ⚡ Active — {boosterMinutesLeft(item)}m left
                        </Button>
                      ) : isOwned ? (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          variant={isEquipped && item.type !== 'booster' ? 'secondary' : 'default'}
                          disabled={(isEquipped && item.type !== 'booster') || busy === item.id}
                          onClick={() => handleEquip(item)}
                        >
                          {isEquipped && item.type !== 'booster' ? 'Equipped' : item.type === 'booster' ? 'Activate' : 'Equip'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                          disabled={busy === item.id}
                          onClick={() => handleBuy(item)}
                        >
                          <CurIcon className={`w-3.5 h-3.5 mr-1.5 ${cur.color}`} />
                          {item.price} {cur.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Card preview per item type ──────────────────────────────────────
function ItemPreview({ item, baseConfig }) {
  // Color duos: plain two-tone rectangle — no avatar composite
  if (item.type === 'profile_color') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/10">
        <div
          className="w-24 h-14 rounded-lg ring-2 ring-white/15 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${item.apply.shapeColor} 50%, ${item.apply.styleColor} 50%)` }}
        />
      </div>
    );
  }

  // Avatar pieces: live try-on of YOUR avatar wearing the piece
  if (item.type.startsWith('profile_')) {
    const tryOnUri = avatarSvgToDataUri(
      renderAvatarSvg({ ...baseConfig, ...item.apply }, 96)
    );
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/10">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/15 shadow-lg">
          <img src={tryOnUri} alt={item.name} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  if (item.type === 'background') {
    return (
      <div
        className="w-full h-full"
        style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]}, ${item.colors[2]})` }}
      />
    );
  }

  if (item.type === 'booster') {
    return (
      <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-rose-500/20">
        <Rocket className="w-9 h-9 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
        <span className="absolute bottom-1.5 left-2 text-[10px] font-black tracking-wider text-amber-200/90">
          {item.boost.multiplier}× XP
        </span>
        <Zap className="absolute top-1.5 right-2 w-3.5 h-3.5 text-amber-300/70" />
      </div>
    );
  }

  // Titles (default)
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
      <span className="text-lg font-black tracking-wide text-foreground">🏆 {item.title}</span>
    </div>
  );
}
