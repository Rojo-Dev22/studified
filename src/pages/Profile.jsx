import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Edit3, Check, X, Plus, Tag, Sparkles, Zap, BookOpen,
  Timer, Flame, Award, Medal, Star, Target, Brain, Clock,
  Calendar, Activity, Trophy, Heart, Hash, Quote, Palette,
  Sword, Shield, MapPin, Github, Twitter, Globe, Camera,
  Lightbulb, Music, PenTool, Code, Coffee, Compass, Sparkle,
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import XPBar from '../components/ui/XPBar';
import AvatarCreator, { renderAvatarSvg, avatarSvgToDataUri, COLOR_PALETTES } from '../components/profile/AvatarCreator';
import AvatarDisplay, { getAvatarDataUri, getAvatarPalette } from '../components/profile/AvatarDisplay';
import { getLevelFromXP, getTitleFromLevel, formatNumber } from '../lib/gameUtils';
import { db, getDb } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';
import { flushSaveUserGameData } from '@/lib/userDataService';

// ─── Achievement Badges ─────────────────────────────────────────

const BADGE_DEFS = [
  { id: 'first_quest',   label: 'First Quest',   icon: Star,    desc: 'Complete your first quest',      threshold: 1 },
  { id: 'ten_quests',    label: 'Task Master',    icon: Trophy,  desc: 'Complete 10 quests',             threshold: 10 },
  { id: 'fifty_quests',  label: 'Quest Legend',   icon: Sword,   desc: 'Complete 50 quests',             threshold: 50 },
  { id: 'first_focus',   label: 'Focused Mind',   icon: Timer,   desc: 'Complete first focus session',   threshold: 1 },
  { id: 'ten_hours',     label: 'Deep Work',      icon: Brain,   desc: 'Log 10 focus hours',             threshold: 10 },
  { id: 'streak_3',      label: 'On Fire',        icon: Flame,   desc: '3-day streak',                   threshold: 3 },
  { id: 'streak_7',      label: 'Unstoppable',    icon: Zap,     desc: '7-day streak',                   threshold: 7 },
  { id: 'level_5',       label: 'Scholar',        icon: BookOpen,desc: 'Reach level 5',                  threshold: 5 },
  { id: 'level_10',      label: 'Sage',           icon: Lightbulb,desc: 'Reach level 10',                threshold: 10 },
  { id: 'social',        label: 'Social Butterfly',icon: Heart,  desc: 'Join a guild',                   threshold: 1 },
];

const DEFAULT_AVATAR_CONFIG = JSON.stringify({
  bg: 'hexagon', inner: 'geometric', accent: 'halo', face: 'none',
  palette: { name: 'Indigo', bg: '#4338ca', inner: '#6366f1', accent: '#818cf8', key: 'indigo' }
});

function parseAvatarConfig(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.palette?.key) {
      const found = COLOR_PALETTES.find(p => p.key === parsed.palette.key);
      if (found) parsed.palette = found;
    }
    return parsed;
  } catch {
    return JSON.parse(DEFAULT_AVATAR_CONFIG);
  }
}

const TABS = [
  { id: 'about',   label: 'About',    icon: User },
  { id: 'stats',   label: 'Stats',    icon: Activity },
  { id: 'badges',  label: 'Badges',   icon: Award },
];

const INTERESTS_LIST = [
  { id: 'coding',  label: 'Coding',  icon: Code },
  { id: 'design',  label: 'Design',  icon: PenTool },
  { id: 'music',   label: 'Music',   icon: Music },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'fitness', label: 'Fitness', icon: Activity },
  { id: 'art',     label: 'Art',     icon: Palette },
  { id: 'science', label: 'Science', icon: Brain },
  { id: 'games',   label: 'Gaming',  icon: Sword },
  { id: 'coffee',  label: 'Coffee',  icon: Coffee },
  { id: 'travel',  label: 'Travel',  icon: Compass },
];

// ─── Save Success Dialog ────────────────────────────────────────

function SaveSuccessDialog({ open, avatarUri, palette, fullName, onClose }) {
  if (!open) return null;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative max-w-sm w-full mx-4 rounded-2xl border p-6 shadow-2xl ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Decorative top gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, ${palette.bg}, ${palette.inner}, ${palette.accent})`
          }}
        />

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Avatar preview */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl"
          >
            <img src={avatarUri} alt="Avatar" className="w-full h-full object-cover" />
          </motion.div>

          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.25 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
            }`}
          >
            <Sparkle className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </motion.div>

          <div className="text-center">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Profile Updated!
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Your changes have been saved successfully.
            </p>
            {fullName && (
              <p className={`text-xs mt-2 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Welcome back, <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fullName}</span>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            Awesome, let me in!
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

export default function Profile() {
  const { logout, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ avatarUri: '', palette: { bg: '#4338ca', inner: '#6366f1', accent: '#818cf8' }, fullName: '' });
  const [editValues, setEditValues] = useState({
    full_name: '', caption: '', specialities: [], avatar: '',
    interests: [], location: '', social_github: '', social_twitter: '', social_website: '',
  });
  const [newSpeciality, setNewSpeciality] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const { data: sessions = [] } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => db.entities.FocusSession.filter({ status: 'completed' }, '-created_date', 100),
  });

  const totalXP = user?.total_xp || 0;
  const { level, currentXP, xpToNext } = getLevelFromXP(totalXP);
  const title = getTitleFromLevel(level);
  const tasksDone = user?.quests_completed || 0;
  const focusHours = (user?.focus_hours || 0).toFixed(1);
  const dayStreak = user?.streak_days || 0;
  const sessionCount = sessions.length;
  const avatarRaw = user?.avatar || '';

  const avatarConfig = useMemo(() => {
    if (avatarRaw.startsWith('{')) return parseAvatarConfig(avatarRaw);
    return parseAvatarConfig(DEFAULT_AVATAR_CONFIG);
  }, [avatarRaw]);

  const avatarDataUri = useMemo(() => getAvatarDataUri(avatarRaw, 128), [avatarRaw]);
  const bannerPalette = useMemo(() => getAvatarPalette(avatarRaw), [avatarRaw]);

  const earnedBadges = useMemo(() => {
    return BADGE_DEFS.map(b => {
      let earned = false;
      if (b.id === 'first_quest')   earned = tasksDone >= 1;
      if (b.id === 'ten_quests')    earned = tasksDone >= 10;
      if (b.id === 'fifty_quests')  earned = tasksDone >= 50;
      if (b.id === 'first_focus')   earned = sessionCount >= 1;
      if (b.id === 'ten_hours')     earned = parseFloat(focusHours) >= 10;
      if (b.id === 'streak_3')      earned = dayStreak >= 3;
      if (b.id === 'streak_7')      earned = dayStreak >= 7;
      if (b.id === 'level_5')       earned = level >= 5;
      if (b.id === 'level_10')      earned = level >= 10;
      if (b.id === 'social')        earned = (user?.guilds?.length || 0) > 0;
      return { ...b, earned, progress: b.threshold };
    });
  }, [tasksDone, sessionCount, focusHours, dayStreak, level, user]);

  const handleEditClick = () => {
    setEditValues({
      full_name: user?.full_name || '',
      caption: user?.caption || '',
      specialities: user?.specialities || [],
      avatar: avatarRaw,
      interests: user?.interests || [],
      location: user?.location || '',
      social_github: user?.social_github || '',
      social_twitter: user?.social_twitter || '',
      social_website: user?.social_website || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        full_name: editValues.full_name,
        caption: editValues.caption,
        specialities: editValues.specialities,
        avatar: editValues.avatar,
        interests: editValues.interests,
        location: editValues.location,
        social_github: editValues.social_github,
        social_twitter: editValues.social_twitter,
        social_website: editValues.social_website,
      };

      await db.auth.updateMe(data);

      if (firebaseUser) {
        try {
          // Refresh user data from database to get the latest values
          const updatedUser = await db.auth.me();
          const store = db.getStore();
          
          // Create complete profile with all fields for saving
          const completeProfile = {
            email: updatedUser.email || '',
            full_name: updatedUser.full_name || 'Student',
            caption: updatedUser.caption || '',
            specialities: updatedUser.specialities || [],
            avatar: updatedUser.avatar || '',
            interests: updatedUser.interests || [],
            location: updatedUser.location || '',
            social_github: updatedUser.social_github || '',
            social_twitter: updatedUser.social_twitter || '',
            social_website: updatedUser.social_website || '',
            total_xp: updatedUser.total_xp || 0,
            quests_completed: updatedUser.quests_completed || 0,
            focus_hours: updatedUser.focus_hours || 0,
            streak_days: updatedUser.streak_days || 0,
            grade: updatedUser.grade || 10,
          };
          
          await flushSaveUserGameData(firebaseUser.uid, store, completeProfile);
        } catch (e) {
          console.warn('Firebase sync skipped:', e);
        }
      }

      // Set success dialog data before reload
      const finalAvatar = editValues.avatar || avatarRaw;
      const uri = getAvatarDataUri(finalAvatar, 128);
      const pal = getAvatarPalette(finalAvatar);
      setSuccessData({ avatarUri: uri, palette: pal, fullName: editValues.full_name || user?.full_name || '' });
      setShowSuccess(true);
      setIsEditing(false);

      // Invalidate queries so they refetch when coming back
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Queries are already invalidated in handleSave, so they will refetch with fresh data
    // No page reload needed - React Query will update the UI automatically
  };

  const handleAvatarChange = (config, dataUri) => {
    setEditValues({ ...editValues, avatar: JSON.stringify(config) });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewSpeciality('');
  };

  const handleAddSpeciality = () => {
    if (newSpeciality.trim() && !editValues.specialities.includes(newSpeciality.trim())) {
      setEditValues({ ...editValues, specialities: [...editValues.specialities, newSpeciality.trim()] });
      setNewSpeciality('');
    }
  };

  const handleRemoveSpeciality = (spec) => {
    setEditValues({ ...editValues, specialities: editValues.specialities.filter((s) => s !== spec) });
  };

  const toggleInterest = (id) => {
    const next = editValues.interests.includes(id)
      ? editValues.interests.filter(i => i !== id)
      : [...editValues.interests, id];
    setEditValues({ ...editValues, interests: next });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['violet']} orbs={3} grid={true} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto space-y-5"
      >
        {/* HERO CARD */}
        <motion.div variants={itemVariants}>
          <GlassCard hover={false} className="p-0 overflow-hidden">
            {/* Gradient header strip — color matches avatar palette */}
            <div
              className="h-24 relative"
              style={{
                background: `linear-gradient(135deg, ${bannerPalette.bg}40, ${bannerPalette.inner}30, ${bannerPalette.accent}20)`
              }}
            >
              {!isEditing && (
                <div className="absolute top-3 right-3 flex gap-1">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="h-8 w-8 flex items-center justify-center bg-background/30 backdrop-blur-sm hover:bg-background/50 rounded-full transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-muted-foreground h-8 text-xs flex items-center gap-1 bg-background/30 backdrop-blur-sm hover:bg-background/50 rounded-full px-2.5 transition-colors"
                  >
                    <Zap className="w-3 h-3" /> Sign out
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 -mt-12">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {isEditing ? (
                    <div className="w-full">
                      <AvatarCreator
                        value={parseAvatarConfig(editValues.avatar || DEFAULT_AVATAR_CONFIG)}
                        onChange={handleAvatarChange}
                        size={112}
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-background shadow-xl">
                      <img src={avatarDataUri} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Name & title */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  {isEditing ? (
                    <div className="space-y-2 mt-3">
                      <input
                        value={editValues.full_name}
                        onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                        className="w-full text-base h-9 px-3 rounded-md bg-secondary border border-border text-foreground font-bold"
                        placeholder="Your name"
                      />
                      <textarea
                        value={editValues.caption}
                        onChange={(e) => setEditValues({ ...editValues, caption: e.target.value })}
                        className="w-full text-xs h-16 px-3 py-2 rounded-md bg-secondary border border-border text-foreground resize-none"
                        placeholder="Write a short bio..."
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl font-bold text-foreground mt-2 sm:mt-0">
                        {user?.full_name || 'Student'}
                      </h1>
                      <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
                        <Award className="w-3 h-3 text-violet-400" />
                        {title} · Level {level}
                      </p>
                      {user?.caption && (
                        <p className="text-sm text-muted-foreground mt-1.5 italic flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-violet-400/50 mt-0.5 flex-shrink-0" />
                          {user.caption}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                        {user?.social_github && (
                          <a href={user.social_github} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {user?.social_twitter && (
                          <a href={user.social_twitter} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                            <Twitter className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {user?.social_website && (
                          <a href={user.social_website} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {user?.location && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                            <MapPin className="w-3 h-3" />{user.location}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Specialities */}
              <div className="mt-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {editValues.specialities.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/50 rounded-full text-xs">
                          <Tag className="w-3 h-3" />{s}
                          <button type="button" onClick={() => handleRemoveSpeciality(s)} className="hover:text-foreground text-muted-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={newSpeciality}
                        onChange={(e) => setNewSpeciality(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSpeciality()}
                        className="text-xs h-7 flex-1 px-2 rounded-md bg-secondary border border-border text-foreground"
                        placeholder="Add skill..."
                      />
                      <button type="button" onClick={handleAddSpeciality} className="h-7 px-2 text-xs rounded-md border border-border bg-secondary hover:bg-secondary/80 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  user?.specialities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {user.specialities.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/50 rounded-full text-xs">
                          <Tag className="w-3 h-3 text-violet-400" />{s}
                        </span>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Edit mode save/cancel */}
              {isEditing && (
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-8 px-3 text-xs rounded-md border border-border bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 px-3 text-xs rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving...</span>
                    ) : (
                      <><Check className="w-3.5 h-3.5" /> Save</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* XP Bar */}
            <div className="px-5 pb-5">
              <XPBar current={currentXP} max={xpToNext} level={level} />
            </div>
          </GlassCard>
        </motion.div>

        {/* TABS */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-1 bg-secondary/40 rounded-lg p-1 backdrop-blur-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-foreground shadow-sm border border-violet-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
          >
            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <motion.div variants={itemVariants}>
                  <GlassCard hover={false} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interests</p>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS_LIST.map((int) => {
                          const active = editValues.interests.includes(int.id);
                          return (
                            <button
                              key={int.id}
                              type="button"
                              onClick={() => toggleInterest(int.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                                active
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground border border-transparent'
                              }`}
                            >
                              <int.icon className="w-3 h-3" />
                              {int.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(user?.interests?.length > 0 ? user.interests : []).map((intId) => {
                          const def = INTERESTS_LIST.find(i => i.id === intId);
                          if (!def) return null;
                          return (
                            <span key={intId} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs">
                              <def.icon className="w-3 h-3" />{def.label}
                            </span>
                          );
                        })}
                        {(!user?.interests || user.interests.length === 0) && (
                          <p className="text-xs text-muted-foreground italic">No interests added yet</p>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>

                {isEditing && (
                  <motion.div variants={itemVariants}>
                    <GlassCard hover={false} className="p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />Links & Location
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input value={editValues.location} onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                            className="w-full text-xs h-8 pl-8 rounded-md bg-secondary border border-border text-foreground" placeholder="Location" />
                        </div>
                        <div className="relative">
                          <Github className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input value={editValues.social_github} onChange={(e) => setEditValues({ ...editValues, social_github: e.target.value })}
                            className="w-full text-xs h-8 pl-8 rounded-md bg-secondary border border-border text-foreground" placeholder="GitHub URL" />
                        </div>
                        <div className="relative">
                          <Twitter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input value={editValues.social_twitter} onChange={(e) => setEditValues({ ...editValues, social_twitter: e.target.value })}
                            className="w-full text-xs h-8 pl-8 rounded-md bg-secondary border border-border text-foreground" placeholder="Twitter URL" />
                        </div>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input value={editValues.social_website} onChange={(e) => setEditValues({ ...editValues, social_website: e.target.value })}
                            className="w-full text-xs h-8 pl-8 rounded-md bg-secondary border border-border text-foreground" placeholder="Website URL" />
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <GlassCard hover={false} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-violet-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">At a Glance</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Zap, label: 'Total XP', value: formatNumber(totalXP), color: 'text-emerald-400' },
                        { icon: BookOpen, label: 'Quests Done', value: tasksDone, color: 'text-blue-400' },
                        { icon: Timer, label: 'Focus Hours', value: `${focusHours}h`, color: 'text-amber-400' },
                        { icon: Flame, label: 'Day Streak', value: dayStreak, color: 'text-orange-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center gap-2.5 bg-secondary/30 rounded-lg p-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground tabular-nums">{stat.value}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <motion.div variants={itemVariants} className="space-y-4">
                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-violet-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance Stats</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Brain, label: 'Focus Sessions', value: sessionCount, sub: 'total completed', color: 'from-violet-500/20 to-purple-500/20' },
                      { icon: Medal, label: 'Current Level', value: level, sub: title, color: 'from-indigo-500/20 to-blue-500/20' },
                      { icon: Trophy, label: 'Best Streak', value: dayStreak, sub: 'consecutive days', color: 'from-amber-500/20 to-orange-500/20' },
                      { icon: Target, label: 'Total XP', value: formatNumber(totalXP), sub: 'all time', color: 'from-emerald-500/20 to-teal-500/20' },
                    ].map((stat) => (
                      <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-3.5 border border-border/40`}>
                        <div className="flex items-start justify-between mb-2">
                          <stat.icon className="w-5 h-5 text-foreground/70" />
                          <span className="text-lg font-bold text-foreground tabular-nums">{stat.value}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{stat.label}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level Progress</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{formatNumber(currentXP)} XP</span>
                        <span className="text-muted-foreground">{formatNumber(xpToNext)} XP to next level</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentXP / xpToNext) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-violet-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detailed Breakdown</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Quests Completed', value: tasksDone, max: Math.max(tasksDone, 20), color: 'bg-emerald-500' },
                      { label: 'Focus Sessions', value: sessionCount, max: Math.max(sessionCount, 20), color: 'bg-amber-500' },
                      { label: 'Focus Hours', value: parseFloat(focusHours), max: Math.max(parseFloat(focusHours), 20), color: 'bg-blue-500' },
                      { label: 'Streak Days', value: dayStreak, max: Math.max(dayStreak, 14), color: 'bg-orange-500' },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className="text-foreground font-medium">{stat.value}</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full ${stat.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* BADGES TAB */}
            {activeTab === 'badges' && (
              <motion.div variants={itemVariants}>
                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Achievements</p>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {earnedBadges.filter(b => b.earned).length}/{earnedBadges.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`relative rounded-xl p-3 border transition-all ${
                          badge.earned
                            ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30'
                            : 'bg-secondary/20 border-border/30 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            badge.earned ? 'bg-amber-500/20' : 'bg-secondary/40'
                          }`}>
                            <badge.icon className={`w-5 h-5 ${badge.earned ? 'text-amber-400' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {badge.label}
                            </p>
                            <p className="text-[9px] text-muted-foreground truncate">{badge.desc}</p>
                          </div>
                        </div>
                        {badge.earned && (
                          <div className="absolute top-1.5 right-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Success Dialog */}
      <SaveSuccessDialog
        open={showSuccess}
        avatarUri={successData.avatarUri}
        palette={successData.palette}
        fullName={successData.fullName}
        onClose={handleSuccessClose}
      />
    </div>
  );
}