import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoteCardDeck({ deck }) {
  const cards = deck?.cards ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground text-center">
        No flashcards to display.
      </div>
    );
  }

  const card = cards[index];
  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <div className="rounded-xl border border-accent/25 bg-gradient-to-b from-card to-secondary/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">{deck.title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="p-5 perspective-[1000px]">
        <div
          className="relative mx-auto max-w-md min-h-[180px] cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${index}-${flipped}`}
              initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className={`rounded-xl border p-6 min-h-[180px] flex flex-col items-center justify-center text-center
                ${flipped
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border bg-secondary/50'
                }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {flipped ? card.back : card.front}
              </p>
              <p className="text-[10px] text-muted-foreground mt-4">Tap to flip</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-4 gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={prev} className="h-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFlipped(false)}
          className="h-8 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={next} className="h-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
