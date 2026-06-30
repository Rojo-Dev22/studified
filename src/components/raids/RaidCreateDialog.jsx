import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { db } from '@/lib/db';

const defaultForm = {
  title: '',
  description: '',
  difficulty: 'B',
  subject: 'math',
  xp_reward: 500,
  duration_minutes: 60,
  max_participants: 5,
};

export default function RaidCreateDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const u = await db.auth.me();
      if (!u?.email) throw new Error('Could not load your profile. Refresh and try again.');
      return db.entities.Raid.create({
        ...data,
        title: data.title.trim(),
        status: 'recruiting',
        leader_email: u.email,
        participant_emails: [u.email],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raids'] });
      toast.success('Challenge created!');
      onClose?.();
      setForm(defaultForm);
    },
    onError: (err) => toast.error(err.message || 'Could not create challenge'),
  });

  const difficulties = [
    { value: 'B', label: 'Hard' }, { value: 'A', label: 'Expert' }, { value: 'S', label: 'Master' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">New challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Calculus Blitz" className="bg-secondary border-border mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's the challenge?" className="bg-secondary border-border mt-1 text-sm min-h-[70px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max participants</Label>
              <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 5 })}
                className="bg-secondary border-border mt-1 h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Duration (min)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="bg-secondary border-border mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">XP reward</Label>
              <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 500 })}
                className="bg-secondary border-border mt-1 h-9 text-sm" />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.title.trim() || createMutation.isPending}
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-9 text-sm"
          >
            {createMutation.isPending ? 'Creating...' : 'Create challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
