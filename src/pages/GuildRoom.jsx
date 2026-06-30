import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '../components/ui/GlassCard';
import AvatarDisplay from '../components/profile/AvatarDisplay';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { db } from '@/lib/db';

export default function GuildRoom() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const { data: guild, isLoading } = useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => db.entities.Guild.get(guildId),
    enabled: !!guildId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['guildMessages', guildId],
    queryFn: () => db.entities.GuildMessage.filter({ guild_id: guildId }, 'created_date', 100),
    enabled: !!guildId,
    refetchInterval: 3000,
  });

  const isMember = (guild?.member_emails || []).includes(user?.email);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!user?.email) throw new Error('Not signed in');
      return db.entities.GuildMessage.create({
        guild_id: guildId,
        sender_email: user.email,
        sender_name: user.full_name || 'Student',
        text: messageText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guildMessages', guildId] });
      setText('');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading group...</div>;
  }

  if (!guild) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Study group not found.</p>
        <Button variant="outline" onClick={() => navigate('/guild')}>Back to groups</Button>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-4">Join this group to enter the chat.</p>
        <Link to="/guild"><Button variant="outline">Back to Study Groups</Button></Link>
      </div>
    );
  }

  const memberNames = (guild.member_emails || []).map((email) => {
    if (email === user.email) return 'You';
    return email.split('@')[0].replace('.', ' ');
  });

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate('/guild')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{guild.name}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {(guild.member_emails || []).length} members · {memberNames.slice(0, 3).join(', ')}
            {(guild.member_emails || []).length > 3 ? '…' : ''}
          </p>
        </div>
      </div>

      {guild.description && (
        <GlassCard hover={false} className="mb-4 py-3">
          <p className="text-xs text-muted-foreground">{guild.description}</p>
        </GlassCard>
      )}

      <GlassCard hover={false} className="flex-1 flex flex-col min-h-[320px] mb-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh] md:max-h-[55vh]">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Say hi to your study partners!
            </p>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_email === user?.email;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      isMe ? 'bg-accent/15 border border-accent/25' : 'bg-secondary border border-border'
                    }`}
                  >
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {isMe ? 'You' : m.sender_name}
                      {m.created_date ? ` · ${format(new Date(m.created_date), 'h:mm a')}` : ''}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </GlassCard>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          sendMutation.mutate(text.trim());
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message your study group..."
          className="bg-secondary border-border text-sm h-10"
          disabled={sendMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!text.trim() || sendMutation.isPending}
          className="h-10 px-4 bg-foreground text-background hover:bg-foreground/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
