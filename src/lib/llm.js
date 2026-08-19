const GROQ_DIRECT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_PROXY = '/api/groq/v1/chat/completions';
// Model available on the current Groq key (llama-3.1-8b-instant is not).
const DEFAULT_MODEL = 'groq/compound-mini';

// Client-side rate limiting: max 10 requests per 60s window
const RATE_LIMIT = { max: 10, windowMs: 60_000 };
const requestTimestamps = [];

function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length && requestTimestamps[0] <= now - RATE_LIMIT.windowMs) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT.max) {
    const oldest = requestTimestamps[0];
    const waitSec = Math.max(1, Math.ceil((oldest + RATE_LIMIT.windowMs - now) / 1000));
    throw new Error(`Rate limit reached — please wait ${waitSec}s before sending another message.`);
  }
  requestTimestamps.push(now);
}

function getBrowserApiKey() {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    localStorage.getItem('studified_groq_api_key') ||
    localStorage.getItem('monarch_groq_api_key') ||
    ''
  );
}

export function hasLLMConfigured() {
  if (getBrowserApiKey() && getBrowserApiKey() !== 'your_groq_api_key_here') return true;
  return import.meta.env.DEV;
}

export function saveGroqApiKey(key) {
  if (key) localStorage.setItem('monarch_groq_api_key', key.trim());
  else localStorage.removeItem('monarch_groq_api_key');
}

function buildMessages(promptOrMessages, system) {
  const systemMsg = {
    role: 'system',
    content:
      system ||
      'You are an expert tutor for Ethiopian secondary students (Grades 9–12) following the Ministry of Education curriculum. Answer clearly using markdown. Be accurate, structured, and study-focused.',
  };
  if (Array.isArray(promptOrMessages)) return [systemMsg, ...promptOrMessages];
  return [systemMsg, { role: 'user', content: promptOrMessages }];
}

function buildBody(promptOrMessages, system, { temperature = 0.65, max_tokens = 2048 } = {}) {
  return {
    model: import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL,
    messages: buildMessages(promptOrMessages, system),
    temperature,
    max_tokens,
  };
}

async function requestGroq(body, { signal } = {}) {
  const browserKey = getBrowserApiKey();
  const useProxy =
    import.meta.env.DEV && (!browserKey || browserKey === 'your_groq_api_key_here');
  const url = useProxy ? GROQ_PROXY : GROQ_DIRECT;
  const headers = { 'Content-Type': 'application/json' };
  if (!useProxy && browserKey) headers.Authorization = `Bearer ${browserKey}`;
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
}

export async function callLLMChat(messages, options = {}) {
  return callLLM(messages, options);
}

export async function callLLM(prompt, { system, temperature, max_tokens, timeoutMs = 9000 } = {}) {
  checkRateLimit();
  const body = buildBody(prompt, system, { temperature, max_tokens });
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await requestGroq(body, { signal: controller?.signal });
    if (!response.ok) {
      const errBody = await response.text();
      let message = `AI request failed (${response.status})`;
      try {
        const parsed = JSON.parse(errBody);
        message = parsed?.error?.message || message;
      } catch {
        if (errBody) message = errBody.slice(0, 300);
      }
      throw new Error(message);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('AI returned an empty response');
    return { text, source: 'groq' };
  } catch (err) {
    const browserKey = getBrowserApiKey();
    if (!browserKey && import.meta.env.DEV) {
      throw new Error(
        `${err.message}. Run: npm run setup:groq — get a free key at https://console.groq.com/keys`
      );
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}