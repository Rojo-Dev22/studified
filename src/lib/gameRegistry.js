// ─── Mini-game suite registry ──────────────────────────────────────
// Single source of truth shared by the /minigames hub and the
// dedicated /play/:gameId arcade space that opens in a new tab.

import SpeedEquationChain from '@/components/minigames/SpeedEquationChain';
import DefinitionDuel from '@/components/minigames/DefinitionDuel';
import LogicTower from '@/components/minigames/LogicTower';
import QuadGrid from '@/components/minigames/QuadGrid';
import TimeLineGame from '@/components/minigames/TimeLineGame';
import { Calculator, Language, Puzzle, Grid4x4, Timeline } from '@/components/ui/icons';

export const GAME_REGISTRY = [
  {
    id: 'speed-equation-chain',
    title: 'Speed-Equation Chain',
    tagline: 'Math Arcade',
    description:
      'Drag adjacent tiles to chain equations that hit the target number before the 45s clock melts. Every solve banks +3 seconds.',
    controls: 'Drag · Swipe',
    icon: Calculator,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    bgColors: ['amber', 'emerald'],
    component: SpeedEquationChain,
    tips: ['PC: click & drag across tiles', 'Mobile: swipe tile to tile', '90s clock — every solve banks +3s'],
  },
  {
    id: 'definition-duel',
    title: 'Definition Duel',
    tagline: 'Word Blitz',
    description:
      'Definitions rain down four lanes — snatch the one matching the target word before it slams into the floor.',
    controls: 'Keys 1–4 · Tap',
    icon: Language,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    bgColors: ['cyan', 'emerald'],
    component: DefinitionDuel,
    tips: ['PC: keys 1–4 pick lanes', 'Mobile: tap anywhere in a lane', '90-second duel · 3 lives · speed ramps'],
  },
  {
    id: 'logic-tower',
    title: 'The Logic Tower',
    tagline: 'Daily Deduction',
    description:
      'One fiendish five-floor deduction puzzle per day, worldwide. Keep the streak alive, then brag with emoji grids.',
    controls: 'Tap to place',
    icon: Puzzle,
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    bgColors: ['cyan', 'blue'],
    component: LogicTower,
    tips: ['One puzzle per day (UTC)', '6 attempts · 🟩 right · 🟨 wrong spot', 'Progress auto-saves'],
  },
  {
    id: 'quad-grid',
    title: 'The Quad-Grid',
    tagline: 'Category Sorting',
    description:
      'Sixteen tiles hide four secret themes of four. Find every group — but only four mistakes are allowed.',
    controls: 'Select 4 · Submit',
    icon: Grid4x4,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    bgColors: ['emerald', 'blue'],
    component: QuadGrid,
    tips: ['Pick exactly four tiles per guess', '2-minute clock · 4 mistakes max', '💡 Hints cost 15 GameCoin'],
  },
  {
    id: 'time-line',
    title: 'Time-Line',
    tagline: 'Chronological Ordering',
    description:
      'Five breakthroughs from history land scrambled — drag them into oldest-to-newest order on the timeline.',
    controls: 'Drag · Arrows',
    icon: Timeline,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    bgColors: ['blue', 'emerald'],
    component: TimeLineGame,
    tips: ['Desktop: drag cards or arrows', 'Mobile: big move buttons', '💡 Hint pins a card · 10 GameCoin'],
  },
];

export function getGame(id) {
  return GAME_REGISTRY.find((g) => g.id === id);
}
