import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Book, BookOpen, Timer, Zap, Sparkles, Gamepad2, Trophy, User, ChevronLeft, ChevronRight, ShoppingBag, Settings } from '@/components/ui/icons';
import { motion } from 'framer-motion';

const items = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/quests', icon: Book, label: 'Assignments' },
  { path: '/lessons', icon: BookOpen, label: 'Books' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/raids', icon: Zap, label: 'Challenges' },
  { path: '/ai-tools', icon: Sparkles, label: 'AXO' },
  { path: '/minigames', icon: Gamepad2, label: 'Games' },
  { path: '/leaderboard', icon: Trophy, label: 'Board' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const PAGE_SIZE = 4;
const totalPages = Math.ceil(items.length / PAGE_SIZE);

export default function MobileNav() {
  const location = useLocation();
  const scrollRef = useRef(null);
  const [activePage, setActivePage] = useState(0);

  const activeIndex = items.findIndex((item) => location.pathname === item.path);
  const activePageIndex = activeIndex >= 0 ? Math.floor(activeIndex / PAGE_SIZE) : -1;

  // Scroll the active page into view when the route changes
  useEffect(() => {
    if (activePageIndex >= 0 && scrollRef.current) {
      const child = scrollRef.current.children[activePageIndex * PAGE_SIZE];
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }
  }, [activePageIndex]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setActivePage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToPage = (page) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border backdrop-blur-md bg-sidebar/95">
      <div className="relative">
        {/* Left scroll arrow */}
        {activePage > 0 && (
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollToPage(activePage - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-8 flex items-center justify-center rounded-r-lg bg-sidebar/90 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right scroll arrow */}
        {activePage < totalPages - 1 && (
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollToPage(activePage + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-8 flex items-center justify-center rounded-l-lg bg-sidebar/90 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto py-2 px-2 no-scrollbar snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-1.5 py-1.5 rounded-md transition-colors z-10 flex-[0_0_25%] min-w-0 snap-start scroll-ml-2 ${
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute inset-0 bg-sidebar-accent/80 border-t-2 border-accent rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page dots + scroll affordances */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pb-1.5 pt-0.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => scrollToPage(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activePage === i ? 'w-4 bg-accent' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </nav>
  );
}