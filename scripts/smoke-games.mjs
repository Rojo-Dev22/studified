/**
 * Runtime smoke test for the mini-game suite (lean SSR edition).
 * Loads each game + the arcade shell through Vite's SSR pipeline using
 * ONLY the React plugin (skips base44/groq dev plugins that can hang
 * headless) and renders them, surfacing runtime crashes.
 *
 * Usage: node scripts/smoke-games.mjs
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const GAME_IDS = ['speed-equation-chain', 'definition-duel', 'logic-tower', 'quad-grid', 'time-line'];

// Watchdog — never hang the shell
const watchdog = setTimeout(() => {
  console.error('WATCHDOG: smoke test exceeded 90s — aborting');
  process.exit(2);
}, 90000);
watchdog.unref();

const log = (...a) => console.error('[smoke]', ...a);

async function main() {
  const server = await createServer({
    root: process.cwd(),
    configFile: false, // skip project config (base44/groq dev plugins hang headless)
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  });

  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0, enabled: false } },
  });

  const withProviders = (node, initialPath) =>
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(MemoryRouter, { initialEntries: [initialPath] }, node)
    );

  const results = [];
  const run = async (label, fn) => {
    process.stderr.write(`[smoke] loading ${label}…\n`);
    try {
      const html = await fn();
      results.push([label, true, `${html.length} chars`]);
      log('PASS', label, `${html.length} chars`);
    } catch (err) {
      results.push([label, false, err.stack || err.message]);
      log('FAIL', label);
    }
  };

  // 1) Arcade shell per game id
  const { default: GameArcade } = await server.ssrLoadModule('/src/pages/GameArcade.jsx');
  for (const id of GAME_IDS) {
    await run(`arcade:/play/${id}`, async () =>
      renderToString(
        withProviders(
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/play/:gameId', element: React.createElement(GameArcade) })
          ),
          `/play/${id}`
        )
      )
    );
  }

  // 2) Each game component directly
  const files = {
    'speed-equation-chain': '/src/components/minigames/SpeedEquationChain.jsx',
    'definition-duel': '/src/components/minigames/DefinitionDuel.jsx',
    'logic-tower': '/src/components/minigames/LogicTower.jsx',
    'quad-grid': '/src/components/minigames/QuadGrid.jsx',
    'time-line': '/src/components/minigames/TimeLineGame.jsx',
  };
  for (const [id, file] of Object.entries(files)) {
    await run(`game:${id}`, async () => {
      const mod = await server.ssrLoadModule(file);
      return renderToString(withProviders(React.createElement(mod.default), '/'));
    });
  }

  // 3) Hub
  await run('hub:/minigames', async () => {
    const { default: MiniGames } = await server.ssrLoadModule('/src/pages/MiniGames.jsx');
    return renderToString(withProviders(React.createElement(MiniGames), '/minigames'));
  });

  let failed = 0;
  for (const [label, ok, info] of results) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${ok ? info : `\n${info}\n`}`);
    if (!ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  await server.close();
  clearTimeout(watchdog);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('SMOKE RUNNER ERROR:', e);
  process.exit(1);
});
