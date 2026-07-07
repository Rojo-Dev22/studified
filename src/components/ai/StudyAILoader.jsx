import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const PROMPTS = [
  'Consulting MoE textbooks for accurate content…',
  'Preparing your response…',
  'Finding textbook references for your topic…',
  'Drawing on teaching expertise…',
  'Crafting intuitive examples and analogies…',
  'Reviewing official curriculum standards…',
  'Preparing critical questions to challenge you…',
  'Almost ready — great question!',
];

export default function StudyAILoader({ feature = 'chat' }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % PROMPTS.length), 520);
    return () => clearInterval(id);
  }, []);

  const featureLabel = {
    chat: 'Study chat',
    summary: 'Summarize',
    quiz: 'Quiz builder',
    flashcards: 'Note cards',
  }[feature] || 'Study AI';

  return (
    <div className="flex gap-2.5 items-start w-full max-w-md">
      <div className="rounded-xl border border-accent/25 bg-gradient-to-br from-accent/5 via-card to-secondary/40 px-4 py-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">{featureLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 rounded-full bg-accent"
              style={{ width: i === step % 5 ? 20 : 6 }}
              animate={{ opacity: [0.35, 1, 0.35], scaleY: [0.6, 1, 0.6] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>

        <motion.p
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground"
        >
          {PROMPTS[step]}
        </motion.p>
      </div>
    </div>
  );
}
