const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Vercel serverless function that proxies chat requests to Groq.
 * Keeps GROQ_API_KEY server-side (never shipped in the browser bundle).
 * Handles /api/groq and /api/groq/v1/chat/completions (see vercel.json rewrites).
 */
export default async function handler(req, res) {
  // CORS (harmless same-origin, useful for preview domains)
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

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    res.status(503).json({
      error: {
        message:
          'Groq is not configured on the server. Add GROQ_API_KEY in your Vercel project settings (Settings → Environment Variables) and redeploy.',
      },
    });
    return;
  }

  try {
    // req.body is auto-parsed by Vercel for application/json; fall back to raw read.
    let payload = req.body;
    if (typeof payload === 'string') {
      payload = JSON.parse(payload || '{}');
    }
    if (!payload || typeof payload !== 'object') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      payload = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    }

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
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (err) {
    const message =
      err?.name === 'AbortError'
        ? 'Groq request timed out. Please try again.'
        : err?.message || 'Proxy error';
    res.status(500).json({ error: { message } });
  }
}
