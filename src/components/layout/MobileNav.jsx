import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Timer, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';

const items = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/quests', icon: BookOpen, label: 'Tasks' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/guild', icon: Users, label: 'Groups' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border backdrop-blur-md bg-sidebar/95">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors z-10 flex-1 max-w-[70px]
                ${isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute inset-0 bg-sidebar-accent/80 border-t-2 border-accent rounded-md -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}