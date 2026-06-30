import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, onClick }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), springConfig);

  const glareBackground = useTransform(
    [glowX, glowY],
    ([gx, gy]) =>
      `radial-gradient(circle 120px at ${gx}px ${gy}px, rgba(16, 185, 129, 0.08), transparent 80%)`
  );

  const handleMouseMove = (e) => {
    if (!hover || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
    glowX.set(mouseX);
    glowY.set(mouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`relative bg-card border border-border rounded-lg p-4 transition-colors duration-300 overflow-hidden select-none
        ${hover ? 'hover:border-border/80 hover:bg-card/90' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {hover && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{ background: glareBackground }}
        />
      )}

      {hover && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none border border-accent/20 rounded-lg -z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div style={{ transform: hover ? 'translateZ(10px)' : 'none' }} className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
