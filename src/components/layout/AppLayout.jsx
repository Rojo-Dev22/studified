import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ParticleBackground from './ParticleBackground';
import AnimatedBackground from '../ui/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-body relative overflow-x-hidden">
      {/* Ambient background particles */}
      <ParticleBackground />
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}