import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SUBJECTS, SUBJECT_LABELS } from '@/lib/subjects';
import { db } from '@/lib/db';

const defaultForm = {
  title: '',
  description: '',
  type: 'daily',
  difficulty: 'E',
  xp_reward: 50,
  category: 'math',
  duration_minutes: 30,
};

export default function QuestCreateDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const taskTypes = [
    { value: 'daily', label: 'Daily assignment' },
    { value: 'weekly', label: 'Weekly assignment' },
    { value: 'story', label: 'Story quest' },
  ];

  const createMutation = useMutation({
    mutationFn: (data) =>
      db.entities.Quest.create({
        ...data,
        status: 'available',
        title: data.title.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      toast.success('Assignment created!');
      onClose?.();
      setForm(defaultForm);
    },
    onError: (err) => toast.error(err.message || 'Could not create assignment'),
  });

  const difficulties = [
    { value: 'E', label: 'Beginner' }, { value: 'D', label: 'Easy' },
    { value: 'C', label: 'Medium' }, { value: 'B', label: 'Hard' },
    { value: 'A', label: 'Expert' }, { value: 'S', label: 'Master' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What do you need to study?" className="bg-secondary border-border mt-1 text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any extra details..." className="bg-secondary border-border mt-1 text-sm min-h-[70px]" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {taskTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
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
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((c) => (
                    <SelectItem key={c} value={c}>{SUBJECT_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">XP reward</Label>
              <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration (min)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1 h-9 text-sm" />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.title.trim() || createMutation.isPending}
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-9 text-sm mt-1"
          >
            {createMutation.isPending ? 'Creating...' : 'Create task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
