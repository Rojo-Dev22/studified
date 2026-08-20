/**
 * Firebase Cloud Function that proxies chat completion requests to Groq.
 * Keeps GROQ_API_KEY server-side - never shipped in the browser bundle.
 *
 * In dev: Vite middleware (scripts/groq-proxy-plugin.js) handles /api/groq/.
 * In Vercel: api/groq.js (Edge/Node serverless) handles it.
 * In Firebase Hosting: this function (genaiProxy) handles /api/groq.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_BODY_BYTES = 256 * 1024; // 256 KB - generous cap for chat payloads

exports.genaiProxy = onRequest(
  {
    timeoutSeconds: 30,
    maxInstances: 10,
    memory: '256MiB',
    minInstances: 0,
  },
  async (req, res) => {
    // --- CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: { message: 'Method not allowed' } });
      return;
    }

    // --- API key ---
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      res.status(503).json({
        error: {
          message:
            'Groq is not configured on the server. Set GROQ_API_KEY in your ' +
            'Firebase project Environment Variables (Settings -> Functions -> ' +
            'Environment variables) and redeploy.',
        },
      });
      return;
    }

    // --- Parse body ---
    let payload;
    try {
      if (typeof req.body === 'object' && req.body !== null) {
        payload = req.body;
      } else if (typeof req.body === 'string') {
        payload = JSON.parse(req.body || '{}');
      } else {
        // Raw stream fallback (some proxies don't pre-parse)
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
        const raw = Buffer.concat(chunks);
        if (raw.length > MAX_BODY_BYTES) {
          res.status(413).json({ error: { message: 'Request body too large' } });
          return;
        }
        payload = JSON.parse(raw.toString() || '{}');
      }
    } catch (err) {
      logger.error('Failed to parse request body', err);
      res.status(400).json({ error: { message: 'Invalid JSON body' } });
      return;
    }

    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: { message: 'Invalid request payload' } });
      return;
    }

    // --- Forward to Groq ---
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);

      let upstream;
      try {
        upstream = await fetch(GROQ_API, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const text = await upstream.text();

      // Forward status + body
      res.status(upstream.status);
      res.setHeader('Content-Type', 'application/json');
      res.send(text);
    } catch (err) {
      const message =
        err?.name === 'AbortError'
          ? 'Groq request timed out. Please try again.'
          : err?.message || 'Proxy error';
      logger.error('Groq proxy error', err);
      res.status(500).json({ error: { message } });
    }
  }
);
