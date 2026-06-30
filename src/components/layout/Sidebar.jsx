import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Timer, Users, Trophy, Sparkles, Zap, User, ChevronLeft, ChevronRight, GraduationCap, FolderTree, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { GRADES, SUBJECTS, SUBJECT_LABELS } from '@/lib/subjects';
import { getSubjectsForGrade, getUnitsForGradeSubject } from '@/lib/lessonCatalog';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/quests', icon: BookOpen, label: 'Assignments' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/guild', icon: Users, label: 'Study Groups' },
  { path: '/raids', icon: Zap, label: 'Challenges' },
  { path: '/ai-tools', icon: Sparkles, label: 'Study AI' },
  { path: '/minigames', icon: Gamepad2, label: 'Mini Games' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: User, label: 'Profile' },
];

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

  const gradesWithLessons = useMemo(() => GRADES, []);   // 9–12 per MoE

  const isLessonsActive = location.pathname === '/lessons';

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

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-background text-xs font-bold">S</span>
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
        <ThemeToggle />
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-200 group z-10
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
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent' : ''}`} />
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

        {/* ── Lessons Accordion ─────────────────────────────────────────── */}
        <div className="pt-1 border-t border-sidebar-border/50 mt-1">
          <button
            onClick={() => { 
              navigate('/lessons');
              setLessonsOpen(!lessonsOpen); 
              if (lessonsOpen) closeLessonsAccordion(); 
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-200 group
              ${isLessonsActive
                ? 'text-sidebar-accent-foreground bg-sidebar-accent/30'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30'
              }`}
          >
            {isLessonsActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-sidebar-accent border-l-2 border-accent rounded-md -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <GraduationCap className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 text-amber-400" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm flex-1 overflow-hidden whitespace-nowrap"
                >
                  Lessons
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

          {/* Accordion panels */}
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
        </div>
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 rounded-md text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}