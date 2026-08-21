import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, GameCoinIcon, ACoinIcon, ShoppingBag } from '@/components/ui/icons';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import CoinWallet from '../components/ui/CoinWallet';
import { Button } from '../components/ui/button';
import { db } from '@/lib/db';
import { spendCoins } from '@/lib/coins';
import { SHOP_CATEGORIES, SHOP_ITEMS } from '@/lib/shopItems';

const CURRENCY_META = {
  gamecoin: { icon: GameCoinIcon, label: 'GameCoin', color: 'text-amber-300' },
  acoin: { icon: ACoinIcon, label: 'ACoin', color: 'text-emerald-300' },
};

export default function Shop() {
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState('background');
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const ownedIds = new Set([...(user?.owned_items || [])]);
  const equipped = user?.equipped || {};

  const items = SHOP_ITEMS.filter((it) => it.type === activeCat);
  const category = SHOP_CATEGORIES.find((c) => c.id === activeCat);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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
      await db.auth.updateMe({
        owned_items: nextOwned,
        equipped: { ...(user?.equipped || {}), [item.type]: item.id },
      });
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
      await db.auth.updateMe({ equipped: { ...(user?.equipped || {}), [item.type]: item.id } });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      flash(`${item.name} equipped! ✨`);
    } catch (e) {
      console.error('Equip failed:', e);
    } finally {
      setBusy(null);
    }
  };

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
            Spend your GameCoin and ACoin to unlock exclusive backgrounds, palettes, and titles.
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

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  activeCat === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 opacity-70">· {CURRENCY_META[cat.currency].label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-4">{category?.desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const isOwned = ownedIds.has(item.id);
            const isEquipped = equipped[item.type] === item.id;
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
                    <div className="h-20 rounded-lg mb-3 overflow-hidden relative border border-border/60">
                      {item.type === 'background' ? (
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]}, ${item.colors[2]})` }} />
                      ) : item.type === 'palette' ? (
                        <div className="w-full h-full flex items-center justify-center gap-2">
                          <span className="w-10 h-10 rounded-full ring-2 ring-white/30" style={{ background: item.palette.bg }} />
                          <span className="w-10 h-10 rounded-full ring-2 ring-white/30" style={{ background: item.palette.inner }} />
                          <span className="w-10 h-10 rounded-full ring-2 ring-white/30" style={{ background: item.palette.accent }} />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
                          <span className="text-lg font-black tracking-wide text-foreground">🏆 {item.title}</span>
                        </div>
                      )}
                      {isEquipped && (
                        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> Equipped
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">{item.desc}</p>

                    <div className="mt-auto">
                      {isOwned ? (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          variant={isEquipped ? 'secondary' : 'default'}
                          disabled={isEquipped || busy === item.id}
                          onClick={() => handleEquip(item)}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
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

