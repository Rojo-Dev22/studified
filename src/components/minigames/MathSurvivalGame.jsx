import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Skull, RotateCcw } from 'lucide-react';

const ARENA_SIZE = 500;
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 20;

function generateQuestion() {
  const types = ['add', 'sub', 'mult', 'linear'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  if (type === 'add') {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    return { text: `${a} + ${b}`, answer: (a + b).toString() };
  } else if (type === 'sub') {
    const a = Math.floor(Math.random() * 20) + 10;
    const b = Math.floor(Math.random() * a);
    return { text: `${a} - ${b}`, answer: (a - b).toString() };
  } else if (type === 'mult') {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { text: `${a} × ${b}`, answer: (a * b).toString() };
  } else {
    // linear: ax + b = c
    const x = Math.floor(Math.random() * 10) + 1;
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const c = a * x + b;
    return { text: `${a}x + ${b} = ${c}, x = ?`, answer: x.toString() };
  }
}

export default function MathSurvivalGame({ onClose }) {
  const canvasRef = useRef(null);
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [question, setQuestion] = useState(generateQuestion());
  const [answerInput, setAnswerInput] = useState('');
  
  const gameState = useRef({
    enemies: [],
    lastSpawn: 0,
    spawnRate: 2000,
    baseSpeed: 0.5,
    running: true
  });

  const initGame = useCallback(() => {
    setHp(3);
    setScore(0);
    setGameOver(false);
    setQuestion(generateQuestion());
    setAnswerInput('');
    gameState.current = {
      enemies: [],
      lastSpawn: performance.now(),
      spawnRate: 2000,
      baseSpeed: 0.5,
      running: true
    };
  }, []);

  const spawnEnemy = (now) => {
    const state = gameState.current;
    if (now - state.lastSpawn > state.spawnRate) {
      const angle = Math.random() * Math.PI * 2;
      const dist = ARENA_SIZE / 2 + 20;
      const cx = ARENA_SIZE / 2;
      const cy = ARENA_SIZE / 2;
      state.enemies.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        speed: state.baseSpeed + (Math.random() * 0.5)
      });
      state.lastSpawn = now;
      state.spawnRate = Math.max(500, state.spawnRate - 50); // gets faster
      state.baseSpeed += 0.02;
    }
  };

  const updateAndDraw = useCallback((now) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = gameState.current;

    if (!state.running) return;

    ctx.clearRect(0, 0, ARENA_SIZE, ARENA_SIZE);
    
    // Draw arena background
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);
    
    // Draw grid lines
    ctx.strokeStyle = '#2d2d35';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ARENA_SIZE; i += 50) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, ARENA_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(ARENA_SIZE, i); ctx.stroke();
    }

    const cx = ARENA_SIZE / 2;
    const cy = ARENA_SIZE / 2;

    // Update enemies
    spawnEnemy(now);

    let hit = false;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      const dx = cx - e.x;
      const dy = cy - e.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
        state.enemies.splice(i, 1);
        hit = true;
        continue;
      }

      // move
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      // draw
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(e.x, e.y, ENEMY_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hit) {
      setHp(prev => {
        const newHp = prev - 1;
        if (newHp <= 0) {
          state.running = false;
          setGameOver(true);
        }
        return newHp;
      });
    }

    // Draw Player
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(cx, cy, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (state.running) {
      requestAnimationFrame(updateAndDraw);
    }
  }, []);

  useEffect(() => {
    if (!gameOver) {
      gameState.current.running = true;
      requestAnimationFrame(updateAndDraw);
    }
    return () => {
      gameState.current.running = false;
    };
  }, [gameOver, updateAndDraw]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameOver) return;

    if (answerInput.trim() === question.answer) {
      // kill closest enemy
      const state = gameState.current;
      if (state.enemies.length > 0) {
        const cx = ARENA_SIZE / 2;
        const cy = ARENA_SIZE / 2;
        let closestIdx = 0;
        let minD = Infinity;
        for (let i = 0; i < state.enemies.length; i++) {
          const d = Math.hypot(cx - state.enemies[i].x, cy - state.enemies[i].y);
          if (d < minD) {
            minD = d;
            closestIdx = i;
          }
        }
        state.enemies.splice(closestIdx, 1);
      }
      setScore(s => s + 1);
      setQuestion(generateQuestion());
      setAnswerInput('');
    } else {
      setAnswerInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background items-center p-4">
      <div className="w-full max-w-[500px] flex justify-between items-center mb-2">
        <div className="flex items-center gap-1 text-rose-500 font-bold">
          {Array.from({ length: Math.max(0, hp) }).map((_, i) => (
            <Heart key={i} className="w-5 h-5 fill-current" />
          ))}
        </div>
        <div className="text-xl font-black text-foreground">Score: {score}</div>
        <Button variant="ghost" size="icon" onClick={initGame}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative border-4 border-border rounded-xl overflow-hidden bg-[#1e1e24]" style={{ width: ARENA_SIZE, height: ARENA_SIZE }}>
        <canvas
          ref={canvasRef}
          width={ARENA_SIZE}
          height={ARENA_SIZE}
          className="block max-w-full max-h-full"
        />
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6">
            <Skull className="w-16 h-16 text-rose-500 mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>
            <p className="text-muted-foreground mb-6">You survived {score} waves!</p>
            <Button onClick={initGame} size="lg" className="bg-accent text-accent-foreground">
              Try Again
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 w-full max-w-[500px] bg-secondary p-4 rounded-xl shadow-inner border border-border flex flex-col items-center">
        <div className="text-sm text-muted-foreground font-semibold uppercase tracking-widest mb-1">Incoming Threat</div>
        <div className="text-3xl font-black text-foreground mb-4 font-mono">
          {question.text}
        </div>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            type="text"
            value={answerInput}
            onChange={e => setAnswerInput(e.target.value)}
            placeholder="Type answer..."
            className="flex-1 text-lg font-bold text-center h-12 bg-background border-border"
            autoFocus
            disabled={gameOver}
          />
          <Button type="submit" disabled={gameOver} className="h-12 px-6 bg-accent text-accent-foreground font-bold">
            FIRE!
          </Button>
        </form>
      </div>
    </div>
  );
}
