import { useTheme } from "next-themes";
import { Sun, Moon } from '@/components/ui/icons';
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ThemeToggle({ collapsed = false }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-7 h-7 flex items-center justify-center rounded-lg" />
    );
  }

  const isDark = theme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  // ── Collapsed: compact circular button ─────────────────────────────
  // Keeps the same rounded-full shape and track colors as the pill slider.
  if (collapsed) {
    return (
      <motion.button
        onClick={toggle}
        className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-300
          ${isDark ? 'bg-slate-700' : 'bg-slate-300'}
          hover:text-sidebar-accent-foreground`}
        whileTap={{ scale: 0.8 }}
        aria-label="Toggle theme"
      >
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </motion.div>
      </motion.button>
    );
  }

  // ── Expanded: iOS-style pill slider ────────────────────────────────
  return (
    <motion.button
      onClick={toggle}
      className={`relative w-[52px] h-[26px] rounded-full flex items-center px-[3px] transition-colors duration-300 flex-shrink-0
        ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
    >
      {/* Track icons */}
      <span className={`absolute left-[7px] text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-40' : 'opacity-100'}`}>
        <Sun className="w-3 h-3 text-amber-500" />
      </span>
      <span className={`absolute right-[7px] text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-40'}`}>
        <Moon className="w-3 h-3 text-indigo-300" />
      </span>

      {/* Sliding knob */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`relative z-10 w-[20px] h-[20px] rounded-full shadow-md flex items-center justify-center
          ${isDark ? 'bg-slate-200' : 'bg-white'}`}
        style={{ marginLeft: isDark ? 'auto' : 0 }}
      >
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-indigo-500" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </motion.span>
      </motion.span>
    </motion.button>
  );
}