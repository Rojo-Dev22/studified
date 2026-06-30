import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Palette, Layers, Shapes, Sparkles, Smile } from 'lucide-react';

// ─── Pattern Definitions ───────────────────────────────────────────────

const PATTERN_BG = [
  { id: 'circle',     label: 'Circle',     icon: '●',  path: (c) => `<circle cx="50" cy="50" r="48" fill="${c}" />` },
  { id: 'hexagon',    label: 'Hexagon',    icon: '⬡',  path: (c) => `<polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="${c}" />` },
  { id: 'star',       label: 'Star',       icon: '★',  path: (c) => `<polygon points="50,4 61,38 97,38 68,59 79,95 50,74 21,95 32,59 3,38 39,38" fill="${c}" />` },
  { id: 'diamond',    label: 'Diamond',    icon: '◆',  path: (c) => `<polygon points="50,4 96,50 50,96 4,50" fill="${c}" />` },
  { id: 'wave',       label: 'Wave',       icon: '〰', path: (c) => `<path d="M0,70 Q25,40 50,70 T100,70 L100,100 L0,100 Z" fill="${c}" /><path d="M0,80 Q25,55 50,80 T100,80 L100,100 L0,100 Z" fill="${adjust(c,-20)}" opacity="0.6" />` },
  { id: 'sunburst',   label: 'Sunburst',   icon: '☀',  path: (c) => {
    const rays = Array.from({length:12}, (_,i) => {
      const a = (i*30-90)*Math.PI/180;
      return `<line x1="50" y1="50" x2="${50+48*Math.cos(a)}" y2="${50+48*Math.sin(a)}" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.3" />`;
    }).join('');
    return `<circle cx="50" cy="50" r="22" fill="${c}" />${rays}`;
  }},
  { id: 'petal',      label: 'Petal',     icon: '✿',  path: (c) => {
    const petals = Array.from({length:6}, (_,i) => {
      const a = i*60*Math.PI/180;
      const cx = 50+18*Math.cos(a), cy = 50+18*Math.sin(a);
      return `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="20" fill="${c}" transform="rotate(${i*60},${cx},${cy})" opacity="0.7" />`;
    }).join('');
    return `${petals}<circle cx="50" cy="50" r="12" fill="${adjust(c,30)}" />`;
  }},
  { id: 'square',     label: 'Square',    icon: '■',  path: (c) => `<rect x="6" y="6" width="88" height="88" rx="12" fill="${c}" />` },
  { id: 'triangle',   label: 'Triangle',  icon: '▲',  path: (c) => `<polygon points="50,4 96,90 4,90" fill="${c}" />` },
  { id: 'ring',       label: 'Ring',      icon: '○',  path: (c) => `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="10" /><circle cx="50" cy="50" r="20" fill="${c}" opacity="0.4" />` },
  { id: 'cross',      label: 'Cross',     icon: '✚',  path: (c) => `<rect x="20" y="4" width="60" height="92" rx="8" fill="${c}" opacity="0.7" /><rect x="4" y="20" width="92" height="60" rx="8" fill="${c}" opacity="0.7" />` },
  { id: 'shield',     label: 'Shield',    icon: '🛡',  path: (c) => `<path d="M50,4 L96,20 L96,50 Q96,80 50,96 Q4,80 4,50 L4,20 Z" fill="${c}" />` },
  { id: 'drop',       label: 'Drop',      icon: '💧',  path: (c) => `<path d="M50,4 Q80,50 80,70 Q80,90 50,90 Q20,90 20,70 Q20,50 50,4" fill="${c}" />` },
  { id: 'gear',       label: 'Gear',      icon: '⚙',  path: (c) => {
    const outer = Array.from({length:8}, (_,i) => {
      const a = i*45*Math.PI/180;
      const x1=50+40*Math.cos(a), y1=50+40*Math.sin(a);
      const x2=50+48*Math.cos(a-0.15), y2=50+48*Math.sin(a-0.15);
      const x3=50+48*Math.cos(a+0.15), y3=50+48*Math.sin(a+0.15);
      return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${c}" />`;
    }).join('');
    return `${outer}<circle cx="50" cy="50" r="20" fill="${c}" /><circle cx="50" cy="50" r="10" fill="${adjust(c,-40)}" />`;
  }},
  { id: 'moon',       label: 'Crescent',  icon: '🌙',  path: (c) => `<path d="M60,4 Q90,25 90,50 Q90,75 60,96 Q80,75 80,50 Q80,25 60,4" fill="${c}" /><circle cx="50" cy="50" r="44" fill="${c}" opacity="0.3" />` },
];

const PATTERN_INNER = [
  { id: 'minimal',    label: 'Minimal',   icon: '◉',  path: (c) => `<circle cx="50" cy="45" r="22" fill="${c}" opacity="0.9" /><circle cx="50" cy="60" r="16" fill="${c}" opacity="0.6" />` },
  { id: 'geometric',  label: 'Geometric', icon: '⬠',  path: (c) => `<polygon points="50,22 72,50 62,78 38,78 28,50" fill="${c}" opacity="0.85" /><circle cx="50" cy="50" r="10" fill="${adjust(c,-30)}" />` },
  { id: 'layered',    label: 'Layered',   icon: '◎',  path: (c) => `<circle cx="50" cy="48" r="26" fill="${c}" opacity="0.5" /><circle cx="50" cy="48" r="18" fill="${c}" opacity="0.75" /><circle cx="50" cy="48" r="10" fill="${c}" />` },
  { id: 'vortex',     label: 'Vortex',    icon: '🌀',  path: (c) => `<path d="M50,28 Q65,35 60,50 Q55,65 40,60 Q25,55 30,40 Q35,25 50,28" fill="none" stroke="${c}" stroke-width="4" opacity="0.8" /><path d="M50,22 Q72,32 68,52 Q64,72 44,68 Q24,64 28,44 Q32,24 50,22" fill="none" stroke="${c}" stroke-width="3" opacity="0.5" />` },
  { id: 'dotted',     label: 'Dotted',    icon: '⋯',  path: (c) => {
    const dots = Array.from({length:5}, (_,r) => 
      Array.from({length:5}, (_,c2) => {
        const x = 15+r*18, y = 12+c2*18;
        return `<circle cx="${x}" cy="${y}" r="${3-(r-2)*(r-2)*0.1}" fill="${c}" opacity="${0.9-(r-2)*(r-2)*0.05}" />`;
      }).join('')
    ).join('');
    return dots;
  }},
  { id: 'cross',      label: 'Cross',     icon: '✛',  path: (c) => `<line x1="50" y1="20" x2="50" y2="80" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.7" /><line x1="20" y1="50" x2="80" y2="50" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.7" /><circle cx="50" cy="50" r="10" fill="${c}" />` },
  { id: 'spiral',     label: 'Spiral',    icon: '⟳',  path: (c) => `<path d="M50,50 Q55,40 60,45 Q65,55 55,60 Q40,65 35,50 Q30,30 50,25 Q75,20 80,45" fill="none" stroke="${c}" stroke-width="3" opacity="0.8" />` },
  { id: 'grid',       label: 'Grid',      icon: '⊞',  path: (c) => {
    const lines = [];
    for (let i=1; i<5; i++) {
      lines.push(`<line x1="${i*20}" y1="10" x2="${i*20}" y2="90" stroke="${c}" stroke-width="1.5" opacity="0.5" />`);
      lines.push(`<line x1="10" y1="${i*20}" x2="90" y2="${i*20}" stroke="${c}" stroke-width="1.5" opacity="0.5" />`);
    }
    return lines.join('');
  }},
  { id: 'target',     label: 'Target',    icon: '🎯',  path: (c) => `<circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="3" opacity="0.6" /><circle cx="50" cy="50" r="20" fill="none" stroke="${c}" stroke-width="3" opacity="0.7" /><circle cx="50" cy="50" r="10" fill="${c}" />` },
  { id: 'zigzag',     label: 'Zigzag',    icon: '〰',  path: (c) => `<polyline points="10,70 25,30 40,70 55,30 70,70 85,30 90,50" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" opacity="0.8" />` },
  { id: 'bubbles',    label: 'Bubbles',   icon: '○',  path: (c) => {
    const positions = [[30,35],[70,30],[50,65],[20,60],[80,55]];
    return positions.map(([x,y],i) => 
      `<circle cx="${x}" cy="${y}" r="${8-i}" fill="${c}" opacity="${0.9-i*0.15}" />`
    ).join('');
  }},
  { id: 'lightning',  label: 'Bolt',      icon: '⚡',  path: (c) => `<polygon points="55,10 35,48 50,48 40,90 70,45 52,45 65,10" fill="${c}" opacity="0.8" />` },
];

const PATTERN_ACCENT = [
  { id: 'none',       label: 'None',      icon: '—',  path: () => '' },
  { id: 'crown',      label: 'Crown',     icon: '👑',  path: (c) => `<path d="M32,28 L38,16 L50,24 L62,16 L68,28 L72,36 L28,36 Z" fill="${c}" opacity="0.9" /><circle cx="50" cy="30" r="3" fill="${c}" opacity="0.5" /><circle cx="38" cy="28" r="2.5" fill="${c}" opacity="0.5" /><circle cx="62" cy="28" r="2.5" fill="${c}" opacity="0.5" />` },
  { id: 'glasses',    label: 'Glasses',   icon: '👓',  path: (c) => `<rect x="20" y="36" width="26" height="18" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.8" /><rect x="54" y="36" width="26" height="18" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.8" /><line x1="46" y1="44" x2="54" y2="44" stroke="${c}" stroke-width="2.5" opacity="0.8" />` },
  { id: 'headband',   label: 'Headband',  icon: '🎀',  path: (c) => `<path d="M15,34 Q50,22 85,34 L82,42 Q50,32 18,42 Z" fill="${c}" opacity="0.8" /><ellipse cx="35" cy="30" rx="5" ry="4" fill="${c}" opacity="0.4" />` },
  { id: 'halo',       label: 'Halo',      icon: '😇',  path: (c) => `<ellipse cx="50" cy="14" rx="24" ry="8" fill="none" stroke="${c}" stroke-width="3" opacity="0.7" /><circle cx="50" cy="10" r="3" fill="${c}" opacity="0.4" />` },
  { id: 'eyebrows',   label: 'Expression',icon: '😊',  path: (c) => `<path d="M22,38 Q30,32 38,38" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M62,38 Q70,32 78,38" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M35,56 Q50,64 65,56" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.7" />` },
  { id: 'sparkle',    label: 'Sparkles',  icon: '✨',  path: (c) => `<text x="18" y="22" font-size="14" fill="${c}" opacity="0.8">✦</text><text x="72" y="18" font-size="10" fill="${c}" opacity="0.6">✦</text><text x="78" y="36" font-size="8" fill="${c}" opacity="0.5">✦</text>` },
  { id: 'mask',       label: 'Mystery',   icon: '🎭',  path: (c) => `<path d="M30,44 Q50,36 70,44 L66,60 Q50,56 34,60 Z" fill="${c}" opacity="0.6" /><circle cx="36" cy="48" r="3" fill="${c}" opacity="0.4" /><circle cx="64" cy="48" r="3" fill="${c}" opacity="0.4" />` },
  { id: 'wings',      label: 'Wings',     icon: '🕊',  path: (c) => `<path d="M50,50 Q30,20 10,30 Q25,40 30,50 Q20,55 5,50 Q20,65 50,50" fill="${c}" opacity="0.6" /><path d="M50,50 Q70,20 90,30 Q75,40 70,50 Q80,55 95,50 Q80,65 50,50" fill="${c}" opacity="0.6" />` },
  { id: 'scarf',      label: 'Scarf',     icon: '🧣',  path: (c) => `<path d="M20,50 Q50,44 80,50 L78,60 Q50,56 22,60 Z" fill="${c}" opacity="0.7" /><path d="M70,55 Q80,70 75,85 Q70,80 65,70 Z" fill="${c}" opacity="0.5" />` },
  { id: 'headphones', label: 'Headphones',icon: '🎧',  path: (c) => `<path d="M20,40 Q20,20 50,18 Q80,20 80,40" fill="none" stroke="${c}" stroke-width="4" opacity="0.7" /><rect x="14" y="36" width="12" height="20" rx="6" fill="${c}" opacity="0.8" /><rect x="74" y="36" width="12" height="20" rx="6" fill="${c}" opacity="0.8" />` },
  { id: 'stars',      label: 'Stars',     icon: '⭐',  path: (c) => {
    const stars = [[20,20,4],[80,15,3],[15,70,3],[85,75,4],[50,85,3]];
    return stars.map(([x,y,r]) => {
      const pts = Array.from({length:5}, (_,i) => {
        const a = (i*72-90)*Math.PI/180;
        return `${x+r*Math.cos(a)},${y+r*Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${c}" opacity="0.7" />`;
    }).join('');
  }},
  { id: 'flame',      label: 'Flame',     icon: '🔥',  path: (c) => `<path d="M50,20 Q65,40 60,55 Q55,65 50,60 Q45,65 40,55 Q35,40 50,20" fill="${c}" opacity="0.8" /><path d="M50,30 Q58,45 55,55 Q52,60 50,55 Q48,60 45,55 Q42,45 50,30" fill="${adjust(c,40)}" opacity="0.6" />` },
  { id: 'aura',       label: 'Aura',      icon: '🌈',  path: (c) => `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="2" opacity="0.3" /><circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="2" opacity="0.2" /><circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="2" opacity="0.15" />` },
  { id: 'tattoo',     label: 'Tattoo',    icon: '💠',  path: (c) => `<path d="M50,30 Q60,40 50,50 Q40,60 30,50 Q20,40 30,30 Q40,20 50,30" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" /><path d="M50,40 Q55,45 50,50 Q45,55 40,50 Q35,45 40,40 Q45,35 50,40" fill="${c}" opacity="0.4" />` },
];

const COLOR_PALETTES = [
  { name: 'Ocean',    bg: '#0ea5e9', inner: '#38bdf8', accent: '#7dd3fc', key: 'ocean' },
  { name: 'Sunset',   bg: '#f43f5e', inner: '#fb7185', accent: '#fda4af', key: 'sunset' },
  { name: 'Forest',   bg: '#059669', inner: '#34d399', accent: '#6ee7b7', key: 'forest' },
  { name: 'Lavender', bg: '#8b5cf6', inner: '#a78bfa', accent: '#c4b5fd', key: 'lavender' },
  { name: 'Amber',    bg: '#d97706', inner: '#f59e0b', accent: '#fcd34d', key: 'amber' },
  { name: 'Rose',     bg: '#e11d48', inner: '#f43f5e', accent: '#fb7185', key: 'rose' },
  { name: 'Cyan',     bg: '#06b6d4', inner: '#22d3ee', accent: '#67e8f9', key: 'cyan' },
  { name: 'Lime',     bg: '#65a30d', inner: '#84cc16', accent: '#a3e635', key: 'lime' },
  { name: 'Violet',   bg: '#7c3aed', inner: '#8b5cf6', accent: '#a78bfa', key: 'violet' },
  { name: 'Teal',     bg: '#0d9488', inner: '#14b8a6', accent: '#2dd4bf', key: 'teal' },
  { name: 'Indigo',   bg: '#4338ca', inner: '#6366f1', accent: '#818cf8', key: 'indigo' },
  { name: 'Pink',     bg: '#db2777', inner: '#ec4899', accent: '#f472b6', key: 'pink' },
  { name: 'Ruby',     bg: '#be123c', inner: '#e11d48', accent: '#fb7185', key: 'ruby' },
  { name: 'Gold',     bg: '#b45309', inner: '#d97706', accent: '#fbbf24', key: 'gold' },
  { name: 'Jade',     bg: '#047857', inner: '#059669', accent: '#34d399', key: 'jade' },
  { name: 'Sky',      bg: '#0369a1', inner: '#0ea5e9', accent: '#7dd3fc', key: 'sky' },
  { name: 'Coral',    bg: '#e11d48', inner: '#f43f5e', accent: '#fdba74', key: 'coral' },
  { name: 'Midnight', bg: '#1e1b4b', inner: '#312e81', accent: '#6366f1', key: 'midnight' },
  { name: 'Sakura',   bg: '#fdf2f8', inner: '#fbcfe8', accent: '#f9a8d4', key: 'sakura' },
  { name: 'Toxic',    bg: '#a3e635', inner: '#65a30d', accent: '#4d7c0f', key: 'toxic' },
];

// ─── Face Definitions (emoji-inspired SVG faces) ────────────────

const PATTERN_FACE = [
  { id: 'none',       label: 'No Face',   icon: '·',  path: () => '' },
  { id: 'smile',      label: 'Smile',     icon: '😊',  path: () => `<circle cx="34" cy="42" r="4" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="42" r="4" fill="#1a1a2e" opacity="0.8" /><path d="M30,56 Q50,70 70,56" fill="none" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />` },
  { id: 'happy',      label: 'Happy',     icon: '😄',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M28,52 Q50,74 72,52" fill="none" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><path d="M38,46 Q50,42 62,46" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" opacity="0.4" />` },
  { id: 'love',       label: 'Love',      icon: '😍',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M36,30 Q30,22 34,18 Q38,14 42,18 Q46,22 40,30" fill="#ff4d6d" opacity="0.7" /><path d="M64,30 Q58,22 62,18 Q66,14 70,18 Q74,22 68,30" fill="#ff4d6d" opacity="0.7" /><path d="M28,54 Q50,76 72,54" fill="none" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />` },
  { id: 'wink',       label: 'Wink',      icon: '😉',  path: () => `<circle cx="34" cy="42" r="4.5" fill="#1a1a2e" opacity="0.8" /><path d="M60,38 Q66,44 72,38" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M30,56 Q50,68 70,56" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'cool',       label: 'Cool',      icon: '😎',  path: () => `<rect x="26" y="34" width="48" height="14" rx="4" fill="#1a1a2e" opacity="0.85" /><circle cx="36" cy="41" r="3" fill="white" opacity="0.9" /><circle cx="64" cy="41" r="3" fill="white" opacity="0.9" /><path d="M32,56 Q50,66 68,56" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'surprised',  label: 'Surprised', icon: '😮',  path: () => `<circle cx="34" cy="38" r="6" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="38" r="6" fill="#1a1a2e" opacity="0.8" /><ellipse cx="50" cy="58" rx="9" ry="12" fill="#1a1a2e" opacity="0.75" /><ellipse cx="50" cy="60" rx="5" ry="8" fill="#1a1a2e" opacity="0.5" />` },
  { id: 'tongue',     label: 'Silly',     icon: '😛',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M30,52 Q50,60 70,52" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M42,58 Q50,72 58,58" fill="#ff6b8a" opacity="0.7" />` },
  { id: 'starstruck', label: 'Starstruck',icon: '🤩',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M28,54 Q50,74 72,54" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><polygon points="22,18 24,22 28,22 25,25 26,30 22,27 18,30 19,25 16,22 20,22" fill="#fbbf24" opacity="0.8" /><polygon points="78,18 80,22 84,22 81,25 82,30 78,27 74,30 75,25 72,22 76,22" fill="#fbbf24" opacity="0.8" />` },
  { id: 'sleepy',     label: 'Sleepy',    icon: '😴',  path: () => `<line x1="26" y1="40" x2="42" y2="40" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><line x1="58" y1="40" x2="74" y2="40" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><path d="M32,58 Q50,66 68,58" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.6" /><text x="72" y="22" font-size="16" fill="#1a1a2e" opacity="0.5">💤</text>` },
  { id: 'laugh',      label: 'Laughing',  icon: '😂',  path: () => `<path d="M28,36 Q34,30 40,36" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M60,36 Q66,30 72,36" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M24,52 Q50,80 76,52" fill="none" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><circle cx="38" cy="62" r="3" fill="#1a1a2e" opacity="0.2" /><circle cx="62" cy="62" r="3" fill="#1a1a2e" opacity="0.2" />` },
  { id: 'devil',      label: 'Mischief',  icon: '😈',  path: () => `<path d="M22,30 Q28,18 34,26" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M78,30 Q72,18 66,26" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><circle cx="34" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M32,54 Q50,68 68,54" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'monocle',    label: 'Scholar',   icon: '🧐',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="64" cy="40" r="8" fill="none" stroke="#1a1a2e" stroke-width="2.5" opacity="0.7" /><circle cx="64" cy="40" r="4" fill="#1a1a2e" opacity="0.8" /><line x1="72" y1="40" x2="80" y2="48" stroke="#1a1a2e" stroke-width="2" opacity="0.6" /><path d="M30,54 Q50,66 70,54" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'nerd',       label: 'Nerdy',     icon: '🤓',  path: () => `<rect x="24" y="34" width="52" height="16" rx="6" fill="none" stroke="#1a1a2e" stroke-width="2.5" opacity="0.7" /><circle cx="36" cy="42" r="4" fill="#1a1a2e" opacity="0.8" /><circle cx="64" cy="42" r="4" fill="#1a1a2e" opacity="0.8" /><path d="M28,58 Q40,66 50,58 Q60,66 72,58" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'sad',        label: 'Sad',       icon: '😢',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M32,60 Q50,50 68,60" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" /><path d="M28,52 Q34,46 40,52" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" opacity="0.5" />` },
  { id: 'angry',      label: 'Angry',     icon: '😠',  path: () => `<line x1="26" y1="34" x2="42" y2="42" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><line x1="74" y1="34" x2="58" y2="42" stroke="#1a1a2e" stroke-width="3.5" stroke-linecap="round" opacity="0.8" /><circle cx="34" cy="46" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="46" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M34,58 Q50,64 66,58" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" opacity="0.8" />` },
  { id: 'robot',      label: 'Robot',     icon: '🤖',  path: () => `<rect x="22" y="30" width="56" height="34" rx="6" fill="none" stroke="#1a1a2e" stroke-width="2.5" opacity="0.7" /><rect x="18" y="28" width="8" height="6" rx="2" fill="#1a1a2e" opacity="0.5" /><rect x="74" y="28" width="8" height="6" rx="2" fill="#1a1a2e" opacity="0.5" /><circle cx="36" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="64" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><rect x="40" y="54" width="20" height="6" rx="3" fill="#1a1a2e" opacity="0.6" />` },
  { id: 'alien',      label: 'Alien',     icon: '👽',  path: () => `<ellipse cx="34" cy="38" rx="8" ry="10" fill="#1a1a2e" opacity="0.8" /><ellipse cx="66" cy="38" rx="8" ry="10" fill="#1a1a2e" opacity="0.8" /><circle cx="34" cy="38" r="4" fill="white" opacity="0.5" /><circle cx="66" cy="38" r="4" fill="white" opacity="0.5" /><path d="M30,56 Q50,60 70,56" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" opacity="0.6" />` },
  { id: 'kissing',    label: 'Kissing',   icon: '😘',  path: () => `<circle cx="34" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="66" cy="40" r="5" fill="#1a1a2e" opacity="0.8" /><path d="M38,50 Q50,62 62,50" fill="none" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" opacity="0.7" /><path d="M66,34 Q70,28 76,32" fill="none" stroke="#ff4d6d" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'cute',       label: 'Cute',      icon: '🥺',  path: () => `<circle cx="34" cy="42" r="7" fill="#1a1a2e" opacity="0.85" /><circle cx="66" cy="42" r="7" fill="#1a1a2e" opacity="0.85" /><circle cx="36" cy="44" r="3" fill="white" opacity="0.6" /><circle cx="64" cy="44" r="3" fill="white" opacity="0.6" /><path d="M30,54 Q50,62 70,54" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'shades',     label: 'Shades',    icon: '😎',  path: () => `<line x1="24" y1="36" x2="76" y2="36" stroke="#1a1a2e" stroke-width="4" opacity="0.85" /><line x1="24" y1="36" x2="24" y2="42" stroke="#1a1a2e" stroke-width="3" opacity="0.85" /><line x1="76" y1="36" x2="76" y2="42" stroke="#1a1a2e" stroke-width="3" opacity="0.85" /><circle cx="38" cy="40" r="3" fill="white" opacity="0.7" /><circle cx="62" cy="40" r="3" fill="white" opacity="0.7" /><path d="M34,52 Q50,60 66,52" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />` },
  { id: 'clown',      label: 'Clown',     icon: '🤡',  path: () => `<circle cx="50" cy="46" r="16" fill="none" stroke="#1a1a2e" stroke-width="2.5" opacity="0.5" /><circle cx="38" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="62" cy="42" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="50" cy="54" r="5" fill="#ff4d6d" opacity="0.6" /><path d="M30,38 Q24,30 30,26 Q36,22 40,30" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.5" /><path d="M70,38 Q76,30 70,26 Q64,22 60,30" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />` },
  { id: 'ghost',      label: 'Ghost',     icon: '👻',  path: () => `<path d="M30,36 Q30,18 50,18 Q70,18 70,36 L70,66 Q64,60 58,66 Q52,72 46,66 Q40,60 34,66 L30,66 Z" fill="none" stroke="#1a1a2e" stroke-width="2.5" opacity="0.6" /><circle cx="38" cy="34" r="5" fill="#1a1a2e" opacity="0.8" /><circle cx="62" cy="34" r="5" fill="#1a1a2e" opacity="0.8" /><ellipse cx="50" cy="46" rx="4" ry="6" fill="#1a1a2e" opacity="0.5" />` },
];

// helper: lighten/darken hex
function adjust(hex, amt) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num>>16)+amt));
  const g = Math.min(255, Math.max(0, ((num>>8)&0xff)+amt));
  const b = Math.min(255, Math.max(0, (num&0xff)+amt));
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

// ─── Render Function ─────────────────────────────────────────────

function renderAvatarSvg(bgId, innerId, accentId, faceId, palette, size = 128) {
  const bgDef  = PATTERN_BG.find(p => p.id === bgId)    || PATTERN_BG[0];
  const inDef  = PATTERN_INNER.find(p => p.id === innerId) || PATTERN_INNER[0];
  const acDef  = PATTERN_ACCENT.find(p => p.id === accentId) || PATTERN_ACCENT[0];
  const faDef  = PATTERN_FACE.find(p => p.id === faceId)   || PATTERN_FACE[0];
  const pal    = palette || COLOR_PALETTES[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs>
      <clipPath id="clip"><circle cx="50" cy="50" r="50" /></clipPath>
    </defs>
    <rect width="100" height="100" rx="50" fill="#1a1a2e" />
    <g clip-path="url(#clip)">
      ${bgDef.path(pal.bg)}
      ${inDef.path(pal.inner)}
      ${acDef.path(pal.accent)}
      ${faDef.path()}
    </g>
  </svg>`;
  return svg;
}

function avatarSvgToDataUri(svgStr) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

// ─── Component ───────────────────────────────────────────────────

export default function AvatarCreator({ value, onChange, size = 128 }) {
  const [tab, setTab] = useState('bg');
  const [previewSvg, setPreviewSvg] = useState('');

  const config = value || { bg: 'circle', inner: 'minimal', accent: 'none', face: 'none', palette: COLOR_PALETTES[0] };

  const generateSvg = useCallback((cfg) => {
    const svg = renderAvatarSvg(cfg.bg, cfg.inner, cfg.accent, cfg.face, cfg.palette, size);
    setPreviewSvg(svg);
    return svg;
  }, [size]);

  const getDataUri = useCallback((cfg) => {
    const svg = renderAvatarSvg(cfg.bg, cfg.inner, cfg.accent, cfg.face, cfg.palette, size);
    return avatarSvgToDataUri(svg);
  }, [size]);

  const handleChange = (key, val) => {
    const next = { ...config, [key]: val };
    generateSvg(next);
    onChange?.(next, getDataUri(next));
  };

  const randomize = () => {
    const next = {
      bg:     PATTERN_BG[Math.floor(Math.random()*PATTERN_BG.length)].id,
      inner:  PATTERN_INNER[Math.floor(Math.random()*PATTERN_INNER.length)].id,
      accent: PATTERN_ACCENT[Math.floor(Math.random()*PATTERN_ACCENT.length)].id,
      face:   PATTERN_FACE[Math.floor(Math.random()*PATTERN_FACE.length)].id,
      palette: COLOR_PALETTES[Math.floor(Math.random()*COLOR_PALETTES.length)],
    };
    generateSvg(next);
    onChange?.(next, getDataUri(next));
  };

  // initial render
  React.useEffect(() => {
    generateSvg(config);
  }, []);

  const patternList = tab === 'bg'     ? PATTERN_BG :
                       tab === 'inner'  ? PATTERN_INNER :
                       tab === 'accent' ? PATTERN_ACCENT :
                       tab === 'face'   ? PATTERN_FACE :
                       tab === 'color'  ? COLOR_PALETTES : PATTERN_BG;

  const isColorTab = tab === 'color';

  const tabs = [
    { id: 'bg',     label: 'Shape',  icon: Shapes },
    { id: 'inner',  label: 'Pattern',icon: Layers },
    { id: 'accent', label: 'Style',  icon: Sparkles },
    { id: 'face',   label: 'Face',   icon: Smile },
    { id: 'color',  label: 'Color',  icon: Palette },
  ];

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-border/50 shadow-lg">
            {previewSvg && (
              <img src={avatarSvgToDataUri(previewSvg)} alt="Avatar preview" className="w-full h-full object-cover" />
            )}
          </div>
          <button
            type="button"
            onClick={randomize}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            title="Randomize"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/60 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              tab === t.id ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scroll">
        {patternList.map((item) => {
          const isActive = isColorTab
            ? config.palette?.key === item.key
            : config[tab] === item.id;

          if (isColorTab) {
            const p = item;
            const svgStr = renderAvatarSvg(config.bg, config.inner, config.accent, config.face, p, 40);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handleChange('palette', p)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                  isActive ? 'ring-2 ring-accent bg-accent/10 scale-105' : 'hover:bg-secondary/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-border/30">
                  <img src={avatarSvgToDataUri(svgStr)} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{p.name}</span>
              </button>
            );
          }

          const svgStr = (() => {
            if (tab === 'bg') return renderAvatarSvg(item.id, config.inner, config.accent, config.face, config.palette, 40);
            if (tab === 'inner') return renderAvatarSvg(config.bg, item.id, config.accent, config.face, config.palette, 40);
            if (tab === 'accent') return renderAvatarSvg(config.bg, config.inner, item.id, config.face, config.palette, 40);
            if (tab === 'face') return renderAvatarSvg(config.bg, config.inner, config.accent, item.id, config.palette, 40);
            return '';
          })();

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleChange(tab, item.id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                isActive ? 'ring-2 ring-accent bg-accent/10 scale-105' : 'hover:bg-secondary/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-border/30">
                <img src={avatarSvgToDataUri(svgStr)} alt={item.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Utility: export raw SVG ─────────────────────────────────────

export { renderAvatarSvg, avatarSvgToDataUri, PATTERN_BG, PATTERN_INNER, PATTERN_ACCENT, PATTERN_FACE, COLOR_PALETTES };