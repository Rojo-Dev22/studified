import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ParticleBackground from './ParticleBackground';
import AnimatedBackground from '../ui/AnimatedBackground';
import ThemeToggle from '../ui/ThemeToggle';
import { motion } from 'framer-motion';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isProfile = location.pathname === '/profile';
  const isSettings = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-background font-body relative overflow-x-hidden">
      {/* Ambient background particles */}
      <ParticleBackground />
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile floating theme toggle - top-right (top-left on Profile; CSS-hidden on Settings) */}
      <motion.div
        className={`fixed z-40 md:hidden ${
          isProfile ? 'top-3 left-3' : 'top-3 right-3'
        } ${isSettings ? 'hidden' : ''}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-9 h-9 rounded-xl bg-sidebar/90 backdrop-blur-md border border-sidebar-border shadow-lg flex items-center justify-center">
          <ThemeToggle collapsed />
        </div>
      </motion.div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Main content */}
      <main
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-0 relative z-10 ${
          collapsed ? 'md:ml-[72px]' : 'md:ml-[220px]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}