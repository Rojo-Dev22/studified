import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { Users, Plus, UserPlus, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GuildCreateDialog from '../components/guild/GuildCreateDialog';
import { toast } from 'sonner';
import { formatNumber } from '../lib/gameUtils';

import { db } from '@/lib/db';


export default function Guild() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ['guilds'],
    queryFn: () => db.entities.Guild.list('-total_xp', 20),
  });

  const joinMutation = useMutation({
    mutationFn: async (guild) => {
      const u = user || (await db.auth.me());
      if (!u?.email) throw new Error('Profile still loading — try again.');
      const members = guild.member_emails || [];
      if (members.includes(u.email)) throw new Error('Already a member');
      if (members.length >= (guild.max_members || 10)) throw new Error('Group is full');
      await db.entities.Guild.update(guild.id, { member_emails: [...members, u.email] });
      await db.auth.updateMe({ guild_id: guild.id });
      return guild;
    },
    onSuccess: (guild) => {
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Joined! Opening group chat...');
      navigate(`/guild/${guild.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <div className="relative z-10 p-5 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center"
            >
              <Users className="w-4 h-4 text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Study Groups</h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400/60" />
                Join a group and chat with study partners
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New group
          </Button>
        </motion.div>

      <div className="space-y-2">
        {guilds.map((g, i) => {
          const isMember = (g.member_emails || []).includes(user?.email);
          const memberCount = (g.member_emails || []).length;
          const isFull = memberCount >= (g.max_members || 10);

          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard hover={false}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{g.name}</p>
                      {isMember && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">joined</span>}
                    </div>
                    {g.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount}/{g.max_members || 10}</span>
                      <span>{formatNumber(g.total_xp || 0)} group XP</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {isMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/guild/${g.id}`)}
                        className="h-7 text-xs border-border hover:bg-secondary"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" /> Chat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => joinMutation.mutate(g)}
                        disabled={joinMutation.isPending || isFull}
                        className="h-7 text-xs border-border hover:bg-secondary"
                      >
                        {isFull ? 'Full' : <><UserPlus className="w-3 h-3 mr-1" />Join</>}
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
        {guilds.length === 0 && !isLoading && (
          <GlassCard hover={false}>
            <p className="text-sm text-muted-foreground text-center py-4">No groups yet. Create the first one!</p>
          </GlassCard>
        )}
      </div>

      <GuildCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(guild) => navigate(`/guild/${guild.id}`)}
      />
    </div>
  </div>
  );
}
