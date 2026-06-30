import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { db } from '@/lib/db';

export default function GuildCreateDialog({ open, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '' });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const u = await db.auth.me();
      if (!u?.email) throw new Error('Could not load your profile. Refresh and try again.');
      const guild = await db.entities.Guild.create({
        name: data.name.trim(),
        description: data.description?.trim() || '',
        emblem: 'shield',
        rank: 'E',
        total_xp: 0,
        leader_email: u.email,
        member_emails: [u.email],
        max_members: 10,
      });
      await db.auth.updateMe({ guild_id: guild.id });
      await db.entities.GuildMessage.create({
        guild_id: guild.id,
        sender_email: u.email,
        sender_name: u.full_name || 'Student',
        text: `Welcome to ${data.name.trim()}! Use this chat to coordinate study sessions.`,
      });
      return guild;
    },
    onSuccess: (guild) => {
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Study group created!');
      onClose?.();
      setForm({ name: '', description: '' });
      onCreated?.(guild);
    },
    onError: (err) => toast.error(err.message || 'Could not create group'),
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">New study group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs text-muted-foreground">Group name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Late Night Grinders" className="bg-secondary border-border mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">About (optional)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does your group focus on?" className="bg-secondary border-border mt-1 text-sm min-h-[70px]" />
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.name.trim() || createMutation.isPending}
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-9 text-sm"
          >
            {createMutation.isPending ? 'Creating...' : 'Create group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
