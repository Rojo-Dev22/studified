import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const WORDS = [
  'CELLS', 'ATOMS', 'BRAIN', 'HEART', 'WATER', 'LIGHT', 'SOUND', 'PLANT', 'FORCE', 'SPACE',
  'NOUNS', 'VERBS', 'PROSE', 'POEMS', 'ALGAE', 'FUNGI', 'VIRUS', 'OZONE', 'MAGMA', 'ROOTS',
  'LEAFS', 'STEMS', 'BLOOD', 'BONES', 'VEINS', 'NERVS', 'LUNGS', 'SKINS', 'TRAIT', 'GENES'
];

const ROWS = 6;
const COLS = 5;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export default function WordleGame({ onClose }) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  const initGame = useCallback(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setMessage('');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const onKeyPress = useCallback((key) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== COLS) {
        setMessage('Not enough letters');
        setTimeout(() => setMessage(''), 1500);
        return;
      }
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setMessage('You won!');
        setGameOver(true);
      } else if (newGuesses.length === ROWS) {
        setMessage(`Game Over! Word was ${targetWord}`);
        setGameOver(true);
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else {
      if (currentGuess.length < COLS && /^[A-Z]$/.test(key)) {
        setCurrentGuess((prev) => prev + key);
      }
    }
  }, [currentGuess, gameOver, guesses, targetWord]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      let key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE') {
        onKeyPress(key);
      } else if (/^[A-Z]$/.test(key)) {
        onKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const getLetterStatus = (letter, i, guess) => {
    if (targetWord[i] === letter) return 'correct';
    if (targetWord.includes(letter)) {
      // Handle multiples (simplified, doesn't perfectly handle repeated letters)
      return 'present';
    }
    return 'absent';
  };

  const usedKeys = {};
  guesses.forEach((guess) => {
    for (let i = 0; i < COLS; i++) {
      const letter = guess[i];
      const status = getLetterStatus(letter, i, guess);
      if (status === 'correct') {
        usedKeys[letter] = 'correct';
      } else if (status === 'present' && usedKeys[letter] !== 'correct') {
        usedKeys[letter] = 'present';
      } else if (status === 'absent' && !usedKeys[letter]) {
        usedKeys[letter] = 'absent';
      }
    }
  });

  return (
    <div className="flex flex-col h-full bg-background items-center p-4 justify-between">
      {/* Header */}
      <div className="flex w-full justify-between items-center mb-4">
        <div className="w-8"></div>
        <h2 className="text-xl font-bold tracking-widest uppercase">EDU-WORDLE</h2>
        <Button variant="ghost" size="icon" onClick={initGame} title="Restart">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 mb-6">
        {Array.from({ length: ROWS }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          
          return (
            <div key={rowIndex} className="flex gap-1.5 justify-center">
              {Array.from({ length: COLS }).map((_, colIndex) => {
                let letter = '';
                let status = '';
                let isFilled = false;

                if (guess) {
                  letter = guess[colIndex];
                  status = getLetterStatus(letter, colIndex, guess);
                  isFilled = true;
                } else if (isCurrentRow) {
                  letter = currentGuess[colIndex] || '';
                  isFilled = !!letter;
                }

                const bgColor = 
                  status === 'correct' ? 'bg-emerald-500 border-emerald-500 text-white' :
                  status === 'present' ? 'bg-amber-500 border-amber-500 text-white' :
                  status === 'absent' ? 'bg-zinc-600 border-zinc-600 text-white' :
                  'border-border text-foreground';

                return (
                  <motion.div
                    key={colIndex}
                    initial={false}
                    animate={guess ? { rotateX: [0, 90, 0] } : { scale: isFilled ? [1, 1.1, 1] : 1 }}
                    transition={guess ? { delay: colIndex * 0.1, duration: 0.4 } : { duration: 0.1 }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase rounded-sm ${bgColor}`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Message */}
      <div className="h-8 mb-2 flex items-center justify-center">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-foreground text-background px-3 py-1.5 rounded-md font-medium text-sm"
          >
            {message}
          </motion.div>
        )}
      </div>

      {/* Keyboard */}
      <div className="w-full max-w-lg flex flex-col gap-1.5 pb-2">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const status = usedKeys[key];
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
              
              let keyBg = 'bg-secondary text-foreground hover:bg-secondary/80';
              if (status === 'correct') keyBg = 'bg-emerald-500 text-white hover:bg-emerald-600';
              else if (status === 'present') keyBg = 'bg-amber-500 text-white hover:bg-amber-600';
              else if (status === 'absent') keyBg = 'bg-zinc-600 text-white hover:bg-zinc-700';

              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={`h-12 rounded flex items-center justify-center font-semibold text-xs sm:text-sm select-none transition-colors
                    ${isSpecial ? 'px-3 sm:px-4 text-[10px] sm:text-xs' : 'w-8 sm:w-10'}
                    ${keyBg}
                  `}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
