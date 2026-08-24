// ─── Mini-game error boundary ──────────────────────────────────────
// Wraps each game inside the arcade shell. If a game ever throws at
// runtime, players get a readable fallback + "Play again" instead of a
// blank tab, and the real stack trace lands in the console.

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle } from '@/components/ui/icons';

export default class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface the real cause in the console for debugging
    console.error('[GameErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="w-full max-w-md mx-auto text-center py-10">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1">This cabinet glitched out</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {this.props.gameTitle ? `${this.props.gameTitle} hit an unexpected error.` : 'The game hit an unexpected error.'}
          </p>
          <pre className="text-[10px] text-left text-muted-foreground bg-card border border-border rounded-lg p-3 overflow-auto max-h-32 mb-4 whitespace-pre-wrap">
            {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
          </pre>
          <Button onClick={this.reset} className="bg-accent text-accent-foreground">
            <RotateCcw className="w-4 h-4 mr-2" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
