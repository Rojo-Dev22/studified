import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, BookOpen, Timer, Trophy, Sparkles, Zap, User, ChevronLeft, ChevronRight, GraduationCap, FolderTree, Gamepad2, ShoppingBag, Settings } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

import { GRADES, SUBJECT_LABELS } from '@/lib/subjects';
import { getSubjectsForGrade } from '@/lib/lessonCatalog';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/quests', icon: Book, label: 'Assignments' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/raids', icon: Zap, label: 'Challenges' },
  { path: '/ai-tools', icon: Sparkles, label: 'AXO AI' },
  { path: '/minigames', icon: Gamepad2, label: 'Mini Games' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

// ── Unique selection animation per sidebar icon ──────────────────
// Each route gets its own distinct motion so the active icon stands out.
const ICON_ANIMS = {
  '/dashboard': { scale: [1, 1.15, 1] },                          // Home: breathing pulse
  '/quests': { x: [0, -2.5, 2.5, 0] },                            // Assignments: paper wiggle
  '/focus': { rotate: [0, -8, 8, 0] },                            // Focus: timer rock
  '/raids': { opacity: [1, 0.35, 1], scale: [1, 1.06, 1] },       // Challenges: zap flash
  '/ai-tools': { scale: [1, 1.22, 1], rotate: [0, 12, -12, 0] },  // AXO: sparkle pop
  '/minigames': { y: [0, -3, 0], rotate: [0, -6, 6, 0] },         // Games: controller bounce
  '/leaderboard': { y: [0, -4, 0] },                              // Leaderboard: trophy lift
  '/shop': { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] },        // Shop: bag wiggle
  '/profile': { scale: [1, 0.84, 1], opacity: [1, 0.6, 1] },      // Profile: user shrink-fade
  '/settings': { rotate: [0, -35, 35, 0] },                       // Settings: gear spin
};

const ICON_TRANSITIONS = {
  '/dashboard': { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  '/quests': { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  '/focus': { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  '/raids': { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
  '/ai-tools': { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  '/minigames': { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  '/leaderboard': { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  '/shop': { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  '/profile': { duration: 1.7, repeat: Infinity, ease: 'easeInOut' },
  '/settings': { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
};

/* ── Lessons Accordion helpers ────────────────────────────────────────── */

function GradeSection({ grade, subjects, selectedSubject, collapsed, onSelectGrade, onSelectSubject }) {
  const expandedSubjects = subjects.map(s => ({
    subject: s,
    subjectLabel: SUBJECT_LABELS[s] || s,
    expanded: selectedSubject === s,
  }));

  return (
    <div className="mb-0.5">
      <button
        onClick={() => onSelectGrade(grade)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/20 transition-colors text-xs"
      >
        {selectedSubject ? (
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform rotate-90" />
        )}
        <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
        <span className="overflow-hidden whitespace-nowrap">Grade {grade}</span>
      </button>

      {!selectedSubject && (
        <div className="mt-0.5 ml-4 flex flex-col gap-0.5">
          {expandedSubjects.map(({ subject, subjectLabel }) => (
            <div key={subject}>
              <Link
                to={`/lessons?grade=${grade}&subject=${subject}`}
                onClick={() => onSelectSubject(grade, subject)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/15 transition-colors text-xs"
              >
                <FolderTree className="w-3 h-3 flex-shrink-0" />
                <span className="overflow-hidden whitespace-nowrap truncate">{subjectLabel}</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Lessons accordion state ──
  const [lessonsOpen, setLessonsOpen] = useState(false);
  // Drill-down: grade → subject → unit
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // ── Collapsed flyout state ──
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef(null);

  const gradesWithLessons = useMemo(() => GRADES, []);   // 9–12 per MoE

  const isLessonsActive = location.pathname === '/lessons';

  // Close flyout when sidebar expands or when leaving the lessons page
  useEffect(() => {
    if (!collapsed) setFlyoutOpen(false);
  }, [collapsed]);

  useEffect(() => {
    // Keep flyout open while on the lessons page so the user can browse
    // all grades/subjects; close when navigating elsewhere
    if (location.pathname !== '/lessons') {
      setFlyoutOpen(false);
    }
  }, [location.pathname]);

  // Close flyout when clicking outside
  useEffect(() => {
    if (!flyoutOpen) return;
    const handleClickOutside = (e) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [flyoutOpen]);

  const handleSelectGrade = (grade) => {
    if (selectedGrade === grade) {
      setSelectedGrade(null);
      setSelectedSubject(null);
      setLessonsOpen(false);
    } else {
      setSelectedGrade(grade);
      setSelectedSubject(null);
      setLessonsOpen(true);
    }
  };

  const handleSelectSubject = (grade, subject) => {
    setLessonsOpen(true);
    if (selectedSubject === subject && selectedGrade === grade) {
      setSelectedSubject(null);
    } else {
      setSelectedSubject(subject);
    }
  };

  const closeLessonsAccordion = () => {
    setLessonsOpen(false);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleTextbooksClick = () => {
    navigate('/lessons');
    if (collapsed) {
      // In collapsed mode, toggle the flyout panel
      setFlyoutOpen((prev) => !prev);
      if (!flyoutOpen && !lessonsOpen) {
        setLessonsOpen(true);
      }
      return;
    }
    setLessonsOpen(!lessonsOpen);
    if (lessonsOpen) closeLessonsAccordion();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col overflow-hidden"
    >
       {/* Logo + Theme Toggle */}
       <div className={`h-14 flex items-center border-b border-sidebar-border flex-shrink-0 ${collapsed ? 'justify-center gap-1 px-1' : 'justify-between gap-4 px-3.5'}`}>
         <div className={`flex items-center ${collapsed ? 'gap-1.5 justify-center' : 'gap-2 min-w-0 flex-1'}`}>
           <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-sidebar-border">
             <img src="/logo.jpg" alt="Studified" className="w-full h-full object-cover" />
           </div>
           <AnimatePresence>
             {!collapsed && (
               <motion.span
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.15 }}
                 className="text-sm font-semibold text-foreground tracking-tight overflow-hidden whitespace-nowrap"
               >
                 Studified
               </motion.span>
             )}
           </AnimatePresence>
         </div>
         <div className="flex items-center flex-shrink-0">
           <ThemeToggle collapsed={collapsed} />
         </div>
       </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto relative sidebar-scroll">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-200 group z-10
                ${collapsed ? 'justify-center px-0' : ''}
                ${isActive
                  ? 'text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sidebar-accent border-l-2 border-accent rounded-md -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <motion.span
                animate={isActive ? ICON_ANIMS[item.path] : { scale: 1 }}
                transition={ICON_TRANSITIONS[item.path]}
                className="inline-flex"
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent' : ''}`} />
              </motion.span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* ── Lessons Accordion / Flyout trigger ──────────────────────── */}
        <div className={`pt-1 border-t border-sidebar-border/50 mt-1 ${collapsed ? 'relative' : ''}`}>
          <button
            onClick={handleTextbooksClick}
            className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-200 group ${
              collapsed ? 'justify-center px-0' : ''
            }
              ${isLessonsActive || flyoutOpen
                ? 'text-sidebar-accent-foreground bg-sidebar-accent/30'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30'
              }`}
          >
            {isLessonsActive && !flyoutOpen && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-sidebar-accent border-l-2 border-accent rounded-md -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <motion.span
              animate={isLessonsActive || flyoutOpen ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 text-amber-400" />
            </motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm flex-1 overflow-hidden whitespace-nowrap"
                >
                  Textbooks
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronRight
                    className={`w-3 h-3 flex-shrink-0 text-sidebar-foreground/50 transition-transform duration-200 ${lessonsOpen ? 'rotate-90' : ''}`}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Expanded accordion panels */}
          <AnimatePresence initial={false}>
            {lessonsOpen && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 flex flex-col gap-0.5 pl-1">
                  {gradesWithLessons.map((grade) => (
                    <GradeSection
                      key={grade}
                      grade={grade}
                      subjects={getSubjectsForGrade(grade)}
                      selectedSubject={selectedSubject}
                      collapsed={collapsed}
                      onSelectGrade={handleSelectGrade}
                      onSelectSubject={handleSelectSubject}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Collapsed flyout panel ──────────────────────────────── */}
          {collapsed && (
            <AnimatePresence>
              {flyoutOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                    style={{ left: 72 }}
                    onClick={() => setFlyoutOpen(false)}
                  />
                  <motion.div
                    ref={flyoutRef}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="fixed left-[72px] top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border shadow-2xl z-50 overflow-y-auto sidebar-scroll"
                  >
                    <div className="h-14 flex items-center justify-between px-3.5 border-b border-sidebar-border flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" /> Textbooks
                      </span>
                      <button
                        type="button"
                        onClick={() => setFlyoutOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30 transition-colors"
                        aria-label="Close textbooks"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2 mt-1 flex flex-col gap-0.5">
                      {gradesWithLessons.map((grade) => (
                        <GradeSection
                          key={grade}
                          grade={grade}
                          subjects={getSubjectsForGrade(grade)}
                          selectedSubject={selectedSubject}
                          collapsed={false}
                          onSelectGrade={handleSelectGrade}
                          onSelectSubject={handleSelectSubject}
                        />
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}
        </div>
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setFlyoutOpen(false);
          }}
          className="w-full flex items-center justify-center py-1.5 rounded-md text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}