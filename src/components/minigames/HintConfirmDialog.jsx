// ─── Paid-hint confirmation dialog ─────────────────────────────────
// Shared by Quad-Grid & Time-Line. Double-checks with the player before
// spending GameCoin, then hands control back to the game via onConfirm.

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { GameCoinIcon, Lightbulb } from '@/components/ui/icons';

export default function HintConfirmDialog({ open, onOpenChange, cost, title, description, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <span className="block">{description}</span>
              <span className="block text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                <GameCoinIcon className="w-3.5 h-3.5" /> Cost: {cost} GameCoin
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No thanks</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Yes, spend {cost} 🪙
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
