import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, FileText, ChevronDown, User, LogOut } from '@/components/ui/icons';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';

const SECTIONS = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    icon: Shield,
    body: [
      { h: 'Your Data is Yours', p: 'We store your study progress, XP, coins, and profile locally on your device (localStorage) and optionally sync it to our secure cloud database so you can pick up where you left off on any device.' },
      { h: 'What We Collect', p: 'We collect the information you provide (name, email, avatar, interests) plus your in-app progress such as XP, coins, completed assignments, focus sessions, and achievements. This data is used only to power your Studified experience.' },
      { h: 'How We Use It', p: 'Your data personalizes lessons, tracks achievements, powers the leaderboard, and lets you unlock shop items. We never sell your personal information to third parties.' },
      { h: 'Your Control', p: 'You can update or delete your profile at any time from your Profile page. You may also sign out, which stops active sync of your local data.' },
      { h: 'Security', p: 'We follow industry-standard security practices and store data in Firebase, Google\'s secure cloud platform, protected by Firebase security rules.' },
      { h: 'Contact', p: 'For any privacy questions or data requests, please reach out to our support team through the app.' },
    ],
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    icon: FileText,
    body: [
      { h: 'Acceptance of Terms', p: 'By using Studified, you agree to these Terms & Conditions. If you do not agree, please stop using the app.' },
      { h: 'Use of the Service', p: 'Studified is an educational tool intended for personal, non-commercial study use. You agree not to misuse, reverse-engineer, or interfere with the service.' },
      { h: 'Virtual Currencies & Shop', p: 'GameCoin and ACoin are virtual rewards earned through gameplay and study. They have no real-world monetary value and are non-refundable and non-transferable. Shop purchases are for in-app cosmetic unlocks only.' },
      { h: 'Accounts', p: 'You are responsible for safeguarding your account credentials and for all activity that occurs under your account. Contact support if you suspect unauthorized use.' },
      { h: 'Intellectual Property', p: 'All content, branding, and software in Studified are owned by the Studified team unless otherwise noted. Curricular content is aligned to publicly available materials.' },
      { h: 'Limitation of Liability', p: 'Studified is provided "as is" without warranties of any kind. We are not liable for any indirect or incidental damages arising from use of the app.' },
      { h: 'Changes to Terms', p: 'We may update these terms from time to time. Continued use of Studified after changes constitutes acceptance of the revised terms.' },
    ],
  },
];

export default function Settings() {
  const { logout, user } = useAuth();
  const [open, setOpen] = useState('privacy');

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={3} grid={true} />

      <div className="relative z-10 p-5 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SettingsIcon className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Account, appearance, and legal information.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sidebar/90 backdrop-blur-md border border-sidebar-border shadow-lg flex items-center justify-center flex-shrink-0 md:hidden">
            <ThemeToggle collapsed />
          </div>
        </div>

        <div className="space-y-4">
          {/* Account card */}
          <GlassCard hover={false} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || 'Student'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-md border border-border bg-secondary/60 hover:bg-secondary transition-colors text-foreground flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </GlassCard>
          {/* Legal accordions */}
          {SECTIONS.map((sec) => {
            const isOpen = open === sec.id;
            const Icon = sec.icon;
            return (
              <GlassCard key={sec.id} hover={false} className="p-0">
                <button
                  onClick={() => setOpen(isOpen ? '' : sec.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    {sec.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4">
                    {sec.body.map((item, i) => (
                      <div key={i}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/90 mb-1">{item.h}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
