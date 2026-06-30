import { loadEnv } from 'vite';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

/** Dev-only proxy so GROQ_API_KEY stays in .env.local (not bundled into the browser). */
export function groqProxyPlugin() {
  return {
    name: 'groq-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/groq/')) return next();

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: { message: 'Method not allowed' } }));
          return;
        }

        const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), '');
        const apiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;

        if (!apiKey || apiKey === 'your_groq_api_key_here') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: {
                message:
                  'Groq not configured. Run: npm run setup:groq — or add GROQ_API_KEY to .env.local',
              },
            })
          );
          return;
        }

        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString();
            const groqRes = await fetch(GROQ_API, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body,
            });
            const text = await groqRes.text();
            res.statusCode = groqRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { message: err.message || 'Proxy error' } }));
          }
        });
      });
    },
  };
}
