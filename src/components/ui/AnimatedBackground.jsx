import React from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground({ colors = ["emerald", "amber", "violet"], orbs = 3, grid = true }) {
  const colorMap = {
    emerald: {
      primary: "bg-emerald-500/16 dark:bg-emerald-500/8",
      secondary: "bg-emerald-500/10 dark:bg-emerald-500/5",
      particle: "bg-emerald-400/50",
    },
    amber: {
      primary: "bg-amber-500/14 dark:bg-amber-500/6",
      secondary: "bg-amber-500/9 dark:bg-amber-500/4",
      particle: "bg-amber-400/45",
    },
    violet: {
      primary: "bg-violet-500/14 dark:bg-violet-500/5",
      secondary: "bg-violet-500/9 dark:bg-violet-500/4",
      particle: "bg-violet-400/40",
    },
    blue: {
      primary: "bg-blue-500/16 dark:bg-blue-500/8",
      secondary: "bg-blue-500/10 dark:bg-blue-500/5",
      particle: "bg-blue-400/50",
    },
    purple: {
      primary: "bg-purple-500/14 dark:bg-purple-500/5",
      secondary: "bg-purple-500/9 dark:bg-purple-500/4",
      particle: "bg-purple-400/40",
    },
    cyan: {
      primary: "bg-cyan-500/16 dark:bg-cyan-500/8",
      secondary: "bg-cyan-500/10 dark:bg-cyan-500/5",
      particle: "bg-cyan-400/50",
    },
  };

  const orbPositions = [
    { top: "-20%", right: "-15%", width: "600px", height: "600px", delay: 0 },
    { bottom: "-25%", left: "-15%", width: "500px", height: "500px", delay: 2 },
    { top: "30%", left: "30%", width: "400px", height: "400px", delay: 4 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {colors.slice(0, Math.min(orbs, 3)).map((color, i) => {
        const c = colorMap[color] || colorMap.emerald;
        const pos = orbPositions[i];
        return (
          <motion.div
            key={i}
            className={"absolute rounded-full " + c.primary}
            style={{
              top: pos.top,
              right: pos.right,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              height: pos.height,
            }}
            animate={{
              scale: i % 2 === 0 ? [1, 1.1, 1] : [1.1, 1, 1.1],
              opacity: i % 2 === 0 ? [0.15, 0.25, 0.15] : [0.2, 0.1, 0.2],
              rotate: i === 0 ? [0, 45, 0] : i === 1 ? [0, -30, 0] : [0, 60, 0],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: pos.delay,
            }}
          />
        );
      })}

      {[...Array(8)].map((_, i) => {
        const c = colorMap[colors[0]] || colorMap.emerald;
        return (
          <motion.div
            key={"p-" + i}
            className={"absolute w-1 h-1 rounded-full " + c.particle}
            style={{
              left: "" + (12 + i * 10) + "%",
              top: "" + (15 + (i % 5) * 18) + "%",
            }}
            animate={{
              y: [0, -25 - (i * 3), 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 3 + (i * 0.4),
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {grid && (
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      )}
    </div>
  );
}
