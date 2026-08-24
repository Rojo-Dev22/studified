// ─── Root error boundary ───────────────────────────────────────────
// Last-resort guard wrapped around the entire route tree. If anything
// ever throws during render (e.g. a stale HMR module after heavy
// editing), users see this readable panel instead of a blank/dark
// screen, and the real stack trace stays in the console.

import React from 'react';
import { AlertCircle } from '@/components/ui/icons';

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[RootErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      const message =
        this.state.error && this.state.error.message
          ? String(this.state.error.message)
          : String(this.state.error || 'Unknown error');
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-rose-400 mb-4" />
            <h1 className="text-lg font-bold text-foreground mb-1">Something glitched</h1>
            <p className="text-xs text-muted-foreground mb-4">
              An unexpected error interrupted the app. Reload to get back to studying.
            </p>
            <pre className="text-[10px] text-left text-muted-foreground bg-card border border-border rounded-lg p-3 overflow-auto max-h-32 mb-5 whitespace-pre-wrap">
              {message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Reload Studified
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
